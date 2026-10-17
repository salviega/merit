import { describe, expect, it } from "vitest";
import { maxBigInt, minBigInt, percentOf, sameAsset, sumValues, toBigInt } from "./amount";

// Amounts are bigint strings in minor units (04 §3). No float ever touches
// money; anything that is not a run of digits is refused at the boundary.

describe("toBigInt / sumValues", () => {
  it("parses minor-unit strings and sums them", () => {
    expect(toBigInt("0")).toBe(BigInt(0));
    expect(sumValues(["100", "250", "1"])).toBe(BigInt(351));
    expect(sumValues([])).toBe(BigInt(0));
  });

  it("refuses decimals, signs and empty strings", () => {
    for (const bad of ["12.5", "-1", "", " 10", "1e3"]) {
      expect(() => toBigInt(bad)).toThrow(TypeError);
    }
  });
});

describe("minBigInt / maxBigInt", () => {
  it("pick the smaller and the larger", () => {
    expect(minBigInt(BigInt(3), BigInt(5))).toBe(BigInt(3));
    expect(minBigInt(BigInt(5), BigInt(3))).toBe(BigInt(3));
    expect(maxBigInt(BigInt(3), BigInt(5))).toBe(BigInt(5));
    expect(maxBigInt(BigInt(5), BigInt(3))).toBe(BigInt(5));
  });
});

describe("percentOf", () => {
  it("floors amount × percent / 100", () => {
    expect(percentOf(BigInt(31800), 20)).toBe(BigInt(6360));
    expect(percentOf(BigInt(999), 1)).toBe(BigInt(9));
    expect(percentOf(BigInt(100), 0)).toBe(BigInt(0));
  });

  it("refuses a negative or fractional percent", () => {
    expect(() => percentOf(BigInt(100), -1)).toThrow(RangeError);
    expect(() => percentOf(BigInt(100), 2.5)).toThrow(RangeError);
  });
});

describe("sameAsset", () => {
  it("compares code and scale", () => {
    expect(sameAsset({ assetCode: "USD", assetScale: 2 }, { assetCode: "USD", assetScale: 2 })).toBe(true);
    expect(sameAsset({ assetCode: "USD", assetScale: 2 }, { assetCode: "USD", assetScale: 3 })).toBe(false);
    expect(sameAsset({ assetCode: "USD", assetScale: 2 }, { assetCode: "EUR", assetScale: 2 })).toBe(false);
  });
});
