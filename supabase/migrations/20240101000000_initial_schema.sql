-- Initial schema for Remix Landing
-- Creates waitlist, testimonials, and faqs tables with RLS

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Waitlist ────────────────────────────────────────────────────────────────
create table if not exists waitlist (
  id          uuid primary key default uuid_generate_v4(),
  email       text unique not null check (char_length(email) > 0),
  name        text,
  created_at  timestamptz not null default now()
);

alter table waitlist enable row level security;

-- Anyone can insert into the waitlist (public signup form)
create policy "waitlist_insert_anon" on waitlist
  for insert with check (true);

-- Only service role can read (admin dashboard)
create policy "waitlist_select_service" on waitlist
  for select using (auth.role() = 'service_role');

-- ─── Testimonials ────────────────────────────────────────────────────────────
create table if not exists testimonials (
  id           uuid primary key default uuid_generate_v4(),
  author_name  text not null check (char_length(author_name) > 0),
  author_role  text,
  content      text not null check (char_length(content) > 0),
  avatar_url   text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists testimonials_featured_idx on testimonials(featured) where featured = true;

alter table testimonials enable row level security;

-- Anyone can read testimonials (displayed on public landing page)
create policy "testimonials_select_anon" on testimonials
  for select using (true);

-- Only service role can modify testimonials
create policy "testimonials_insert_service" on testimonials
  for insert with check (auth.role() = 'service_role');

create policy "testimonials_update_service" on testimonials
  for update using (auth.role() = 'service_role');

create policy "testimonials_delete_service" on testimonials
  for delete using (auth.role() = 'service_role');

-- ─── FAQs ────────────────────────────────────────────────────────────────────
create table if not exists faqs (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null check (char_length(question) > 0),
  answer      text not null check (char_length(answer) > 0),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists faqs_sort_order_idx on faqs(sort_order);

alter table faqs enable row level security;

-- Anyone can read FAQs (displayed on public landing page)
create policy "faqs_select_anon" on faqs
  for select using (true);

-- Only service role can modify FAQs
create policy "faqs_insert_service" on faqs
  for insert with check (auth.role() = 'service_role');

create policy "faqs_update_service" on faqs
  for update using (auth.role() = 'service_role');

create policy "faqs_delete_service" on faqs
  for delete using (auth.role() = 'service_role');
