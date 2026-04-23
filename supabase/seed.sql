-- Seed data for development
-- Run with: npx supabase db seed

-- ─── Testimonials ────────────────────────────────────────────────────────────
insert into testimonials (author_name, author_role, content, avatar_url, featured) values
  (
    'Sarah Chen',
    'CTO at Velocity',
    'We cut our deploy time from 20 minutes to under 30 seconds. The zero-downtime deploys changed how our team ships.',
    'https://i.pravatar.cc/150?u=sarah',
    true
  ),
  (
    'Marcus Johnson',
    'Lead Engineer at Stackline',
    'The built-in analytics alone saved us from bolting on three separate tools. Everything we need is in one place.',
    'https://i.pravatar.cc/150?u=marcus',
    true
  ),
  (
    'Priya Patel',
    'Founder at Launchly',
    'Security was always an afterthought for us until we switched. CSP headers, CSRF protection, encryption — all out of the box.',
    'https://i.pravatar.cc/150?u=priya',
    true
  ),
  (
    'James Wu',
    'DevOps Lead at Nextera',
    'The Pro plan paid for itself in the first week. Our team of five ships twice as fast now.',
    'https://i.pravatar.cc/150?u=james',
    false
  )
on conflict do nothing;

-- ─── FAQs ────────────────────────────────────────────────────────────────────
insert into faqs (question, answer, sort_order) values
  (
    'How long does setup take?',
    'Most teams are up and running in under five minutes. Connect your repo, configure your environment variables, and push — we handle the rest.',
    1
  ),
  (
    'Can I try it for free?',
    'Yes! The Hobby plan is completely free with no credit card required. It includes one project, community support, and 512 MB of storage.',
    2
  ),
  (
    'What happens when I hit my plan limits?',
    'We will notify you before you approach any limits. You can upgrade instantly from your dashboard with no downtime or data loss.',
    3
  ),
  (
    'Is my data secure?',
    'Absolutely. All data is encrypted at rest and in transit. We include CSRF protection, Content Security Policy headers, and SOC 2 Type II compliance on Pro and Enterprise plans.',
    4
  ),
  (
    'Can I cancel anytime?',
    'Yes, you can cancel or downgrade your plan at any time from your account settings. There are no long-term contracts or cancellation fees.',
    5
  ),
  (
    'Do you offer custom enterprise pricing?',
    'Yes. Enterprise plans include SSO, SLA guarantees, a dedicated Customer Success Manager, and audit logs. Contact our sales team for a custom quote.',
    6
  )
on conflict do nothing;
