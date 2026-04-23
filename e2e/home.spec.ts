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
  // CTA buttons
  // -------------------------------------------------------------------------
  test("Get Started Free CTA is visible and links to /signup", async ({ page }) => {
    const cta = page.getByRole("link", { name: /get started free/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signup");
  });

  test("Watch Demo CTA is visible and links to /demo", async ({ page }) => {
    const demo = page.getByRole("link", { name: /watch demo/i });
    await expect(demo).toBeVisible();
    await expect(demo).toHaveAttribute("href", "/demo");
  });

  test("clicking Get Started Free navigates to /signup", async ({ page }) => {
    await page.getByRole("link", { name: /get started free/i }).click();
    await expect(page).toHaveURL(/\/signup/);
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

  // -------------------------------------------------------------------------
  // Responsive / layout smoke
  // -------------------------------------------------------------------------
  test("hero is visible at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator(".hero")).toBeVisible();
    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible();
  });
});
