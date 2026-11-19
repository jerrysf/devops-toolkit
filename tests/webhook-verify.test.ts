import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseLemonOrder,
  verifyLemonSqueezySignature,
} from "@/lib/webhook-verify";

const SECRET = "test-secret-123";

function sign(body: string, secret = SECRET) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

const ORDER_BODY = JSON.stringify({
  meta: { event_id: "evt_123", event_name: "order_created" },
  data: {
    id: "order_456",
    attributes: {
      status: "paid",
      total: 3900,
      currency: "USD",
      user_email: "buyer@example.com",
      first_order_item: { product_id: 12345, variant_id: 678 },
    },
  },
});

describe("verifyLemonSqueezySignature", () => {
  it("accepts a correctly signed body", () => {
    const r = verifyLemonSqueezySignature(ORDER_BODY, sign(ORDER_BODY), SECRET);
    expect(r.ok).toBe(true);
  });

  it("rejects a tampered body", () => {
    const r = verifyLemonSqueezySignature(
      ORDER_BODY + "x",
      sign(ORDER_BODY),
      SECRET,
    );
    expect(r.ok).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const r = verifyLemonSqueezySignature(
      ORDER_BODY,
      sign(ORDER_BODY, "other"),
      SECRET,
    );
    expect(r.ok).toBe(false);
  });

  it("fails closed when no secret configured", () => {
    const r = verifyLemonSqueezySignature(ORDER_BODY, sign(ORDER_BODY), undefined);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("not configured");
  });

  it("rejects missing signature header", () => {
    const r = verifyLemonSqueezySignature(ORDER_BODY, null, SECRET);
    expect(r.ok).toBe(false);
  });
});

describe("parseLemonOrder", () => {
  it("extracts order fields", () => {
    const o = parseLemonOrder(JSON.parse(ORDER_BODY));
    expect(o).toMatchObject({
      eventId: "evt_123",
      eventName: "order_created",
      orderId: "order_456",
      productId: 12345,
      status: "paid",
      totalCents: 3900,
      currency: "USD",
      email: "buyer@example.com",
    });
  });

  it("returns null for malformed payloads", () => {
    expect(parseLemonOrder(null)).toBeNull();
    expect(parseLemonOrder("str")).toBeNull();
    expect(parseLemonOrder({})).toBeNull();
    expect(parseLemonOrder({ data: {} })).toBeNull();
  });
});
