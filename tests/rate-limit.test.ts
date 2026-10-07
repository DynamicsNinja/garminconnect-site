import { describe, expect, it } from "vitest";
import { clientIpFrom } from "@/lib/demo/rate-limit";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe("clientIpFrom", () => {
  it("keeps the starter's behaviour when CLIENT_IP_HEADER is unset", () => {
    expect(clientIpFrom(h({ "x-real-ip": "10.0.0.1", "x-forwarded-for": "1.2.3.4" }), undefined)).toBe("10.0.0.1");
    expect(clientIpFrom(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }), undefined)).toBe("1.2.3.4");
    expect(clientIpFrom(h({}), undefined)).toBe("unknown");
    expect(clientIpFrom(h({ "cf-connecting-ip": "9.9.9.9", "x-real-ip": "172.17.0.1" }), "")).toBe("172.17.0.1");
  });
  it("reads CLIENT_IP_HEADER first behind the Cloudflare Tunnel", () => {
    const cf = { "cf-connecting-ip": "203.0.113.7", "x-real-ip": "172.17.0.1" };
    expect(clientIpFrom(h(cf), "cf-connecting-ip")).toBe("203.0.113.7");
    expect(clientIpFrom(h(cf), "CF-Connecting-IP")).toBe("203.0.113.7");
    expect(clientIpFrom(h({ "cf-connecting-ip": "2001:db8::1" }), "cf-connecting-ip")).toBe("2001:db8::1");
  });
  it("ignores a configured header that is missing or not a single valid IP", () => {
    for (const bad of ["", "not-an-ip", "1.2.3.4, 5.6.7.8", "999.1.1.1"]) {
      expect(clientIpFrom(h({ "cf-connecting-ip": bad, "x-real-ip": "172.17.0.1" }), "cf-connecting-ip"), bad).toBe("172.17.0.1");
    }
    expect(clientIpFrom(h({ "x-real-ip": "172.17.0.1" }), "cf-connecting-ip")).toBe("172.17.0.1");
  });
});
