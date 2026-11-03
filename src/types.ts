export type EvidenceStatus = "planned" | "in_progress" | "completed";

export interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  jobUrl: string;
  appliedAt: string;
  nextStep: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  applicationId?: string;
  requirement: string;
  evidenceTitle: string;
  evidenceUrl: string;
  contribution: string;
  context: string;
  status: EvidenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceReport {
  exportedAt: string;
  applications: ApplicationRecord[];
  evidence: EvidenceRecord[];
}

export const EVIDENCE_STATUSES: EvidenceStatus[] = [
  "planned",
  "in_progress",
  "completed",
];