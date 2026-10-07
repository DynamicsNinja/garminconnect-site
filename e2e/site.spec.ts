import { expect, test, type Page } from "@playwright/test";

const noSideScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

test("landing shows both doors and the connector URL", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Connector URL")).toHaveValue("https://garmin.ficdev.xyz/mcp");
  await expect(page.getByRole("link", { name: "Set it up" })).toHaveAttribute("href", "/claude");
  await expect(page.getByRole("link", { name: "Read the docs" })).toHaveAttribute("href", "/docs");
  await noSideScroll(page);
});

test("claude page tabs and copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await page.goto("/claude");
  await expect(page.getByRole("tab", { name: "claude.ai & mobile" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Claude Code" }).click();
  await expect(page).toHaveURL(/app=code/);
  await expect(page.getByText("claude mcp add --transport http garmin https://garmin.ficdev.xyz/mcp")).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect(page.getByText(/Copied|Selected/).first()).toBeVisible();
  await noSideScroll(page);
});

test("claude tab bar keeps the active tab visible at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/claude?app=code");
  const tab = page.getByRole("tab", { name: "Claude Code" });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(async () => {
      const box = await tab.boundingBox();
      return !!box && box.x >= 0 && box.x + box.width <= 360;
    })
    .toBe(true);
});

test("a guide page renders with working in-page anchors", async ({ page }) => {
  await page.goto("/docs/authentication");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect(page.locator("pre.shiki").first()).toBeVisible();
  await noSideScroll(page);
});

test("reference filters and method page", async ({ page }) => {
  await page.goto("/docs/reference?safety=destructive");
  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
  for (const tag of await page.locator("table tbody tr .tag-safety").allTextContents()) expect(tag).toBe("destructive");
  await page.goto("/docs/reference/getSleepData");
  await expect(page.getByText("get_sleep_data").first()).toBeVisible();
  await noSideScroll(page);
});

test("search finds a method", async ({ page }) => {
  await page.goto("/docs");
  await page.getByRole("button", { name: /Search/ }).click();
  await page.getByRole("combobox", { name: "Search docs" }).fill("getSleepData");
  await expect(page.getByRole("option").first()).toBeVisible(); // the index loads on first open
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/reference\/getSleepData/);
});

test("search: Enter pressed while the index is loading still navigates", async ({ page }) => {
  await page.route("**/search-index.json", async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto("/docs");
  await page.getByRole("button", { name: /Search/ }).click();
  await page.getByRole("combobox", { name: "Search docs" }).fill("getSleepData");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/reference\/getSleepData/);
});

test("demo shows sample data", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.locator("main svg").first()).toBeVisible();
  await noSideScroll(page);
});

test("privacy covers the connector and the demo", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /connector/i }).first()).toBeVisible();
});
