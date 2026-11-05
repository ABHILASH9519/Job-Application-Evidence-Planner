import type { ApplicationRecord, EvidenceRecord } from "./types";

const COLUMNS = [
  "record_type",
  "id",
  "company",
  "role",
  "job_url",
  "applied_at",
  "application_stage",
  "follow_up_at",
  "next_step",
  "application_notes",
  "linked_application_id",
  "linked_application_company",
  "linked_application_role",
  "requirement",
  "evidence_title",
  "evidence_url",
  "contribution",
  "context",
  "evidence_status",
] as const;

type CsvValue = string | undefined;

function escapeCell(value: CsvValue): string {
  let normalized = value ?? "";
  // Prevent spreadsheet applications from evaluating imported text as a formula.
  if (/^[\\s]*[=+@-]/.test(normalized) || /^[\\t\\r]/.test(normalized)) {
    normalized = `'${normalized}`;
  }
  return `"${normalized.replace(/"/g, '""')}"`;
}

function serializeRow(values: CsvValue[]): string {
  return values.map(escapeCell).join(",");
}

export function buildWorkspaceCsv(
  applications: ApplicationRecord[],
  evidence: EvidenceRecord[],
): string {
  const applicationsById = new Map(applications.map((item) => [item.id, item]));
  const rows = [serializeRow([...COLUMNS])];

  for (const item of applications) {
    rows.push(serializeRow([
      "application", item.id, item.company, item.role, item.jobUrl,
      item.appliedAt, item.stage ?? "saved", item.followUpAt, item.nextStep,
      item.notes,
    ]));
  }

  for (const item of evidence) {
    const linked = item.applicationId ? applicationsById.get(item.applicationId) : undefined;
    rows.push(serializeRow([
      "evidence", item.id, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, item.applicationId,
      linked?.company, linked?.role, item.requirement, item.evidenceTitle,
      item.evidenceUrl, item.contribution, item.context, item.status,
    ]));
  }

  return `\\uFEFF${rows.join("\\r\\n")}\\r\\n`;
}
