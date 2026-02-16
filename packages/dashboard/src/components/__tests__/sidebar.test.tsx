/**
 * Component Test: Sidebar
 *
 * Tests the sidebar navigation component:
 * 1. Renders all navigation items
 * 2. Highlights active route
 * 3. Contains brand elements
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../sidebar";

// Mock Next.js navigation
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders brand elements", () => {
    render(<Sidebar />);

    expect(screen.getByText("sophia")).toBeDefined();
    expect(screen.getByText(".code")).toBeDefined();
    expect(screen.getByText("Governance Dashboard")).toBeDefined();
  });

  it("renders all navigation items", () => {
    render(<Sidebar />);

    const navItems = [
      "Overview",
      "Sessions",
      "Claims",
      "Policies",
      "Memory",
      "Health",
      "Bulletin",
      "Settings",
    ];

    navItems.forEach((item) => {
      expect(screen.getByText(item)).toBeDefined();
    });
  });

  it("highlights active route", () => {
    mockUsePathname.mockReturnValue("/health");

    const { container } = render(<Sidebar />);

    // Find the active link
    const activeLink = container.querySelector("a.active");
    expect(activeLink).toBeDefined();
    expect(activeLink?.textContent).toContain("Health");
  });

  it("marks current page as active", () => {
    mockUsePathname.mockReturnValue("/sessions");

    const { container } = render(<Sidebar />);

    const activeLinks = container.querySelectorAll("a.active");
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0].textContent).toContain("Sessions");
  });
});
