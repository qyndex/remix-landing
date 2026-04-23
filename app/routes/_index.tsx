import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, isRouteErrorResponse, useRouteError } from "@remix-run/react";

interface Feature { icon: string; title: string; body: string; }
interface Plan { name: string; price: string; period: string; features: string[]; cta: string; featured?: boolean; }

export const meta: MetaFunction = () => [
  { title: "Launchpad — Build and ship faster" },
  { name: "description", content: "The modern platform for ambitious teams." },
];

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return json({
    tagline: "Build faster. Ship smarter.",
    features: [
      { icon: "⚡", title: "Instant Deploys", body: "Push to deploy in under 30 seconds with zero downtime." },
      { icon: "🔒", title: "Secure by Default", body: "End-to-end encryption, CSRF protection, and CSP headers." },
      { icon: "📈", title: "Built-in Analytics", body: "Real-time dashboards with no extra setup." },
    ] satisfies Feature[],
    plans: [
      { name: "Hobby", price: "$0", period: "/mo", features: ["1 project", "Community support", "512 MB"], cta: "Start Free" },
      { name: "Pro", price: "$29", period: "/mo", featured: true, features: ["Unlimited projects", "Priority support", "50 GB", "Custom domains"], cta: "Start Trial" },
      { name: "Enterprise", price: "Custom", period: "", features: ["SSO", "SLA", "Dedicated CSM", "Audit logs"], cta: "Contact Sales" },
    ] satisfies Plan[],
  });
}

export default function Index() {
  const { tagline, features, plans } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>{tagline}</h1>
          <p className="subtitle">The modern platform for ambitious teams. Deploy with confidence.</p>
          <div className="cta-group">
            <a href="/signup" className="btn btn-primary">Get Started Free</a>
            <a href="/demo" className="btn btn-outline">Watch Demo</a>
          </div>
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

      {/* Pricing */}
      <section className="section section-alt" aria-labelledby="pricing-heading">
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
                  {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <a href={`/signup?plan=${p.name.toLowerCase()}`} className="plan-cta">{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div className="error-page"><h1>{error.status} {error.statusText}</h1><a href="/">Home</a></div>;
  }
  return <div className="error-page"><h1>Something went wrong</h1><a href="/">Home</a></div>;
}
