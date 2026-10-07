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
  // Until hydration the page shows the unfiltered no-JS table; the pressed chip means the filter is live.
  await expect(page.getByRole("group", { name: "Safety" }).getByRole("button", { name: "destructive" })).toHaveAttribute("aria-pressed", "true");
  await expect(rows.first()).toBeVisible();
  for (const tag of await page.locator("table tbody tr .tag-safety").allTextContents()) expect(tag).toBe("destructive");
  await page.goto("/docs/reference/getSleepData");
  await expect(page.getByText("get_sleep_data").first()).toBeVisible();
  await noSideScroll(page);
});

test("reference filter keeps every keystroke and the caret under navigation latency", async ({ page }) => {
  // Any client-side navigation (an RSC fetch) is slow; the filter must not depend on one.
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.resourceType() === "fetch" || "rsc" in req.headers() || req.url().includes("_rsc=")) {
      await new Promise((r) => setTimeout(r, 250));
    }
    await route.continue();
  });
  await page.goto("/docs/reference");
  const input = page.getByRole("textbox", { name: "Filter methods" });
  await input.click();
  await input.pressSequentially("getsleepdaly", { delay: 20 });
  await input.press("ArrowLeft");
  await input.press("ArrowLeft");
  await input.pressSequentially("i", { delay: 20 });
  await page.waitForTimeout(600);
  await expect(input).toHaveValue("getsleepdaily");
  expect(await input.evaluate((el: HTMLInputElement) => el.selectionStart)).toBe("getsleepdai".length);
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "getSleepDaily", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/[?&]q=getsleepdaily/);
});

test("reference chips update the URL and the table", async ({ page }) => {
  await page.goto("/docs/reference?q=sleep");
  await expect(page.getByRole("textbox", { name: "Filter methods" })).toHaveValue("sleep");
  await page.getByRole("group", { name: "Safety" }).getByRole("button", { name: "write" }).click();
  await expect(page).toHaveURL(/safety=write/);
  await expect(page).toHaveURL(/q=sleep/);
  for (const tag of await page.locator("table tbody tr .tag-safety").allTextContents()) expect(tag).toBe("write");
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
  await expect(page).toHaveTitle("Live demo · garminconnect-js");
  await expect(page.locator("footer")).toHaveCount(1);
  await noSideScroll(page);
});

test("privacy covers the connector and the demo", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /connector/i }).first()).toBeVisible();
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("the home link keeps its accessible name", async ({ page }) => {
    await page.goto("/docs");
    const home = page.locator("header.site-header a").first();
    await expect(home).toHaveAccessibleName("garminconnect-js");
    await expect(home.locator("img")).toHaveCount(1);
    await expect(home.locator("img")).toBeVisible();
    await expect.poll(() => home.locator("img").evaluate((i: HTMLImageElement) => i.currentSrc)).toContain("title-dark.svg");
  });
});

test("security headers are sent", async ({ request }) => {
  for (const path of ["/", "/demo"]) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["content-security-policy"], path).toBe("frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
    expect(h["x-content-type-options"], path).toBe("nosniff");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
  }
});

test("unknown pages get the branded 404", async ({ page }) => {
  const res = await page.goto("/docs/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(main.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  await expect(main.getByRole("link", { name: "Use it in Claude" })).toHaveAttribute("href", "/claude");
  await expect(page.locator("header.site-header")).toBeVisible();
  await noSideScroll(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the reference lists every method", async ({ page }) => {
    await page.goto("/docs/reference");
    const total = Number(/^(\d+) methods/.exec((await page.getByText(/^\d+ methods ·/).textContent()) ?? "")?.[1]);
    expect(total).toBeGreaterThan(100);
    // The prerendered client table also sits in the HTML, inside a hidden streaming div; only the
    // fallback table is visible without JS.
    await expect(page.locator("table:visible")).toHaveCount(1);
    await expect(page.locator("table:visible tbody tr")).toHaveCount(total);
    await expect(page.locator("p:visible", { hasText: `${total} of ${total} shown` })).toHaveCount(1);
    await expect(page.getByText("Loading methods…")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "getSleepData", exact: true })).toBeVisible();
  });
});

test("old demo URLs redirect to /demo", async ({ page, request }) => {
  expect((await request.get("/?signin", { maxRedirects: 0 })).status()).toBe(307);
  await page.goto("/?signin");
  await expect(page).toHaveURL(/\/demo\?signin/);
  await page.goto("/?days=7");
  await expect(page).toHaveURL(/\/demo\?days=7$/);
});

test("search: closing the dialog cancels an Enter pressed while loading", async ({ page }) => {
  await page.route("**/search-index.json", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto("/docs");
  await page.getByRole("button", { name: /Search/ }).click();
  const box = page.getByRole("combobox", { name: "Search docs" });
  await box.fill("getSleepData");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Search/ }).click();
  await box.fill("workouts");
  await page.waitForTimeout(2500); // the index has arrived by now
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole("option").first()).toBeVisible();
});
