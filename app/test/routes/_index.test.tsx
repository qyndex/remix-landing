/**
 * Unit tests for the Index route — loader, action, and component rendering.
 *
 * We mock the Supabase client at the module level so tests run without a
 * database connection, and stub useLoaderData / useFetcher for component tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.mock factories are hoisted, so refs must be too
// ---------------------------------------------------------------------------
const { mockInsert, mockFrom, mockUseFetcher } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockFrom: vi.fn(),
  mockUseFetcher: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock Supabase before importing the route
// ---------------------------------------------------------------------------
vi.mock("~/lib/supabase.server", () => ({
  createSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@remix-run/react", () => ({
  useLoaderData: vi.fn(),
  useActionData: vi.fn(() => null),
  useFetcher: mockUseFetcher,
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn(() => false),
}));

vi.mock("@remix-run/node", () => ({
  json: (data: unknown, init?: { status?: number }) => {
    if (init?.status) {
      return { ...data as Record<string, unknown>, _status: init.status };
    }
    return data;
  },
}));

// Import AFTER mocks are in place
import { default as Index, ErrorBoundary, loader, action } from "~/routes/_index";
import { useLoaderData } from "@remix-run/react";

// ---------------------------------------------------------------------------
// Helper to set up Supabase chain mocks
// ---------------------------------------------------------------------------
function setupSupabaseMocks(
  testimonials: unknown[] | null = [],
  faqs: unknown[] | null = [],
  testimonialsError: unknown = null,
  faqsError: unknown = null,
) {
  const testimonialsChain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: testimonials,
          error: testimonialsError,
        }),
      }),
    }),
  };

  const faqsChain = {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: faqs,
        error: faqsError,
      }),
    }),
  };

  mockFrom.mockImplementation((table: string) => {
    if (table === "testimonials") return testimonialsChain;
    if (table === "faqs") return faqsChain;
    return { insert: mockInsert };
  });
}

// ---------------------------------------------------------------------------
// Loader tests
// ---------------------------------------------------------------------------
describe("loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSupabaseMocks(
      [{ id: "t1", author_name: "Alice", author_role: "CEO", content: "Great product!", avatar_url: null }],
      [{ id: "f1", question: "How?", answer: "Like this." }],
    );
  });

  it("returns a tagline string", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as { tagline: string };
    expect(typeof result.tagline).toBe("string");
    expect(result.tagline.length).toBeGreaterThan(0);
  });

  it("returns exactly 3 features with icon, title, and body", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
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
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
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
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
      plans: { name: string; featured?: boolean }[];
    };
    const featuredPlan = result.plans.find((p) => p.featured);
    expect(featuredPlan?.name).toBe("Pro");
  });

  it("includes a free Hobby tier", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
      plans: { name: string; price: string }[];
    };
    const hobbyPlan = result.plans.find((p) => p.name === "Hobby");
    expect(hobbyPlan?.price).toBe("$0");
  });

  it("returns testimonials from Supabase", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
      testimonials: { id: string; author_name: string }[];
    };
    expect(result.testimonials).toHaveLength(1);
    expect(result.testimonials[0].author_name).toBe("Alice");
  });

  it("returns FAQs from Supabase", async () => {
    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
      faqs: { id: string; question: string }[];
    };
    expect(result.faqs).toHaveLength(1);
    expect(result.faqs[0].question).toBe("How?");
  });

  it("returns empty arrays when Supabase returns null data", async () => {
    setupSupabaseMocks(null, null, { message: "fail" }, { message: "fail" });

    const request = new Request("http://localhost/");
    const result = (await loader({ request, params: {}, context: {} })) as unknown as {
      testimonials: unknown[];
      faqs: unknown[];
    };
    expect(result.testimonials).toEqual([]);
    expect(result.faqs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Action tests
// ---------------------------------------------------------------------------

/** Create a POST request with URL-encoded form data for action tests. */
function postRequest(fields: Record<string, string>): Request {
  const body = new URLSearchParams(fields).toString();
  return new Request("http://localhost/", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

describe("action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
    }));
  });

  it("inserts a valid email into the waitlist", async () => {
    const request = postRequest({ email: "test@example.com", name: "Test User" });
    const result = (await action({ request, params: {}, context: {} })) as unknown as { success?: boolean };

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("waitlist");
    expect(mockInsert).toHaveBeenCalledWith({ email: "test@example.com", name: "Test User" });
  });

  it("rejects empty email", async () => {
    const request = postRequest({ email: "" });
    const result = (await action({ request, params: {}, context: {} })) as unknown as { error?: string; _status?: number };

    expect(result.error).toContain("valid email");
    expect(result._status).toBe(400);
  });

  it("rejects invalid email format", async () => {
    const request = postRequest({ email: "not-an-email" });
    const result = (await action({ request, params: {}, context: {} })) as unknown as { error?: string; _status?: number };

    expect(result.error).toContain("valid email");
    expect(result._status).toBe(400);
  });

  it("handles duplicate email (unique constraint)", async () => {
    mockInsert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    const request = postRequest({ email: "dupe@example.com" });
    const result = (await action({ request, params: {}, context: {} })) as unknown as { error?: string; _status?: number };

    expect(result.error).toContain("already on the waitlist");
    expect(result._status).toBe(409);
  });

  it("handles generic DB errors", async () => {
    mockInsert.mockResolvedValue({ error: { code: "XXXXX", message: "unknown error" } });

    const request = postRequest({ email: "fail@example.com" });
    const result = (await action({ request, params: {}, context: {} })) as unknown as { error?: string; _status?: number };

    expect(result.error).toContain("Something went wrong");
    expect(result._status).toBe(500);
  });

  it("passes null name when name field is empty", async () => {
    const request = postRequest({ email: "noname@example.com", name: "" });
    await action({ request, params: {}, context: {} });

    expect(mockInsert).toHaveBeenCalledWith({ email: "noname@example.com", name: null });
  });
});

