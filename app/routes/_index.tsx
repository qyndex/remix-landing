import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import { createSupabaseClient } from "~/lib/supabase.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Feature {
  icon: string;
  title: string;
  body: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured: boolean;
}

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  content: string;
  avatar_url: string | null;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
}

type ActionData = {
  success?: boolean;
  error?: string;
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export const meta: MetaFunction = () => [
  { title: "Launchpad — Build and ship faster" },
  { name: "description", content: "The modern platform for ambitious teams." },
];

// ---------------------------------------------------------------------------
// Loader — fetch testimonials + FAQs from Supabase
// ---------------------------------------------------------------------------

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const supabase = createSupabaseClient();

  const [testimonialsResult, faqsResult] = await Promise.all([
    supabase
      .from("testimonials")
      .select("id, author_name, author_role, content, avatar_url")
      .eq("featured", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("faqs")
      .select("id, question, answer")
      .order("sort_order", { ascending: true }),
  ]);

  return json({
    tagline: "Build faster. Ship smarter.",
    features: [
      { icon: "\u26A1", title: "Instant Deploys", body: "Push to deploy in under 30 seconds with zero downtime." },
      { icon: "\uD83D\uDD12", title: "Secure by Default", body: "End-to-end encryption, CSRF protection, and CSP headers." },
      { icon: "\uD83D\uDCC8", title: "Built-in Analytics", body: "Real-time dashboards with no extra setup." },
    ] satisfies Feature[],
    plans: [
      { name: "Hobby", price: "$0", period: "/mo", featured: false, features: ["1 project", "Community support", "512 MB"], cta: "Start Free" },
      { name: "Pro", price: "$29", period: "/mo", featured: true, features: ["Unlimited projects", "Priority support", "50 GB", "Custom domains"], cta: "Start Trial" },
      { name: "Enterprise", price: "Custom", period: "", featured: false, features: ["SSO", "SLA", "Dedicated CSM", "Audit logs"], cta: "Contact Sales" },
    ] satisfies Plan[],
    testimonials: (testimonialsResult.data ?? []) as Testimonial[],
    faqs: (faqsResult.data ?? []) as Faq[],
  });
}

// ---------------------------------------------------------------------------
// Action — waitlist signup
// ---------------------------------------------------------------------------

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json<ActionData>({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("waitlist").insert({ email, name });

  if (error) {
    // Unique constraint violation — email already on waitlist
    if (error.code === "23505") {
      return json<ActionData>({ error: "That email is already on the waitlist!" }, { status: 409 });
    }
    return json<ActionData>({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return json<ActionData>({ success: true });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Index() {
  const { tagline, features, plans, testimonials, faqs } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = fetcher.state === "submitting";
  const actionData = fetcher.data;

  // Reset form on success
  useEffect(() => {
    if (actionData?.success) {
      formRef.current?.reset();
    }
  }, [actionData]);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>{tagline}</h1>
          <p className="subtitle">The modern platform for ambitious teams. Deploy with confidence.</p>

          {/* Waitlist form */}
          <fetcher.Form
            ref={formRef}
            method="post"
            className="waitlist-form"
            aria-label="Join the waitlist"
          >
            <div className="waitlist-fields">
              <input
                type="text"
                name="name"
                placeholder="Your name (optional)"
                className="waitlist-input"
                aria-label="Your name"
                disabled={isSubmitting}
              />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="waitlist-input"
                aria-label="Email address"
                required
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </button>
            </div>
            {actionData?.success && (
              <p className="waitlist-success" role="status">
                You are on the list! We will be in touch soon.
              </p>
            )}
            {actionData?.error && (
              <p className="waitlist-error" role="alert">
                {actionData.error}
              </p>
            )}
          </fetcher.Form>
        </div>
      </section>

      {/* Features */}
      <section className="section" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading">Everything your team needs</h2>
          <div className="grid-3">
            {features.map((f) => (
              <article key={f.title} className="card">
                <span className="card-icon" aria-hidden="true">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section section-alt" aria-labelledby="testimonials-heading">
          <div className="container">
            <h2 id="testimonials-heading">Loved by developers</h2>
            <div className="grid-3">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="testimonial-card">
                  <p className="testimonial-content">&ldquo;{t.content}&rdquo;</p>
                  <footer className="testimonial-footer">
                    {t.avatar_url && (
                      <img
                        src={t.avatar_url}
                        alt=""
                        className="testimonial-avatar"
                        width={40}
                        height={40}
                        loading="lazy"
                      />
                    )}
                    <div>
                      <cite className="testimonial-author">{t.author_name}</cite>
                      {t.author_role && (
                        <span className="testimonial-role">{t.author_role}</span>
                      )}
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="section" aria-labelledby="pricing-heading">
        <div className="container">
          <h2 id="pricing-heading">Simple, transparent pricing</h2>
          <div className="grid-3">
            {plans.map((p) => (
              <div key={p.name} className={`pricing-card${p.featured ? " featured" : ""}`}>
                <h3>{p.name}</h3>
                <div className="price-row">
                  <span className="price-amount">{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
                <ul className="feature-list" aria-label={`${p.name} plan features`}>
                  {p.features.map((f) => <li key={f}>{"\u2713"} {f}</li>)}
                </ul>
                <a href={`/signup?plan=${p.name.toLowerCase()}`} className="plan-cta">{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="section section-alt" aria-labelledby="faqs-heading">
          <div className="container">
            <h2 id="faqs-heading">Frequently asked questions</h2>
            <dl className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-item">
                  <dt className="faq-question">{faq.question}</dt>
                  <dd className="faq-answer">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div className="error-page"><h1>{error.status} {error.statusText}</h1><a href="/">Home</a></div>;
  }
  return <div className="error-page"><h1>Something went wrong</h1><a href="/">Home</a></div>;
}
