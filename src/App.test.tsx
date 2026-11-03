import "fake-indexeddb/auto";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import App from "./App";

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
});
