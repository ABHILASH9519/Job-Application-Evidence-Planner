import { db } from "./db";
import { APPLICATION_STAGES, EVIDENCE_STATUSES, type ApplicationRecord, type ApplicationStage, type EvidenceRecord, type EvidenceReport, type EvidenceStatus } from "./types";

const FIELD_LIMITS = {
  id: 128,
  company: 200,
  role: 200,
  requirement: 500,
  evidenceTitle: 200,
  url: 2048,
  shortText: 500,
  longText: 10_000,
} as const;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function timestamp(): string {
  return new Date().toISOString();
}

function requiredText(value: string, field: string, maxLength: number = FIELD_LIMITS.longText): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  return normalized;
}

function optionalText(value: string | undefined, field: string, maxLength: number = FIELD_LIMITS.longText): string {
  const normalized = value?.trim() ?? "";
  if (normalized.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  return normalized;
}

function optionalDate(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new Error(`${field} must be a valid date.`);
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) throw new Error(`${field} must be a valid date.`);
  return normalized;
}

function optionalUrl(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  if (normalized.length > FIELD_LIMITS.url) throw new Error(`${field} must be ${FIELD_LIMITS.url} characters or fewer.`);
  let parsed: URL;
  try { parsed = new URL(normalized); } catch {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  return normalized;
}

export type ApplicationInput = Pick<ApplicationRecord, "company" | "role"> &
  Partial<Pick<ApplicationRecord, "jobUrl" | "appliedAt" | "stage" | "followUpAt" | "nextStep" | "notes">>;

export type EvidenceInput = Pick<EvidenceRecord, "requirement" | "evidenceTitle"> &
  Partial<Pick<EvidenceRecord, "applicationId" | "evidenceUrl" | "contribution" | "context" | "status">>;

export async function listApplications(): Promise<ApplicationRecord[]> {
  return db.applications.orderBy("updatedAt").reverse().toArray();
}

export async function saveApplication(input: ApplicationInput, id?: string): Promise<string> {
  const now = timestamp();
  const existing = id ? await db.applications.get(id) : undefined;
  if (id && !existing) throw new Error("Application not found. Refresh the workspace and try again.");
  const stage = input.stage ?? existing?.stage ?? "saved";
  if (!APPLICATION_STAGES.includes(stage)) throw new Error("Choose a supported application stage.");
  const record: ApplicationRecord = {
    id: existing?.id ?? createId(),
    company: requiredText(input.company, "Company", FIELD_LIMITS.company),
    role: requiredText(input.role, "Role", FIELD_LIMITS.role),
    jobUrl: optionalUrl(input.jobUrl ?? "", "Job URL"),
    appliedAt: optionalDate(input.appliedAt ?? "", "Application date"),
    stage: stage as ApplicationStage,
    followUpAt: optionalDate(input.followUpAt ?? existing?.followUpAt ?? "", "Follow-up date"),
    nextStep: optionalText(input.nextStep, "Next step", FIELD_LIMITS.shortText),
    notes: optionalText(input.notes, "Notes"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.applications.put(record);
  return record.id;
}

export async function deleteApplication(id: string): Promise<void> {
  await db.transaction("rw", db.applications, db.evidence, async () => {
    const linked = await db.evidence.where("applicationId").equals(id).toArray();
    const now = timestamp();
    await Promise.all(linked.map((item) => db.evidence.put({ ...item, applicationId: undefined, updatedAt: now })));
    await db.applications.delete(id);
  });
}

export async function listEvidence(): Promise<EvidenceRecord[]> {
  return db.evidence.orderBy("updatedAt").reverse().toArray();
}

export async function saveEvidence(input: EvidenceInput, id?: string): Promise<string> {
  const now = timestamp();
  const existing = id ? await db.evidence.get(id) : undefined;
  if (id && !existing) throw new Error("Evidence item not found. Refresh the workspace and try again.");
  const status = input.status ?? existing?.status ?? "planned";
  if (!EVIDENCE_STATUSES.includes(status)) throw new Error("Choose a supported evidence status.");
  if (input.applicationId && !(await db.applications.get(input.applicationId))) {
    throw new Error("The selected application no longer exists.");
  }
  const record: EvidenceRecord = {
    id: existing?.id ?? createId(),
    applicationId: input.applicationId || undefined,
    requirement: requiredText(input.requirement, "Requirement", FIELD_LIMITS.requirement),
    evidenceTitle: requiredText(input.evidenceTitle, "Evidence title", FIELD_LIMITS.evidenceTitle),
    evidenceUrl: optionalUrl(input.evidenceUrl ?? "", "Evidence URL"),
    contribution: optionalText(input.contribution, "Contribution"),
    context: optionalText(input.context, "Context"),
    status: status as EvidenceStatus,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.evidence.put(record);
  return record.id;
}

export async function updateEvidenceStatus(id: string, status: EvidenceStatus): Promise<void> {
  if (!EVIDENCE_STATUSES.includes(status)) throw new Error("Choose a supported evidence status.");
  const record = await db.evidence.get(id);
  if (!record) throw new Error("Evidence item not found.");
  await db.evidence.put({ ...record, status, updatedAt: timestamp() });
}

export async function deleteEvidence(id: string): Promise<void> {
  await db.evidence.delete(id);
}

export async function searchRecords(query: string): Promise<{ applications: ApplicationRecord[]; evidence: EvidenceRecord[] }> {
  const normalized = query.trim().toLocaleLowerCase();
  const [applications, evidence] = await Promise.all([listApplications(), listEvidence()]);
  if (!normalized) return { applications, evidence };
  const applicationsById = new Map(applications.map((application) => [application.id, application]));
  return {
    applications: applications.filter((item) =>
      [item.company, item.role, item.jobUrl, item.appliedAt, item.stage, item.nextStep, item.notes].some((value) => value.toLocaleLowerCase().includes(normalized))
    ),
    evidence: evidence.filter((item) => {
      const linkedApplication = item.applicationId ? applicationsById.get(item.applicationId) : undefined;
      return [item.requirement, item.evidenceTitle, item.evidenceUrl, item.contribution, item.context, linkedApplication?.company ?? "", linkedApplication?.role ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(normalized));
    }),
  };
}

export async function buildEvidenceReport(): Promise<EvidenceReport> {
  const [applications, evidence] = await Promise.all([listApplications(), listEvidence()]);
  return { schemaVersion: 2, exportedAt: timestamp(), applications, evidence };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoundedString(value: unknown, maxLength: number, allowEmpty = true): value is string {
  return isString(value) && value.length <= maxLength && (allowEmpty || Boolean(value.trim()));
}

function isValidTimestamp(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isSafeOptionalDate(value: unknown): boolean {
  if (!isString(value)) return false;
  if (!value.trim()) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isSafeOptionalUrl(value: unknown): boolean {
  if (!isBoundedString(value, FIELD_LIMITS.url)) return false;
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch { return false; }
}

function isApplicationRecord(value: unknown): value is ApplicationRecord {
  if (!isObject(value)) return false;
  return isBoundedString(value.id, FIELD_LIMITS.id, false) &&
    isBoundedString(value.company, FIELD_LIMITS.company, false) &&
    isBoundedString(value.role, FIELD_LIMITS.role, false) &&
    isBoundedString(value.nextStep, FIELD_LIMITS.shortText) &&
    isBoundedString(value.notes, FIELD_LIMITS.longText) &&
    isValidTimestamp(value.createdAt) && isValidTimestamp(value.updatedAt) &&
    isBoundedString(value.jobUrl, FIELD_LIMITS.url) &&
    isBoundedString(value.appliedAt, 10) &&
    (value.stage === undefined || APPLICATION_STAGES.includes(value.stage as ApplicationStage)) &&
    (value.followUpAt === undefined || isSafeOptionalDate(value.followUpAt)) &&
    isSafeOptionalDate(value.appliedAt) && isSafeOptionalUrl(value.jobUrl);
}

function isEvidenceRecord(value: unknown): value is EvidenceRecord {
  if (!isObject(value)) return false;
  return isBoundedString(value.id, FIELD_LIMITS.id, false) &&
    isBoundedString(value.requirement, FIELD_LIMITS.requirement, false) &&
    isBoundedString(value.evidenceTitle, FIELD_LIMITS.evidenceTitle, false) &&
    isBoundedString(value.contribution, FIELD_LIMITS.longText) &&
    isBoundedString(value.context, FIELD_LIMITS.longText) &&
    isValidTimestamp(value.createdAt) && isValidTimestamp(value.updatedAt) &&
    isSafeOptionalUrl(value.evidenceUrl) &&
    (value.applicationId === undefined || isBoundedString(value.applicationId, FIELD_LIMITS.id, false)) &&
    (value.status === "planned" || value.status === "in_progress" || value.status === "completed");
}

/**
 * Merge a previously exported report into the local workspace.
 * Existing records with matching IDs are updated; unrelated local records remain untouched.
 */
export async function importEvidenceReport(raw: unknown): Promise<{ applications: number; evidence: number }> {
  if (!isObject(raw) || !Array.isArray(raw.applications) || !Array.isArray(raw.evidence)) {
    throw new Error("This file is not a valid Evidence Planner JSON report.");
  }
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 2) {
    throw new Error("This backup uses an unsupported report schema version.");
  }
  if (raw.applications.length + raw.evidence.length > 10_000) {
    throw new Error("This report exceeds the 10,000-record import limit.");
  }

  const applications = raw.applications;
  const evidence = raw.evidence;
  if (!applications.every(isApplicationRecord) || !evidence.every(isEvidenceRecord)) {
    throw new Error("The report contains an invalid application or evidence record.");
  }

  const importedApplicationIds = new Set(applications.map((item) => item.id));
  const importedEvidenceIds = new Set(evidence.map((item) => item.id));
  if (importedApplicationIds.size !== applications.length || importedEvidenceIds.size !== evidence.length) {
    throw new Error("The report contains duplicate record IDs.");
  }

  await db.transaction("rw", db.applications, db.evidence, async () => {
    const existingApplications = await db.applications.toArray();
    const availableApplicationIds = new Set([...existingApplications.map((item) => item.id), ...importedApplicationIds]);
    if (evidence.some((item) => item.applicationId && !availableApplicationIds.has(item.applicationId))) {
      throw new Error("The report contains evidence linked to an application that is not available.");
    }
    await db.applications.bulkPut(applications.map((item) => ({ ...item, stage: item.stage ?? "saved", followUpAt: item.followUpAt ?? "" })));
    await db.evidence.bulkPut(evidence);
  });

  return { applications: applications.length, evidence: evidence.length };
}
