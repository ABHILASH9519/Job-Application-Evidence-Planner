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
