import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateFairDeal, type FairDealInput } from "./fair-deal.ts";

function baseInput(overrides: Partial<FairDealInput> = {}): FairDealInput {
  return {
    name: "FocusTimer Pro",
    description: "A".repeat(80),
    price_cents: 1900,
    billing_type: "one_time",
    cancel_url: "https://example.com/cancel",
    refund_policy: "B".repeat(100),
    refund_policy_template_id: null,
    cancel_policy_ack: false,
    trial_days: 0,
    trial_terms: null,
    status: "published",
    ...overrides,
  };
}

describe("evaluateFairDeal", () => {
  it("passes when all publish requirements are met (one-time)", () => {
    const result = evaluateFairDeal(baseInput());
    assert.equal(result.ok, true);
    assert.deepEqual(result.reasonKeys, []);
  });

  it("passes subscription with cancel ack and template + supplement", () => {
    const result = evaluateFairDeal(
      baseInput({
        billing_type: "subscription",
        cancel_policy_ack: true,
        refund_policy: "short",
        refund_policy_template_id: 1,
        refund_supplement: "C".repeat(30),
      })
    );
    assert.equal(result.ok, true);
  });

  it("fails on short name and description", () => {
    const result = evaluateFairDeal(
      baseInput({ name: "ab", description: "too short" })
    );
    assert.equal(result.ok, false);
    assert.ok(result.reasonKeys.includes("nameShort"));
    assert.ok(result.reasonKeys.includes("descriptionShort"));
  });

  it("fails when cancel URL is not https", () => {
    const result = evaluateFairDeal(
      baseInput({ cancel_url: "http://example.com/cancel" })
    );
    assert.ok(result.reasonKeys.includes("cancelUrlHttps"));
  });

  it("fails when refund policy is too short without valid template supplement", () => {
    const result = evaluateFairDeal(
      baseInput({
        refund_policy: "short",
        refund_policy_template_id: 1,
        refund_supplement: "tiny",
      })
    );
    assert.ok(result.reasonKeys.includes("refundPolicy"));
  });

  it("requires cancel_policy_ack for subscription", () => {
    const result = evaluateFairDeal(
      baseInput({
        billing_type: "subscription",
        cancel_policy_ack: false,
      })
    );
    assert.ok(result.reasonKeys.includes("subAck"));
  });

  it("requires trial_terms when trial_days > 0", () => {
    const result = evaluateFairDeal(
      baseInput({
        trial_days: 7,
        trial_terms: "short",
      })
    );
    assert.ok(result.reasonKeys.includes("trialTerms"));
  });

  it("requires published status for Fair Deal badge", () => {
    const result = evaluateFairDeal(baseInput({ status: "draft" }));
    assert.ok(result.reasonKeys.includes("notPublished"));
  });
});
