import { expect, test } from "@playwright/test";

test("an application can be created and survives a page reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Evidence, organized." })).toBeVisible();

  await page.getByRole("button", { name: /add application/i }).click();
  await page.getByLabel("Company name").fill("Northstar Systems");
  await page.getByLabel("Role title").fill("Platform Engineer");
  await page.getByLabel("Job posting URL").fill("https://example.com/jobs/platform-engineer");
  await page.getByRole("button", { name: "Save application" }).click();

  await expect(page.getByRole("status")).toContainText("Application saved locally.");
  await expect(page.getByText("Northstar Systems", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /applications/i }).click();
  await expect(page.getByText("Northstar Systems", { exact: true })).toBeVisible();
  await expect(page.getByText("Platform Engineer", { exact: true })).toBeVisible();
});

test("a versioned backup restores applications and linked evidence", async ({ page }) => {
  const timestamp = "2026-11-05T10:00:00.000Z";
  const backup = {
    schemaVersion: 2,
    exportedAt: timestamp,
    applications: [{
      id: "browser-import-app",
      company: "Imported Systems",
      role: "Reliability Engineer",
      jobUrl: "https://example.com/jobs/reliability",
      appliedAt: "2026-11-05",
      stage: "interview",
      followUpAt: "2026-11-12",
      nextStep: "Prepare incident response examples",
      notes: "Imported from a test backup",
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    evidence: [{
      id: "browser-import-evidence",
      applicationId: "browser-import-app",
      requirement: "Production incident response",
      evidenceTitle: "Service reliability project",
      evidenceUrl: "https://github.com/example/reliability-project",
      contribution: "Implemented alerting and recovery automation",
      context: "Academic project",
      status: "completed",
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
  };

  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "evidence-planner-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByRole("status")).toContainText("Imported 1 applications and 1 evidence items.");
  await page.getByRole("button", { name: /applications/i }).click();
  await expect(page.getByText("Imported Systems")).toBeVisible();
  await expect(page.getByRole("article").getByText("Interview", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /evidence library/i }).click();
  await expect(page.getByText("Production incident response", { exact: true })).toBeVisible();
  await expect(page.getByText("Service reliability project")).toBeVisible();
  await expect(page.getByText("Imported Systems")).toBeVisible();
});

test("an unsupported backup version is rejected without creating records", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "future-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 99, applications: [], evidence: [] })),
  });

  await expect(page.getByRole("alert")).toContainText("unsupported report schema version");
  await page.getByRole("button", { name: /applications/i }).click();
  await expect(page.getByText("No applications yet")).toBeVisible();
});

test("deleting an application preserves its evidence as unlinked", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add application/i }).click();
  await page.getByLabel("Company name").fill("Continuity Labs");
  await page.getByLabel("Role title").fill("Systems Engineer");
  await page.getByRole("button", { name: "Save application" }).click();

  await page.getByRole("button", { name: /evidence library/i }).click();
  await page.getByLabel("Related application").selectOption({ label: "Continuity Labs — Systems Engineer" });
  await page.getByLabel("Role requirement").fill("Design resilient services");
  await page.getByLabel("Evidence title").fill("Fault-tolerant worker project");
  await page.getByLabel("Your contribution").fill("Implemented retry and recovery behavior");
  await page.getByRole("button", { name: "Save evidence" }).click();
  await expect(page.getByText("Design resilient services", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /applications/i }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete application" }).click();
  await expect(page.getByRole("status")).toContainText("Related evidence was preserved.");

  await page.getByRole("button", { name: /evidence library/i }).click();
  await expect(page.getByText("Design resilient services", { exact: true })).toBeVisible();
  await expect(page.getByText("Fault-tolerant worker project")).toBeVisible();
  await expect(page.getByRole("article").getByText("General evidence")).toBeVisible();
});
