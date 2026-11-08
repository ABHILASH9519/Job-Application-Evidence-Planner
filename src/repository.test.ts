import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  buildEvidenceReport,
  importEvidenceReport,
  deleteApplication,
  deleteEvidence,
  listApplications,
  listEvidence,
  saveApplication,
  saveEvidence,
  searchRecords,
  updateEvidenceStatus,
  updateFollowUpDate,
  updateApplicationStage,
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
    expect((await listApplications())[0]).toMatchObject({ id, company: "Northstar", role: "Platform Engineer", stage: "saved", followUpAt: "" });

    await saveApplication({ company: "Northstar Labs", role: "Cloud Engineer" }, id);
    expect(await db.applications.get(id)).toMatchObject({ company: "Northstar Labs", role: "Cloud Engineer" });
    await deleteApplication(id);
    expect(await listApplications()).toHaveLength(0);
  });

  it("persists valid pipeline stages and follow-up dates", async () => {
    const id = await saveApplication({ company: "Northstar", role: "Engineer", stage: "interview", followUpAt: "2026-11-12" });
    expect(await db.applications.get(id)).toMatchObject({ stage: "interview", followUpAt: "2026-11-12" });
    await expect(saveApplication({ company: "Northstar", role: "Engineer", stage: "invalid" as never })).rejects.toThrow("supported application stage");
    await expect(saveApplication({ company: "Northstar", role: "Engineer", followUpAt: "2026-02-30" })).rejects.toThrow("Follow-up date must be a valid date");
  });


  it("updates an application stage directly with validation", async () => {
    const id = await saveApplication({ company: "Stage Co", role: "Engineer", stage: "saved" });
    await updateApplicationStage(id, "interview");
    expect(await db.applications.get(id)).toMatchObject({ stage: "interview" });
    await expect(updateApplicationStage(id, "unknown" as never)).rejects.toThrow("supported application stage");
    await expect(updateApplicationStage("missing-id", "applied")).rejects.toThrow("Application not found");
  });
  it("reschedules and clears follow-up dates with validation", async () => {
    const id = await saveApplication({ company: "Follow-up Co", role: "Engineer", followUpAt: "2026-11-10" });
    await updateFollowUpDate(id, "2026-11-17");
    expect(await db.applications.get(id)).toMatchObject({ followUpAt: "2026-11-17" });

    await updateFollowUpDate(id, "");
    expect(await db.applications.get(id)).toMatchObject({ followUpAt: "" });

    await expect(updateFollowUpDate(id, "2026-02-30")).rejects.toThrow("Follow-up date must be a valid date");
    await expect(updateFollowUpDate("missing-id", "2026-11-20")).rejects.toThrow("Application not found");
  });
  it("imports legacy backups with default pipeline and follow-up fields", async () => {
    const legacyApplication = {
      id: "legacy-application", company: "Legacy Co", role: "Engineer", jobUrl: "", appliedAt: "",
      nextStep: "", notes: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    };
    await importEvidenceReport({ applications: [legacyApplication], evidence: [] });
    expect(await db.applications.get("legacy-application")).toMatchObject({ stage: "saved", followUpAt: "" });
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
    expect(report.schemaVersion).toBe(2);
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


  it("validates evidence URLs and linked applications", async () => {
    await expect(
      saveEvidence({
        requirement: "Secure APIs",
        evidenceTitle: "Unsafe link",
        evidenceUrl: "javascript:alert(1)",
      }),
    ).rejects.toThrow("Evidence URL must be a valid HTTP or HTTPS URL.");

    await expect(
      saveEvidence({
        applicationId: "missing-application",
        requirement: "Secure APIs",
        evidenceTitle: "Unlinked application",
      }),
    ).rejects.toThrow("The selected application no longer exists.");

    const id = await saveEvidence({
      requirement: "Secure APIs",
      evidenceTitle: "Security review",
      evidenceUrl: "https://example.com/security-review",
    });
    expect(await db.evidence.get(id)).toMatchObject({
      evidenceUrl: "https://example.com/security-review",
    });
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

  it("merges a valid JSON report without deleting unrelated local records", async () => {
    const localId = await saveApplication({ company: "Local Company", role: "Engineer" });
    const importedApplication = {
      id: "imported-application",
      company: "Imported Company",
      role: "Cloud Engineer",
      jobUrl: "",
      appliedAt: "2026-11-03",
      stage: "applied" as const,
      followUpAt: "2026-11-10",
      nextStep: "",
      notes: "",
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };
    const importedEvidence = {
      id: "imported-evidence",
      applicationId: importedApplication.id,
      requirement: "Cloud infrastructure",
      evidenceTitle: "Terraform project",
      evidenceUrl: "",
      contribution: "Built reusable modules",
      context: "",
      status: "completed" as const,
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };

    const counts = await importEvidenceReport({
      exportedAt: "2026-11-03T00:00:00.000Z",
      applications: [importedApplication],
      evidence: [importedEvidence],
    });

    expect(counts).toEqual({ applications: 1, evidence: 1 });
    expect(await db.applications.get(localId)).toBeDefined();
    expect(await db.applications.get(importedApplication.id)).toBeDefined();
    expect(await db.evidence.get(importedEvidence.id)).toMatchObject({ status: "completed" });
  });

  it("rejects malformed reports and dangling application references", async () => {
    await expect(importEvidenceReport({ applications: "not-an-array", evidence: [] }))
      .rejects.toThrow("not a valid Evidence Planner JSON report");

    const unsafeApplication = {
      id: "unsafe",
      company: "Example",
      role: "Engineer",
      jobUrl: "javascript:alert(1)",
      appliedAt: "",
      stage: "saved" as const,
      followUpAt: "",
      nextStep: "",
      notes: "",
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };
    await expect(importEvidenceReport({ applications: [unsafeApplication], evidence: [] }))
      .rejects.toThrow("invalid application or evidence record");

    await expect(importEvidenceReport({ applications: [{ ...unsafeApplication, jobUrl: "", stage: "unknown" }], evidence: [] }))
      .rejects.toThrow("invalid application or evidence record");

    const duplicate = {
      id: "duplicate",
      company: "Example",
      role: "Engineer",
      jobUrl: "",
      appliedAt: "",
      nextStep: "",
      notes: "",
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };
    await expect(importEvidenceReport({ applications: [duplicate, duplicate], evidence: [] }))
      .rejects.toThrow("duplicate record IDs");

    await expect(importEvidenceReport({
      applications: [],
      evidence: [{
        id: "orphan",
        applicationId: "missing-application",
        requirement: "Testing",
        evidenceTitle: "Test suite",
        evidenceUrl: "",
        contribution: "",
        context: "",
        status: "planned",
        createdAt: "2026-11-03T00:00:00.000Z",
        updatedAt: "2026-11-03T00:00:00.000Z",
      }],
    })).rejects.toThrow("linked to an application that is not available");
  });

  it("rejects oversized user-entered fields before persistence", async () => {
    await expect(saveApplication({ company: "x".repeat(201), role: "Engineer" }))
      .rejects.toThrow("Company must be 200 characters or fewer");
    await expect(saveEvidence({ requirement: "x".repeat(501), evidenceTitle: "Portfolio" }))
      .rejects.toThrow("Requirement must be 500 characters or fewer");
    await expect(saveEvidence({ requirement: "Testing", evidenceTitle: "x".repeat(201) }))
      .rejects.toThrow("Evidence title must be 200 characters or fewer");
    await expect(saveApplication({ company: "Acme", role: "Engineer", nextStep: "x".repeat(501) }))
      .rejects.toThrow("Next step must be 500 characters or fewer");
  });

  it("does not partially import applications when an evidence relationship is invalid", async () => {
    const importedApplication = {
      id: "transaction-app",
      company: "Transactional Import",
      role: "Platform Engineer",
      jobUrl: "",
      appliedAt: "",
      stage: "saved" as const,
      followUpAt: "",
      nextStep: "",
      notes: "",
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };
    const orphanEvidence = {
      id: "transaction-evidence",
      applicationId: "missing-parent",
      requirement: "Reliable systems",
      evidenceTitle: "Distributed worker project",
      evidenceUrl: "",
      contribution: "",
      context: "",
      status: "planned" as const,
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    };

    await expect(importEvidenceReport({
      schemaVersion: 2,
      applications: [importedApplication],
      evidence: [orphanEvidence],
    })).rejects.toThrow("linked to an application that is not available");

    expect(await db.applications.get(importedApplication.id)).toBeUndefined();
    expect(await db.evidence.get(orphanEvidence.id)).toBeUndefined();
  });

  it("rejects backup records with invalid timestamps or oversized fields", async () => {
    const valid = {
      id: "valid-app", company: "Example", role: "Engineer", jobUrl: "", appliedAt: "",
      stage: "saved" as const, followUpAt: "", nextStep: "", notes: "",
      createdAt: "2026-11-03T00:00:00.000Z", updatedAt: "2026-11-03T00:00:00.000Z",
    };
    await expect(importEvidenceReport({ applications: [{ ...valid, createdAt: "yesterday" }], evidence: [] }))
      .rejects.toThrow("invalid application or evidence record");
    await expect(importEvidenceReport({ applications: [{ ...valid, company: "x".repeat(201) }], evidence: [] }))
      .rejects.toThrow("invalid application or evidence record");
  });

  it("rejects backups from unsupported future schema versions", async () => {
    await expect(importEvidenceReport({ schemaVersion: 99, applications: [], evidence: [] }))
      .rejects.toThrow("unsupported report schema version");
  });

  it("rejects backup files exceeding the record-count limit", async () => {
    await expect(importEvidenceReport({ applications: Array(10_001).fill({}), evidence: [] }))
      .rejects.toThrow("10,000-record import limit");
  });

  it("searches application dates, stages, and job URLs", async () => {
    await saveApplication({
      company: "Searchable Employer",
      role: "Systems Engineer",
      jobUrl: "https://careers.example.com/role-123",
      appliedAt: "2026-11-04",
      stage: "interview",
    });
    expect((await searchRecords("role-123")).applications).toHaveLength(1);
    expect((await searchRecords("2026-11-04")).applications).toHaveLength(1);
    expect((await searchRecords("interview")).applications).toHaveLength(1);
  });

  it("searches evidence URLs", async () => {
    await saveEvidence({
      requirement: "Cloud automation",
      evidenceTitle: "Infrastructure project",
      evidenceUrl: "https://github.com/example/terraform-lab",
    });
    expect((await searchRecords("terraform-lab")).evidence).toHaveLength(1);
  });

  it("searches application and evidence text", async () => {
    const applicationId = await saveApplication({ company: "Northstar Systems", role: "Platform Engineer" });
    await saveEvidence({ applicationId, requirement: "Container orchestration", evidenceTitle: "Cluster lab" });
    await saveEvidence({ requirement: "Kubernetes", evidenceTitle: "Independent cluster lab" });

    const byRequirement = await searchRecords("kubernetes");
    expect(byRequirement.evidence).toHaveLength(1);
    expect(byRequirement.applications).toHaveLength(0);

    const byLinkedCompany = await searchRecords("northstar");
    expect(byLinkedCompany.evidence).toHaveLength(1);
    expect(byLinkedCompany.applications).toHaveLength(1);
  });
});