import { describe, expect, it } from "vitest";
import { getApplicationStageMetrics, getEvidenceReadinessMetrics, getStaleApplications } from "./analytics";
import type { ApplicationRecord, EvidenceRecord } from "./types";

const application = (id: string, stage: ApplicationRecord["stage"]): ApplicationRecord => ({
  id, company: "Example Co", role: "Engineer", jobUrl: "", appliedAt: "", stage,
  followUpAt: "", nextStep: "", notes: "",
  createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z",
});

const evidence = (id: string, status: EvidenceRecord["status"], applicationId?: string): EvidenceRecord => ({
  id, applicationId, requirement: "Requirement", evidenceTitle: "Project",
  evidenceUrl: "", contribution: "", context: "", status,
  createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z",
});

describe("dashboard analytics", () => {
  it("returns every pipeline stage, including empty stages, in workflow order", () => {
    const metrics = getApplicationStageMetrics([
      application("a1", "applied"),
      application("a2", "interview"),
      application("a3", "interview"),
    ]);

    expect(metrics.map(({ stage }) => stage)).toEqual([
      "saved", "applied", "assessment", "interview", "offer", "rejected",
    ]);
    expect(metrics.map(({ count }) => count)).toEqual([0, 1, 0, 2, 0, 0]);
    expect(metrics.map(({ percentage }) => percentage)).toEqual([0, 33, 0, 67, 0, 0]);
  });

  it("handles an empty pipeline without dividing by zero", () => {
    expect(getApplicationStageMetrics([]).every((metric) => metric.percentage === 0)).toBe(true);
  });

  it("summarizes evidence readiness and application linkage", () => {
    expect(getEvidenceReadinessMetrics([
      evidence("e1", "planned", "a1"),
      evidence("e2", "in_progress"),
      evidence("e3", "completed", "a2"),
      evidence("e4", "completed"),
    ])).toEqual({
      planned: 1, inProgress: 1, completed: 2,
      completionPercentage: 50, linked: 2, linkedPercentage: 50,
    });
  });

  it("handles an empty evidence library", () => {
    expect(getEvidenceReadinessMetrics([])).toEqual({
      planned: 0, inProgress: 0, completed: 0,
      completionPercentage: 0, linked: 0, linkedPercentage: 0,
    });
  });
});

describe("stale application insights", () => {
  it("returns active applications older than the threshold, oldest first", () => {
    const records = [
      { ...application("recent", "applied"), updatedAt: "2026-11-01T10:00:00.000Z" },
      { ...application("stale-20", "interview"), updatedAt: "2026-10-16T10:00:00.000Z" },
      { ...application("stale-30", "saved"), updatedAt: "2026-10-06T10:00:00.000Z" },
      { ...application("offer", "offer"), updatedAt: "2026-10-01T10:00:00.000Z" },
      { ...application("rejected", "rejected"), updatedAt: "2026-10-01T10:00:00.000Z" },
    ];
    const stale = getStaleApplications(records, "2026-11-05");
    expect(stale.map((item) => item.application.id)).toEqual(["stale-30", "stale-20"]);
    expect(stale.map((item) => item.daysSinceUpdate)).toEqual([30, 20]);
  });

  it("excludes applications at the threshold and validates threshold settings", () => {
    const exactlyFourteenDays = { ...application("boundary", "applied"), updatedAt: "2026-10-22T10:00:00.000Z" };
    expect(getStaleApplications([exactlyFourteenDays], "2026-11-05")).toHaveLength(0);
    expect(() => getStaleApplications([], "2026-11-05", 0)).toThrow("positive whole number");
  });
});
