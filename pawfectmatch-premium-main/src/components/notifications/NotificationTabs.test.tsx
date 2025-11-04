/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationTabs } from "./NotificationTabs";

function setup(opts?: Partial<React.ComponentProps<typeof NotificationTabs>>) {
  const onTabChange = vi.fn();
  const ui = render(
    <NotificationTabs
      locale="en"
      unread={{ matches: 12, messages: 1 }}
      onTabChange={onTabChange}
      storageKey="test-notif:lastTab"
      renderPanel={(k) => <div>panel-{k}</div>}
      {...opts}
    />
  );
  return { ...ui, onTabChange };
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "matchMedia").mockImplementation((q) => ({
    matches: q.includes("prefers-reduced-motion") ? false : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as any));
});

describe("NotificationTabs", () => {
  it("renders default tab and panels", () => {
    setup();
    expect(screen.getByRole("tab", { name: /All/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "" })).toBeInTheDocument();
  });

  it("unread badge caps at 9+ and is localized", () => {
    setup();
    const matches = screen.getByRole("tab", { name: /Matches/ });
    expect(matches).toBeInTheDocument();
    const badge = screen.getByText("9+");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("title", "12");
  });

  it("keyboard navigation and activation", async () => {
    const user = userEvent.setup();
    const { onTabChange } = setup();
    const all = screen.getByRole("tab", { name: /All/ });
    all.focus();
    await user.keyboard("{ArrowRight}"); // focus -> Matches
    await user.keyboard("{Enter}");      // activate Matches
    expect(onTabChange).toHaveBeenCalledWith("all", "matches");
    expect(screen.getByRole("tab", { name: /Matches/ })).toHaveAttribute("aria-selected", "true");
  });

  it("persists last tab to localStorage and restores", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: /Messages/ }));
    expect(localStorage.getItem("test-notif:lastTab")).toContain("messages");
    // re-render
    const onTabChange = vi.fn();
    render(
      <NotificationTabs
        locale="en"
        onTabChange={onTabChange}
        storageKey="test-notif:lastTab"
        renderPanel={(k) => <div>panel-{k}</div>}
      />
    );
    expect(screen.getByRole("tab", { name: /Messages/ })).toHaveAttribute("aria-selected", "true");
  });

  it("a11y roles and attributes are present", () => {
    setup();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    for (const name of ["All", "Matches", "Messages"]) {
      const tab = screen.getByRole("tab", { name });
      expect(tab).toHaveAttribute("aria-controls");
      expect(tab.id).toMatch(/tab-/);
    }
  });
});

