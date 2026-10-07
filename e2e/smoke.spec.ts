import { test, expect } from "@playwright/test";

test("home returns 200", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
});
