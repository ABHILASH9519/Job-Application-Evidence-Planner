import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  buildEvidenceReport,
  deleteApplication,
  deleteEvidence,
  listApplications,
  listEvidence,
  saveApplication,
  saveEvidence,
  searchRecords,
  updateEvidenceStatus,
} from "./repository";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe("application records", () => {
  it("creates, lists, updates, and deletes an application", async () => {
    const id = await saveApplication({ company: "Northstar", role: "Platform Engineer" });
    expect((await listApplications())[0]).toMatchObject({ id, company: "Northstar", role: "Platform Engineer" });

    await saveApplication({ company: "Northstar Labs", role: "Cloud Engineer" }, id);
    expect(await db.applications.get(id)).toMatchObject({ company: "Northstar Labs", role: "Cloud Engineer" });
    await deleteApplication(id);
    expect(await listApplications()).toHaveLength(0);
  });

  it("requires a company and role and validates URLs", async () => {
    await expect(saveApplication({ company: " ", role: "Engineer" })).rejects.toThrow("Company is required");
    await expect(saveApplication({ company: "Northstar", role: "Engineer", jobUrl: "javascript:alert(1)" })).rejects.toThrow("HTTP or HTTPS");
    await expect(saveApplication({ company: "Northstar", role: "Engineer" }, "missing-application")).rejects.toThrow("Application not found");
    await expect(saveEvidence({ requirement: "APIs", evidenceTitle: "Demo" }, "missing-evidence")).rejects.toThrow("Evidence item not found");
  });
});

describe("evidence records", () => {
  it("preserves evidence context and status in the report", async () => {
    const applicationId = await saveApplication({ company: "Northstar", role: "Engineer" });
    const evidenceId = await saveEvidence({
      applicationId,
      requirement: "Build APIs",
      evidenceTitle: "API test framework",
      contribution: "Designed the test cases",
      context: "Academic project",
      status: "in_progress",
    });

    const report = await buildEvidenceReport();
    expect(report.evidence[0]).toMatchObject({
      id: evidenceId,
      applicationId,
      contribution: "Designed the test cases",
      context: "Academic project",
      status: "in_progress",
    });
    expect(report.applications).toHaveLength(1);
    expect(Date.parse(report.exportedAt)).not.toBeNaN();
  });

  it("updates status and deletes evidence", async () => {
    const id = await saveEvidence({ requirement: "Debugging", evidenceTitle: "Systems project" });
    await updateEvidenceStatus(id, "completed");
    expect(await db.evidence.get(id)).toMatchObject({ status: "completed" });
    await deleteEvidence(id);
    expect(await listEvidence()).toHaveLength(0);
  });

  it("preserves evidence but unlinks it when its application is deleted", async () => {
    const applicationId = await saveApplication({ company: "Northstar", role: "Engineer" });
    const evidenceId = await saveEvidence({ applicationId, requirement: "Testing", evidenceTitle: "QA project" });
    await deleteApplication(applicationId);
    expect(await db.evidence.get(evidenceId)).toMatchObject({ applicationId: undefined });
  });

  it("searches application and evidence text", async () => {
    await saveApplication({ company: "Northstar", role: "Platform Engineer" });
    await saveEvidence({ requirement: "Kubernetes", evidenceTitle: "Cluster lab" });
    const result = await searchRecords("kubernetes");
    expect(result.evidence).toHaveLength(1);
    expect(result.applications).toHaveLength(0);
  });
});