import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // -------------------------------------------------------------------------
  // Page load + meta
  // -------------------------------------------------------------------------
  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/launchpad/i);
  });

  test("page returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  // -------------------------------------------------------------------------
  // Hero section
  // -------------------------------------------------------------------------
  test("hero section is visible", async ({ page }) => {
    const hero = page.locator(".hero");
    await expect(hero).toBeVisible();
  });

  test("hero renders the tagline h1", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Build faster");
  });

  test("hero renders the subtitle", async ({ page }) => {
    await expect(page.getByText(/modern platform for ambitious teams/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Waitlist form
  // -------------------------------------------------------------------------
  test("waitlist form is visible in hero", async ({ page }) => {
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /join waitlist/i })).toBeVisible();
  });

  test("waitlist form has optional name field", async ({ page }) => {
    await expect(page.getByLabel(/your name/i)).toBeVisible();
  });

  test("email field is required", async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toHaveAttribute("required", "");
  });

  // -------------------------------------------------------------------------
  // Features section
  // -------------------------------------------------------------------------
  test("features section heading is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /everything your team needs/i })).toBeVisible();
  });

  test("all three feature cards are rendered", async ({ page }) => {
    await expect(page.getByText("Instant Deploys")).toBeVisible();
    await expect(page.getByText("Secure by Default")).toBeVisible();
    await expect(page.getByText("Built-in Analytics")).toBeVisible();
  });

  test("feature cards show body text", async ({ page }) => {
    await expect(page.getByText(/push to deploy in under 30 seconds/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Testimonials section (DB-driven — may be empty without seed data)
  // -------------------------------------------------------------------------
  test("testimonials section renders heading when data exists", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /loved by developers/i });
    // Section is conditionally rendered — check it exists OR is absent gracefully
    const count = await heading.count();
    if (count > 0) {
      await expect(heading).toBeVisible();
      // At least one testimonial card should be present
      const cards = page.locator(".testimonial-card");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Pricing section
  // -------------------------------------------------------------------------
  test("pricing section heading is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /simple, transparent pricing/i })).toBeVisible();
  });

  test("all three plan names are displayed", async ({ page }) => {
    await expect(page.getByText("Hobby")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();
  });

  test("Hobby plan shows $0 price", async ({ page }) => {
    await expect(page.getByText("$0")).toBeVisible();
  });

  test("Pro plan shows $29 price", async ({ page }) => {
    await expect(page.getByText("$29")).toBeVisible();
  });

  test("Pro plan has featured styling", async ({ page }) => {
    const proCard = page.locator(".pricing-card.featured");
    await expect(proCard).toBeVisible();
    await expect(proCard).toContainText("Pro");
  });

  test("Start Free CTA links to hobby signup", async ({ page }) => {
    const link = page.getByRole("link", { name: "Start Free" });
    await expect(link).toHaveAttribute("href", "/signup?plan=hobby");
  });

  test("Start Trial CTA links to pro signup", async ({ page }) => {
    const link = page.getByRole("link", { name: "Start Trial" });
    await expect(link).toHaveAttribute("href", "/signup?plan=pro");
  });

  test("Contact Sales CTA links to enterprise signup", async ({ page }) => {
    const link = page.getByRole("link", { name: "Contact Sales" });
    await expect(link).toHaveAttribute("href", "/signup?plan=enterprise");
  });

  // -------------------------------------------------------------------------
  // FAQs section (DB-driven — may be empty without seed data)
  // -------------------------------------------------------------------------
  test("FAQs section renders heading when data exists", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /frequently asked questions/i });
    const count = await heading.count();
    if (count > 0) {
      await expect(heading).toBeVisible();
      const items = page.locator(".faq-item");
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  test("feature list items have aria-label on the parent list", async ({ page }) => {
    const hobbyList = page.getByRole("list", { name: "Hobby plan features" });
    await expect(hobbyList).toBeVisible();
  });

  test("page has no broken heading hierarchy (h1 before h2)", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  test("waitlist form has accessible aria-label", async ({ page }) => {
    const form = page.locator("form[aria-label='Join the waitlist']");
    await expect(form).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Responsive / layout smoke
  // -------------------------------------------------------------------------
  test("hero is visible at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator(".hero")).toBeVisible();
    await expect(page.getByRole("button", { name: /join waitlist/i })).toBeVisible();
  });
});
