/**
 * Unit tests for the root layout — ErrorBoundary rendering.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@remix-run/react", () => ({
  Links: () => null,
  Meta: () => null,
  Outlet: () => <div data-testid="outlet" />,
  Scripts: () => null,
  ScrollRestoration: () => null,
  isRouteErrorResponse: vi.fn(() => false),
  useRouteError: vi.fn(),
}));

import { ErrorBoundary, Layout } from "~/root";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

describe("Layout", () => {
  it("renders children inside an html element", () => {
    const { container } = render(<Layout>{"hello"}</Layout>);
    expect(container.innerHTML).toContain("hello");
  });
});

describe("root ErrorBoundary", () => {
  it("shows status and statusText for route error responses", () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: "Internal Server Error", data: "Oops" });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);
    render(<ErrorBoundary />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/Internal Server Error/)).toBeInTheDocument();
  });

  it("shows error message for generic Error objects", () => {
    vi.mocked(useRouteError).mockReturnValue(new Error("something broke"));
    vi.mocked(isRouteErrorResponse).mockReturnValue(false);
    render(<ErrorBoundary />);
    expect(screen.getByText(/something broke/i)).toBeInTheDocument();
  });

  it("shows fallback text for non-Error unknowns", () => {
    vi.mocked(useRouteError).mockReturnValue("string error");
    vi.mocked(isRouteErrorResponse).mockReturnValue(false);
    render(<ErrorBoundary />);
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it("renders a Go home link", () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: "Not Found", data: "" });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);
    render(<ErrorBoundary />);
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});
