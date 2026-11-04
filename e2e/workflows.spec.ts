import { expect, test } from "@playwright/test";

test("application form validates required fields and saves a pipeline stage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add application/i }).click();

  await page.getByLabel("Company name").fill("Contoso Labs");
  await page.getByLabel("Role title").fill("Cloud Engineer");
  await page.getByLabel("Pipeline stage").selectOption("interview");
  await page.getByRole("button", { name: "Save application" }).click();

  await expect(page.getByRole("status")).toContainText("Application saved locally.");
  await page.getByRole("button", { name: /applications/i }).click();
  await expect(page.getByText("Contoso Labs", { exact: true })).toBeVisible();
  await expect(page.getByText("Interview", { exact: true })).toBeVisible();
});

test("evidence can be linked to an application and marked completed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add application/i }).click();
  await page.getByLabel("Company name").fill("Fabrikam");
  await page.getByLabel("Role title").fill("Backend Engineer");
  await page.getByRole("button", { name: "Save application" }).click();

  await page.getByRole("button", { name: /evidence library/i }).click();
  await page.getByLabel("Related application").selectOption({ label: "Fabrikam — Backend Engineer" });
  await page.getByLabel("Role requirement").fill("Design reliable APIs");
  await page.getByLabel("Evidence title").fill("API automation project");
  await page.getByLabel("Your contribution").fill("Built the API regression suite");
  await page.getByLabel("Status", { exact: true }).selectOption("completed");
  await page.getByRole("button", { name: "Save evidence" }).click();

  await expect(page.getByRole("status")).toContainText("Evidence saved locally.");
  await expect(page.getByText("Design reliable APIs", { exact: true })).toBeVisible();
  await expect(page.getByText("API automation project", { exact: true })).toBeVisible();
});

test("application search filters results and clear restores them", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add application/i }).click();
  await page.getByLabel("Company name").fill("Northstar");
  await page.getByLabel("Role title").fill("Platform Engineer");
  await page.getByRole("button", { name: "Save application" }).click();

  await page.getByRole("button", { name: /applications/i }).click();
  const search = page.getByRole("textbox", { name: "Search records" });
  await search.fill("no-such-company");
  await expect(page.getByText("No roles in this stage")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByText("Northstar", { exact: true })).toBeVisible();
});

test("export action downloads a JSON report", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓ Export report" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("job-application-evidence-report.json");
  await expect(page.getByRole("status")).toContainText("Your JSON report has been exported.");
});
