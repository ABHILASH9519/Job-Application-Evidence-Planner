import { describe, expect, it } from "vitest";
import { buildWorkspaceCsv } from "./csv";
import type { ApplicationRecord, EvidenceRecord } from "./types";

const application: ApplicationRecord = {
  id: "app-1",
  company: "Northstar, Inc.",
  role: "Platform Engineer",
  jobUrl: "https://jobs.example.com/platform",
  appliedAt: "2026-11-05",
  stage: "interview",
  followUpAt: "2026-11-12",
  nextStep: "Prepare system design",
  notes: 'Said "hello", then followed up',
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-05T00:00:00.000Z",
};

const evidence: EvidenceRecord = {
  id: "evidence-1",
  applicationId: "app-1",
  requirement: "Distributed systems",
  evidenceTitle: "MapReduce project",
  evidenceUrl: "https://github.com/example/mapreduce",
  contribution: "Built worker scheduler",
  context: "Academic project",
  status: "completed",
  createdAt: "2026-11-02T00:00:00.000Z",
  updatedAt: "2026-11-05T00:00:00.000Z",
};

describe("buildWorkspaceCsv", () => {
  it("exports application and linked evidence rows with a UTF-8 BOM", () => {
    const csv = buildWorkspaceCsv([application], [evidence]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Northstar, Inc."');
    expect(csv).toContain('"Said ""hello"", then followed up"');
    expect(csv).toContain('"app-1","Northstar, Inc.","Platform Engineer"');
    expect(csv).toContain('"Distributed systems","MapReduce project"');
    expect(csv).toContain('"completed"');
  });

  it("exports unlinked evidence without inventing an application", () => {
    const unlinked = { ...evidence, applicationId: undefined };
    const csv = buildWorkspaceCsv([], [unlinked]);
    expect(csv).toContain('"evidence","evidence-1"');
    expect(csv).not.toContain('"Northstar, Inc."');
  });

  it.each(["=1+1", "+SUM(A1:A2)", "-2+3", "@SUM(A1:A2)", "\t=cmd"])(
    "neutralizes spreadsheet formula input: %s",
    (payload) => {
      const csv = buildWorkspaceCsv([{ ...application, notes: payload }], []);
      expect(csv).toContain(`"' ${payload}"`.replace("' ", "'"));
    },
  );

  it("returns a header-only document for an empty workspace", () => {
    const csv = buildWorkspaceCsv([], []);
    expect(csv.split("\\r\\n")).toHaveLength(2);
    expect(csv.endsWith("\\r\\n")).toBe(true);
  });
});
