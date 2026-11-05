import "fake-indexeddb/auto";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import App from "./App";
import * as repository from "./repository";
import { saveApplication } from "./repository";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("application workspace UI", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await db.delete();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await act(async () => root.unmount());
    await db.delete();
    container.remove();
  });

  it("renders the empty workspace and its first-use guidance", async () => {
    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(container.textContent).toContain("Evidence, organized.");
    expect(container.textContent).toContain("Your workspace starts here");
    expect(container.textContent).toContain("Private by default");
  });

  it("opens the application form from the primary action", async () => {
    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const addButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Add application"));
    expect(addButton).toBeDefined();

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Add an application");
    expect(container.querySelector('input[placeholder="e.g. Acme Technologies"]')).not.toBeNull();
    expect(container.querySelector('select')).not.toBeNull();
  });
  it("announces the active navigation item to assistive technology", async () => {
    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(container.querySelector('button[aria-current="page"]')?.textContent).toContain("Overview");
    const applicationsNav = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Applications"));
    await act(async () => applicationsNav?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(container.querySelector('button[aria-current="page"]')?.textContent).toContain("Applications");
  });

  it("exposes client-side length limits that match repository validation", async () => {
    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const addButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Add application"));
    await act(async () => addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(container.querySelector<HTMLInputElement>('input[placeholder="e.g. Acme Technologies"]')?.maxLength).toBe(200);
    expect(container.querySelector<HTMLInputElement>('input[placeholder="e.g. Software Engineer"]')?.maxLength).toBe(200);
    expect(container.querySelector<HTMLInputElement>('input[placeholder="e.g. Follow up with recruiter"]')?.maxLength).toBe(500);
  });

  it("does not report a stale search failure after a newer refresh succeeds", async () => {
    let rejectFirstRequest!: (reason: Error) => void;
    const firstRequest = new Promise<{ applications: Awaited<ReturnType<typeof repository.listApplications>>; evidence: Awaited<ReturnType<typeof repository.listEvidence>> }>((_resolve, reject) => {
      rejectFirstRequest = reject;
    });
    const searchSpy = vi.spyOn(repository, "searchRecords")
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValue({ applications: [], evidence: [] });

    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    const applicationsNav = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Applications"));
    await act(async () => applicationsNav?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const search = container.querySelector<HTMLInputElement>('input[aria-label="Search records"]');
    expect(search).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(search, "newer query");
      search?.dispatchEvent(new Event("input", { bubbles: true }));
      search?.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(searchSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      rejectFirstRequest(new Error("Superseded request failed"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("keeps all application choices available while evidence search filters the lists", async () => {
    await db.open();
    const applicationId = await saveApplication({ company: "Northstar Systems", role: "Platform Engineer" });
    await act(async () => {
      root.render(createElement(App));
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const evidenceNav = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Evidence library"));
    await act(async () => {
      evidenceNav?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const search = container.querySelector<HTMLInputElement>('input[aria-label="Search records"]');
    expect(search).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(search, "Kubernetes");
      search?.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 180));
    });

    const relatedApplication = container.querySelector<HTMLSelectElement>('select');
    expect(relatedApplication).not.toBeNull();
    expect(Array.from(relatedApplication!.options).some((option) => option.value === applicationId)).toBe(true);
  });

});
