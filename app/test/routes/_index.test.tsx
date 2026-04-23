/**
 * Unit tests for the Index route — loader + component rendering.
 *
 * We test the loader in isolation (it is a plain async function) and test the
 * rendered output by stubbing useLoaderData so the component can be mounted
 * outside of a full Remix context.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { loader } from "~/routes/_index";

// ---------------------------------------------------------------------------
// Stub Remix runtime so the component can be imported in jsdom
// ---------------------------------------------------------------------------
vi.mock("@remix-run/react", () => ({
  useLoaderData: vi.fn(),
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn(() => false),
}));

vi.mock("@remix-run/node", () => ({
  json: (data: unknown) => data,
}));

// Import AFTER mocks are in place
import { default as Index, ErrorBoundary } from "~/routes/_index";
import { useLoaderData } from "@remix-run/react";

// ---------------------------------------------------------------------------
// Loader tests
// ---------------------------------------------------------------------------
describe("loader", () => {
  it("returns a tagline string", async () => {
    const request = new Request("http://localhost/");
    const result = await loader({ request, params: {}, context: {} });
    expect(typeof (result as { tagline: string }).tagline).toBe("string");
    expect((result as { tagline: string }).tagline.length).toBeGreaterThan(0);
  });

  it("returns exactly 3 features with icon, title, and body", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as {
      features: { icon: string; title: string; body: string }[];
    };
    expect(result.features).toHaveLength(3);
    for (const f of result.features) {
      expect(f.icon).toBeTruthy();
      expect(f.title).toBeTruthy();
      expect(f.body).toBeTruthy();
    }
  });

  it("returns exactly 3 plans with name, price, and cta", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as {
      plans: { name: string; price: string; cta: string; features: string[] }[];
    };
    expect(result.plans).toHaveLength(3);
    for (const p of result.plans) {
      expect(p.name).toBeTruthy();
      expect(p.price).toBeTruthy();
      expect(p.cta).toBeTruthy();
      expect(Array.isArray(p.features)).toBe(true);
    }
  });

  it("marks the Pro plan as featured", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as {
      plans: { name: string; featured?: boolean }[];
    };
    const featuredPlan = result.plans.find((p) => p.featured);
    expect(featuredPlan?.name).toBe("Pro");
  });

  it("includes a free Hobby tier", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as {
      plans: { name: string; price: string }[];
    };
    const hobbyPlan = result.plans.find((p) => p.name === "Hobby");
    expect(hobbyPlan?.price).toBe("$0");
  });
});

// ---------------------------------------------------------------------------
// Component rendering tests
// ---------------------------------------------------------------------------
const mockLoaderData = {
  tagline: "Build faster. Ship smarter.",
  features: [
    { icon: "⚡", title: "Instant Deploys", body: "Push to deploy in under 30 seconds." },
    { icon: "🔒", title: "Secure by Default", body: "End-to-end encryption." },
    { icon: "📈", title: "Built-in Analytics", body: "Real-time dashboards." },
  ],
  plans: [
    { name: "Hobby", price: "$0", period: "/mo", features: ["1 project"], cta: "Start Free" },
    { name: "Pro", price: "$29", period: "/mo", featured: true, features: ["Unlimited projects"], cta: "Start Trial" },
    { name: "Enterprise", price: "Custom", period: "", features: ["SSO"], cta: "Contact Sales" },
  ],
};

describe("Index component", () => {
  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue(mockLoaderData);
  });

  it("renders the tagline in the hero section", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { level: 1, name: /build faster/i })).toBeInTheDocument();
  });

  it("renders the hero subtitle", () => {
    render(<Index />);
    expect(screen.getByText(/modern platform for ambitious teams/i)).toBeInTheDocument();
  });

  it("renders the Get Started Free CTA button", () => {
    render(<Index />);
    const cta = screen.getByRole("link", { name: /get started free/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/signup");
  });

  it("renders the Watch Demo link", () => {
    render(<Index />);
    const demo = screen.getByRole("link", { name: /watch demo/i });
    expect(demo).toBeInTheDocument();
    expect(demo).toHaveAttribute("href", "/demo");
  });

  it("renders the features section heading", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { name: /everything your team needs/i })).toBeInTheDocument();
  });

  it("renders all three feature cards", () => {
    render(<Index />);
    expect(screen.getByText("Instant Deploys")).toBeInTheDocument();
    expect(screen.getByText("Secure by Default")).toBeInTheDocument();
    expect(screen.getByText("Built-in Analytics")).toBeInTheDocument();
  });

  it("renders feature card bodies", () => {
    render(<Index />);
    expect(screen.getByText(/push to deploy in under 30 seconds/i)).toBeInTheDocument();
  });

  it("renders the pricing section heading", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { name: /simple, transparent pricing/i })).toBeInTheDocument();
  });

  it("renders all three plan names", () => {
    render(<Index />);
    expect(screen.getByText("Hobby")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("renders plan CTA links with correct href", () => {
    render(<Index />);
    const hobbyLink = screen.getByRole("link", { name: "Start Free" });
    expect(hobbyLink).toHaveAttribute("href", "/signup?plan=hobby");

    const proLink = screen.getByRole("link", { name: "Start Trial" });
    expect(proLink).toHaveAttribute("href", "/signup?plan=pro");

    const enterpriseLink = screen.getByRole("link", { name: "Contact Sales" });
    expect(enterpriseLink).toHaveAttribute("href", "/signup?plan=enterprise");
  });

  it("feature list has aria-label for accessibility", () => {
    render(<Index />);
    expect(screen.getByRole("list", { name: "Hobby plan features" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Pro plan features" })).toBeInTheDocument();
  });

  it("features section is landmark-labelled for accessibility", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { name: /everything your team needs/i })).toHaveAttribute(
      "id",
      "features-heading"
    );
  });

  it("renders feature icons with aria-hidden", () => {
    render(<Index />);
    const icons = document.querySelectorAll(".card-icon");
    for (const icon of Array.from(icons)) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});

// ---------------------------------------------------------------------------
// ErrorBoundary tests
// ---------------------------------------------------------------------------
describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue(mockLoaderData);
  });

  it("renders a home link when an unknown error occurs", () => {
    const { useRouteError, isRouteErrorResponse } = await import("@remix-run/react");
    vi.mocked(useRouteError).mockReturnValue(new Error("boom"));
    vi.mocked(isRouteErrorResponse).mockReturnValue(false);
    render(<ErrorBoundary />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("renders status code for route error responses", () => {
    const { useRouteError, isRouteErrorResponse } = await import("@remix-run/react");
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: "Not Found", data: "" });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);
    render(<ErrorBoundary />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
