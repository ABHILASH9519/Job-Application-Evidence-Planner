import { db } from "./db";
import { EVIDENCE_STATUSES, type ApplicationRecord, type EvidenceRecord, type EvidenceReport, type EvidenceStatus } from "./types";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function timestamp(): string {
  return new Date().toISOString();
}

function requiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function optionalUrl(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  return normalized;
}

export type ApplicationInput = Pick<ApplicationRecord, "company" | "role"> &
  Partial<Pick<ApplicationRecord, "jobUrl" | "appliedAt" | "nextStep" | "notes">>;

export type EvidenceInput = Pick<EvidenceRecord, "requirement" | "evidenceTitle"> &
  Partial<Pick<EvidenceRecord, "applicationId" | "evidenceUrl" | "contribution" | "context" | "status">>;

export async function listApplications(): Promise<ApplicationRecord[]> {
  return db.applications.orderBy("updatedAt").reverse().toArray();
}

export async function saveApplication(input: ApplicationInput, id?: string): Promise<string> {
  const now = timestamp();
  const existing = id ? await db.applications.get(id) : undefined;
  if (id && !existing) throw new Error("Application not found. Refresh the workspace and try again.");
  const record: ApplicationRecord = {
    id: existing?.id ?? createId(),
    company: requiredText(input.company, "Company"),
    role: requiredText(input.role, "Role"),
    jobUrl: optionalUrl(input.jobUrl ?? "", "Job URL"),
    appliedAt: input.appliedAt ?? "",
    nextStep: input.nextStep?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
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
    await Promise.all(linked.map((item) => db.evidence.put({
      ...item,
      applicationId: undefined,
      updatedAt: now,
    })));
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
    requirement: requiredText(input.requirement, "Requirement"),
    evidenceTitle: requiredText(input.evidenceTitle, "Evidence title"),
    evidenceUrl: optionalUrl(input.evidenceUrl ?? "", "Evidence URL"),
    contribution: input.contribution?.trim() ?? "",
    context: input.context?.trim() ?? "",
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
  return {
    applications: applications.filter((item) =>
      [item.company, item.role, item.nextStep, item.notes].some((value) => value.toLocaleLowerCase().includes(normalized))
    ),
    evidence: evidence.filter((item) => {
      const linkedApplication = applications.find((application) => application.id === item.applicationId);
      return [
        item.requirement,
        item.evidenceTitle,
        item.contribution,
        item.context,
        linkedApplication?.company ?? "",
        linkedApplication?.role ?? "",
      ].some((value) => value.toLocaleLowerCase().includes(normalized));
    }),
  };
}

export async function buildEvidenceReport(): Promise<EvidenceReport> {
  const [applications, evidence] = await Promise.all([listApplications(), listEvidence()]);
  return { exportedAt: timestamp(), applications, evidence };
}