// ---------------------------------------------------------------------------
// Component rendering tests
// ---------------------------------------------------------------------------
const mockLoaderData = {
  tagline: "Build faster. Ship smarter.",
  features: [
    { icon: "\u26A1", title: "Instant Deploys", body: "Push to deploy in under 30 seconds." },
    { icon: "\uD83D\uDD12", title: "Secure by Default", body: "End-to-end encryption." },
    { icon: "\uD83D\uDCC8", title: "Built-in Analytics", body: "Real-time dashboards." },
  ],
  plans: [
    { name: "Hobby", price: "$0", period: "/mo", featured: false, features: ["1 project"], cta: "Start Free" },
    { name: "Pro", price: "$29", period: "/mo", featured: true, features: ["Unlimited projects"], cta: "Start Trial" },
    { name: "Enterprise", price: "Custom", period: "", featured: false, features: ["SSO"], cta: "Contact Sales" },
  ],
  testimonials: [
    { id: "t1", author_name: "Sarah Chen", author_role: "CTO at Velocity", content: "Amazing product!", avatar_url: "https://example.com/avatar.jpg" },
  ],
  faqs: [
    { id: "f1", question: "How long does setup take?", answer: "Under five minutes." },
    { id: "f2", question: "Can I cancel?", answer: "Yes, anytime." },
  ],
};

describe("Index component", () => {
  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue(mockLoaderData);
    mockUseFetcher.mockReturnValue({
      Form: "form",
      state: "idle",
      data: null,
      submit: vi.fn(),
    });
  });

  it("renders the tagline in the hero section", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { level: 1, name: /build faster/i })).toBeInTheDocument();
  });

  it("renders the hero subtitle", () => {
    render(<Index />);
    expect(screen.getByText(/modern platform for ambitious teams/i)).toBeInTheDocument();
  });

  it("renders the waitlist form", () => {
    render(<Index />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
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

  it("renders testimonials section", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { name: /loved by developers/i })).toBeInTheDocument();
    expect(screen.getByText(/amazing product/i)).toBeInTheDocument();
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("CTO at Velocity")).toBeInTheDocument();
  });

  it("renders testimonial avatar when url is present", () => {
    render(<Index />);
    const avatar = document.querySelector(".testimonial-avatar") as HTMLImageElement;
    expect(avatar).toBeTruthy();
    expect(avatar.src).toContain("example.com/avatar.jpg");
  });

  it("hides testimonials section when empty", () => {
    vi.mocked(useLoaderData).mockReturnValue({ ...mockLoaderData, testimonials: [] });
    render(<Index />);
    expect(screen.queryByText(/loved by developers/i)).not.toBeInTheDocument();
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

  it("renders FAQs section", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { name: /frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByText("How long does setup take?")).toBeInTheDocument();
    expect(screen.getByText("Under five minutes.")).toBeInTheDocument();
    expect(screen.getByText("Can I cancel?")).toBeInTheDocument();
  });

  it("hides FAQs section when empty", () => {
    vi.mocked(useLoaderData).mockReturnValue({ ...mockLoaderData, faqs: [] });
    render(<Index />);
    expect(screen.queryByText(/frequently asked questions/i)).not.toBeInTheDocument();
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

  it("shows success message after waitlist submission", () => {
    mockUseFetcher.mockReturnValue({
      Form: "form",
      state: "idle",
      data: { success: true },
      submit: vi.fn(),
    });
    render(<Index />);
    expect(screen.getByText(/you are on the list/i)).toBeInTheDocument();
  });

  it("shows error message on waitlist failure", () => {
    mockUseFetcher.mockReturnValue({
      Form: "form",
      state: "idle",
      data: { error: "That email is already on the waitlist!" },
      submit: vi.fn(),
    });
    render(<Index />);
    expect(screen.getByText(/already on the waitlist/i)).toBeInTheDocument();
  });

  it("disables button while submitting", () => {
    mockUseFetcher.mockReturnValue({
      Form: "form",
      state: "submitting",
      data: null,
      submit: vi.fn(),
    });
    render(<Index />);
    expect(screen.getByRole("button", { name: /joining/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// ErrorBoundary tests
// ---------------------------------------------------------------------------
describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue(mockLoaderData);
  });

  it("renders a home link when an unknown error occurs", async () => {
    const { useRouteError, isRouteErrorResponse } = await import("@remix-run/react");
    vi.mocked(useRouteError).mockReturnValue(new Error("boom"));
    vi.mocked(isRouteErrorResponse).mockReturnValue(false);
    render(<ErrorBoundary />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("renders status code for route error responses", async () => {
    const { useRouteError, isRouteErrorResponse } = await import("@remix-run/react");
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: "Not Found", data: "" });
    vi.mocked(isRouteErrorResponse).mockReturnValue(true);
    render(<ErrorBoundary />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
