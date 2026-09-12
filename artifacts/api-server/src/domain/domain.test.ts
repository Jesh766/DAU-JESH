import { describe, expect, it } from "vitest";
import { CreateListingBody } from "@workspace/api-zod";
import { assertPositiveEnergy, assertValidAvailability, calculateSurplus } from "./energy";
import { decideGrid } from "./grid";
import { scoreMatch } from "./matching";
import { hashTransaction } from "./ledger";
import { demoStore } from "../data/demo-store";

describe("energy domain", () => {
  it("calculates marketable surplus with decimal-safe scaled arithmetic", () => {
    expect(calculateSurplus("12.1250", "4.8750")).toEqual({
      netSurplusKwh: "7.25",
      marketableSurplusKwh: "7.25",
    });
  });

  it("clamps a deficit to zero marketable surplus", () => {
    expect(calculateSurplus("4", "8")).toEqual({
      netSurplusKwh: "-4",
      marketableSurplusKwh: "0",
    });
  });

  it("rejects zero or negative listing quantities", () => {
    expect(() => assertPositiveEnergy("0", "quantityKwh")).toThrow();
    expect(() => assertPositiveEnergy("-1", "quantityKwh")).toThrow();
  });

  it("requires an availability window with a future end", () => {
    const start = new Date("2026-09-12T10:00:00Z");
    expect(() => assertValidAvailability(start, start)).toThrow();
    expect(() =>
      assertValidAvailability(start, new Date("2026-09-12T11:00:00Z")),
    ).not.toThrow();
  });
});

describe("grid decision service", () => {
  it("approves healthy local conditions", () => {
    expect(
      decideGrid({
        congestionPercent: 32,
        renewableSharePercent: 44,
        frequencyHz: 50,
      }),
    ).toBe("APPROVED");
  });

  it("restricts congested or unstable conditions", () => {
    expect(
      decideGrid({
        congestionPercent: 88,
        renewableSharePercent: 40,
        frequencyHz: 50,
      }),
    ).toBe("RESTRICTED");
  });
});

describe("matching and listing boundaries", () => {
  it("scores multi-factor fit rather than price alone", () => {
    const approved = scoreMatch({
      id: "one",
      sellerName: "Nearby",
      location: "Local",
      quantityKwh: 24,
      priceInrPerKwh: 7,
      gridDecision: "APPROVED",
      distanceKm: 1,
      reliabilityScore: 95,
    });
    const restricted = scoreMatch({
      id: "two",
      sellerName: "Cheapest",
      location: "Far",
      quantityKwh: 24,
      priceInrPerKwh: 5,
      gridDecision: "RESTRICTED",
      distanceKm: 18,
      reliabilityScore: 60,
    });
    expect(approved).toBeGreaterThan(restricted);
  });

  it("validates the generated listing request contract", () => {
    expect(() =>
      CreateListingBody.parse({
        solarSystemId: demoStore.solarSystems[0].id,
        quantityKwh: 8,
        priceInrPerKwh: 6.5,
        availableFrom: "2026-09-12T10:00:00Z",
        availableUntil: "2026-09-12T12:00:00Z",
      }),
    ).not.toThrow();
  });

  it("rejects listing creation against an unowned solar system", () => {
    expect(() =>
      demoStore.addListing({
        solarSystemId: "00000000-0000-0000-0000-000000000000",
        quantityKwh: 4,
        priceInrPerKwh: 6,
        availableFrom: new Date("2026-09-12T10:00:00Z"),
        availableUntil: new Date("2026-09-12T12:00:00Z"),
      }),
    ).toThrow("not owned");
  });
});

describe("prototype ledger", () => {
  it("produces a stable SHA-256 hash for a canonical transaction payload", () => {
    const payload = {
      transactionId: "tx-1",
      tradeId: "trade-1",
      amountInr: "84.5000",
      quantityKwh: "12.5000",
      settledAt: "2026-09-12T10:00:00.000Z",
    };
    expect(hashTransaction(payload)).toBe(
      "f169e154d0779accb2668cfc2be07ed5b898bf435911ee655fd3428df08836bf",
    );
    expect(hashTransaction(payload)).toBe(hashTransaction({ ...payload }));
  });
});