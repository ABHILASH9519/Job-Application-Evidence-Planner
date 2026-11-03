import "fake-indexeddb/auto";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import App from "./App";
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
  it("keeps all application choices available while evidence search filters the lists", async () => {
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
