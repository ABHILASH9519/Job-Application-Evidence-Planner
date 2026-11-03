import Dexie, { type EntityTable } from "dexie";
import type { ApplicationRecord, EvidenceRecord } from "./types";

class EvidencePlannerDatabase extends Dexie {
  applications!: EntityTable<ApplicationRecord, "id">;
  evidence!: EntityTable<EvidenceRecord, "id">;

  constructor() {
    super("job-application-evidence-planner");
    this.version(1).stores({
      applications: "id, company, role, appliedAt, updatedAt",
      evidence: "id, applicationId, requirement, evidenceTitle, status, updatedAt",
    });
    this.version(2)
      .stores({
        applications: "id, company, role, appliedAt, stage, followUpAt, updatedAt",
        evidence: "id, applicationId, requirement, evidenceTitle, status, updatedAt",
      })
      .upgrade((transaction) => transaction.table("applications").toCollection().modify((record: ApplicationRecord) => {
        if (!record.stage) record.stage = "saved";
        if (!record.followUpAt) record.followUpAt = "";
      }));
  }
}

export const db = new EvidencePlannerDatabase();