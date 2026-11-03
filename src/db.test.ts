import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./db";

describe("IndexedDB schema migration", () => {
  afterEach(async () => {
    await db.delete();
  });

  it("upgrades version 1 application records with default stage and follow-up fields", async () => {
    await db.delete();

    const legacy = new Dexie("job-application-evidence-planner");
    legacy.version(1).stores({
      applications: "id, company, role, appliedAt, updatedAt",
      evidence: "id, applicationId, requirement, evidenceTitle, status, updatedAt",
    });

    await legacy.open();
    await legacy.table("applications").put({
      id: "legacy-app",
      company: "Legacy Company",
      role: "Software Engineer",
      jobUrl: "",
      appliedAt: "2026-10-01",
      nextStep: "Follow up",
      notes: "Created before pipeline stages",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    });
    await legacy.close();

    await db.open();

    expect(db.verno).toBe(2);
    expect(await db.applications.get("legacy-app")).toMatchObject({
      stage: "saved",
      followUpAt: "",
      company: "Legacy Company",
    });
  });
});
