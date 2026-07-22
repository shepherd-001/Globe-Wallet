/**
 * Issue #21 — Unit tests for off-ramp payout validation & fee calculation
 * Target: >90% coverage for lib/off-ramp-utils.ts
 */

import {
  parseFeeString,
  getUSDValue,
  computeFeeAmount,
  getNetPayout,
  buildPayoutBreakdown,
  validateWithdrawal,
  formatUSD,
  formatFeePercent,
  describeFee,
  DEFAULT_RATES,
  DEFAULT_BALANCES,
  type OffRampPaymentMethod,
} from "../../lib/off-ramp-utils";

// ── Fixtures ───────────────────────────────────────────────────────────────────

const ACH_METHOD: OffRampPaymentMethod = {
  id: "bank_1",
  type: "bank",
  name: "Chase Checking ****1234",
  details: "ACH Transfer",
  fees: "1.5%",
  processingTime: "1-3 business days",
  limits: { min: 10, max: 10000 },
  enabled: true,
};

const WIRE_METHOD: OffRampPaymentMethod = {
  id: "bank_2",
  type: "bank",
  name: "Wells Fargo ****5678",
  details: "Wire Transfer",
  fees: "$15 + 1%",
  processingTime: "Same day",
  limits: { min: 100, max: 50000 },
  enabled: true,
};

const DISABLED_METHOD: OffRampPaymentMethod = {
  id: "card_1",
  type: "card",
  name: "Visa Debit ****9012",
  details: "Instant Transfer",
  fees: "2.5%",
  processingTime: "Instant",
  limits: { min: 5, max: 1000 },
  enabled: false,
};

const ALL_METHODS = [ACH_METHOD, WIRE_METHOD, DISABLED_METHOD];

// ── parseFeeString ─────────────────────────────────────────────────────────────

describe("parseFeeString", () => {
  describe("pure percentage fees", () => {
    it("parses integer percentage", () => {
      expect(parseFeeString("2%")).toEqual({ fixedFee: 0, percentFee: 0.02 });
    });

    it("parses decimal percentage", () => {
      expect(parseFeeString("1.5%")).toEqual({ fixedFee: 0, percentFee: 0.015 });
    });

    it("parses zero percent", () => {
      expect(parseFeeString("0%")).toEqual({ fixedFee: 0, percentFee: 0 });
    });

    it("parses fractional percentage with many decimals", () => {
      const result = parseFeeString("2.75%");
      expect(result.percentFee).toBeCloseTo(0.0275);
      expect(result.fixedFee).toBe(0);
    });
  });

  describe("fixed dollar fees", () => {
    it("parses plain dollar amount", () => {
      expect(parseFeeString("$15")).toEqual({ fixedFee: 15, percentFee: 0 });
    });

    it("parses dollar amount with decimals", () => {
      expect(parseFeeString("$2.50")).toEqual({ fixedFee: 2.5, percentFee: 0 });
    });
  });

  describe("mixed fees", () => {
    it("parses $15 + 1%", () => {
      expect(parseFeeString("$15 + 1%")).toEqual({ fixedFee: 15, percentFee: 0.01 });
    });

    it("parses mixed fee without spaces", () => {
      expect(parseFeeString("$10+2%")).toEqual({ fixedFee: 10, percentFee: 0.02 });
    });

    it("parses mixed fee with decimal fixed part", () => {
      expect(parseFeeString("$2.50 + 1.5%")).toEqual({
        fixedFee: 2.5,
        percentFee: 0.015,
      });
    });
  });

  describe("edge cases", () => {
    it("returns zeros for empty string", () => {
      expect(parseFeeString("")).toEqual({ fixedFee: 0, percentFee: 0 });
    });

    it("returns zeros for null-like input", () => {
      // @ts-expect-error — testing invalid runtime input
      expect(parseFeeString(null)).toEqual({ fixedFee: 0, percentFee: 0 });
    });

    it("returns zeros for unrecognised format", () => {
      expect(parseFeeString("N/A")).toEqual({ fixedFee: 0, percentFee: 0 });
    });

    it("handles leading/trailing whitespace", () => {
      expect(parseFeeString("  1.5%  ")).toEqual({ fixedFee: 0, percentFee: 0.015 });
    });
  });
});

// ── getUSDValue ────────────────────────────────────────────────────────────────

describe("getUSDValue", () => {
  it("converts XLM to USD at default rate", () => {
    expect(getUSDValue(100, "XLM")).toBeCloseTo(9.5);
  });

  it("converts USDC at 1:1 rate", () => {
    expect(getUSDValue(50, "USDC")).toBe(50);
  });

  it("converts USDT at near-1:1 rate", () => {
    expect(getUSDValue(100, "USDT")).toBeCloseTo(99.8);
  });

  it("returns 0 for zero amount", () => {
    expect(getUSDValue(0, "XLM")).toBe(0);
  });

  it("returns 0 for negative amount", () => {
    expect(getUSDValue(-10, "XLM")).toBe(0);
  });

  it("returns 0 for NaN amount", () => {
    expect(getUSDValue(NaN, "XLM")).toBe(0);
  });

  it("returns 0 for Infinity amount", () => {
    expect(getUSDValue(Infinity, "XLM")).toBe(0);
  });

  it("returns 0 for unknown asset", () => {
    expect(getUSDValue(100, "BTC")).toBe(0);
  });

  it("uses custom rates when provided", () => {
    expect(getUSDValue(10, "XLM", { XLM: 0.5 })).toBe(5);
  });

  it("returns 0 when rate is missing from custom rates", () => {
    expect(getUSDValue(10, "XLM", {})).toBe(0);
  });
});

// ── computeFeeAmount ───────────────────────────────────────────────────────────

describe("computeFeeAmount", () => {
  it("computes percentage fee correctly", () => {
    const result = computeFeeAmount(100, "1.5%");
    expect(result.feeAmount).toBeCloseTo(1.5);
    expect(result.percentFee).toBeCloseTo(0.015);
    expect(result.fixedFee).toBe(0);
  });

  it("computes fixed fee correctly", () => {
    const result = computeFeeAmount(200, "$15");
    expect(result.feeAmount).toBe(15);
    expect(result.fixedFee).toBe(15);
    expect(result.percentFee).toBe(0);
  });

  it("computes mixed fee correctly", () => {
    const result = computeFeeAmount(200, "$15 + 1%");
    expect(result.feeAmount).toBeCloseTo(17); // $15 + $2
    expect(result.fixedFee).toBe(15);
    expect(result.percentFee).toBeCloseTo(0.01);
  });

  it("returns zeros for invalid USD value", () => {
    expect(computeFeeAmount(-5, "1.5%")).toEqual({
      feeAmount: 0,
      fixedFee: 0,
      percentFee: 0,
    });
    expect(computeFeeAmount(NaN, "1.5%")).toEqual({
      feeAmount: 0,
      fixedFee: 0,
      percentFee: 0,
    });
  });

  it("returns zero fee for zero percent", () => {
    expect(computeFeeAmount(1000, "0%").feeAmount).toBe(0);
  });

  it("scales fee proportionally with amount", () => {
    const small = computeFeeAmount(50, "2%");
    const large = computeFeeAmount(100, "2%");
    expect(large.feeAmount).toBeCloseTo(small.feeAmount * 2);
  });
});

// ── getNetPayout ───────────────────────────────────────────────────────────────

describe("getNetPayout", () => {
  it("subtracts fee from USD value", () => {
    expect(getNetPayout(100, 5)).toBeCloseTo(95);
  });

  it("returns 0 when fee exceeds USD value", () => {
    expect(getNetPayout(10, 20)).toBe(0);
  });

  it("returns 0 when fee equals USD value", () => {
    expect(getNetPayout(15, 15)).toBe(0);
  });

  it("handles zero fee", () => {
    expect(getNetPayout(100, 0)).toBe(100);
  });

  it("handles zero amount and fee", () => {
    expect(getNetPayout(0, 0)).toBe(0);
  });
});

// ── buildPayoutBreakdown ───────────────────────────────────────────────────────

describe("buildPayoutBreakdown", () => {
  it("builds correct breakdown for ACH (percentage fee)", () => {
    const bd = buildPayoutBreakdown(100, "XLM", "bank_1", ALL_METHODS);
    expect(bd).not.toBeNull();
    expect(bd!.cryptoAmount).toBe(100);
    expect(bd!.asset).toBe("XLM");
    expect(bd!.usdValue).toBeCloseTo(9.5);
    expect(bd!.feeAmount).toBeCloseTo(0.1425); // 1.5% of 9.5
    expect(bd!.netPayout).toBeCloseTo(9.3575);
    expect(bd!.paymentMethodId).toBe("bank_1");
  });

  it("builds correct breakdown for wire (mixed fee)", () => {
    const bd = buildPayoutBreakdown(1000, "USDC", "bank_2", ALL_METHODS);
    expect(bd).not.toBeNull();
    expect(bd!.usdValue).toBeCloseTo(1000);
    expect(bd!.fixedFee).toBe(15);
    expect(bd!.percentFee).toBeCloseTo(0.01);
    expect(bd!.feeAmount).toBeCloseTo(25); // $15 + 1% of $1000
    expect(bd!.netPayout).toBeCloseTo(975);
  });

  it("returns null for unknown method", () => {
    expect(buildPayoutBreakdown(100, "XLM", "unknown", ALL_METHODS)).toBeNull();
  });

  it("returns null for zero amount", () => {
    expect(buildPayoutBreakdown(0, "XLM", "bank_1", ALL_METHODS)).toBeNull();
  });

  it("returns null for negative amount", () => {
    expect(buildPayoutBreakdown(-50, "XLM", "bank_1", ALL_METHODS)).toBeNull();
  });

  it("uses custom rates when provided", () => {
    const bd = buildPayoutBreakdown(100, "XLM", "bank_1", ALL_METHODS, { XLM: 0.5 });
    expect(bd!.usdValue).toBe(50);
  });
});

// ── validateWithdrawal ─────────────────────────────────────────────────────────

describe("validateWithdrawal", () => {
  const baseInput = {
    amount: "110",
    asset: "XLM",
    paymentMethodId: "bank_1",
    balances: DEFAULT_BALANCES,
    rates: DEFAULT_RATES,
    methods: ALL_METHODS,
  };

  describe("valid inputs", () => {
    it("returns valid for a correct withdrawal", () => {
      const result = validateWithdrawal(baseInput);
      expect(result.valid).toBe(true);
      expect(result.errorCode).toBeUndefined();
    });

    it("accepts numeric amount", () => {
      expect(validateWithdrawal({ ...baseInput, amount: 110 }).valid).toBe(true);
    });

    it("accepts USDC asset", () => {
      expect(
        validateWithdrawal({ ...baseInput, asset: "USDC", amount: "50" }).valid
      ).toBe(true);
    });
  });

  describe("invalid amount", () => {
    it("rejects zero amount string", () => {
      const r = validateWithdrawal({ ...baseInput, amount: "0" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INVALID_AMOUNT");
    });

    it("rejects negative amount", () => {
      const r = validateWithdrawal({ ...baseInput, amount: "-5" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INVALID_AMOUNT");
    });

    it("rejects non-numeric string", () => {
      const r = validateWithdrawal({ ...baseInput, amount: "abc" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INVALID_AMOUNT");
    });

    it("rejects empty string amount", () => {
      const r = validateWithdrawal({ ...baseInput, amount: "" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INVALID_AMOUNT");
    });

    it("rejects Infinity", () => {
      const r = validateWithdrawal({ ...baseInput, amount: Infinity });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INVALID_AMOUNT");
    });
  });

  describe("missing payment method", () => {
    it("rejects empty paymentMethodId", () => {
      const r = validateWithdrawal({ ...baseInput, paymentMethodId: "" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("NO_PAYMENT_METHOD");
    });

    it("rejects whitespace-only paymentMethodId", () => {
      const r = validateWithdrawal({ ...baseInput, paymentMethodId: "   " });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("NO_PAYMENT_METHOD");
    });
  });

  describe("unknown asset", () => {
    it("rejects BTC (not in rates)", () => {
      const r = validateWithdrawal({ ...baseInput, asset: "BTC" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("UNKNOWN_ASSET");
      expect(r.errorMessage).toContain("BTC");
    });
  });

  describe("insufficient balance", () => {
    it("rejects amount exceeding balance", () => {
      const r = validateWithdrawal({ ...baseInput, amount: "9999" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("INSUFFICIENT_BALANCE");
    });

    it("accepts amount equal to balance", () => {
      const r = validateWithdrawal({
        ...baseInput,
        amount: String(DEFAULT_BALANCES.XLM),
      });
      expect(r.valid).toBe(true);
    });
  });

  describe("method not found", () => {
    it("rejects unknown method ID", () => {
      const r = validateWithdrawal({
        ...baseInput,
        paymentMethodId: "nonexistent",
      });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("METHOD_NOT_FOUND");
    });
  });

  describe("disabled method", () => {
    it("rejects disabled card method", () => {
      const r = validateWithdrawal({
        ...baseInput,
        amount: "1",   // well within limits once enabled
        paymentMethodId: "card_1",
      });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("METHOD_DISABLED");
    });
  });

  describe("limit validation", () => {
    it("rejects amount below minimum ($10 for ACH)", () => {
      // 1 XLM × $0.095/XLM = $0.095 < $10 minimum
      const r = validateWithdrawal({ ...baseInput, amount: "1" });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("BELOW_MIN_LIMIT");
      expect(r.errorMessage).toContain("$10");
    });

    it("rejects amount above maximum ($10,000 for ACH)", () => {
      // 200000 XLM × $0.095 = $19,000 > $10,000 limit
      const r = validateWithdrawal({
        ...baseInput,
        amount: "200000",
        balances: { XLM: 999999 },
      });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("ABOVE_MAX_LIMIT");
    });

    it("accepts amount exactly at minimum", () => {
      // 107 XLM × $0.095 ≈ $10.165 ≥ $10
      const r = validateWithdrawal({ ...baseInput, amount: "107" });
      expect(r.valid).toBe(true);
    });

    it("accepts amount exactly at maximum", () => {
      // 105263 XLM × $0.095 ≈ $9999.99 ≤ $10,000
      const r = validateWithdrawal({
        ...baseInput,
        amount: "105263",
        balances: { XLM: 999999 },
      });
      expect(r.valid).toBe(true);
    });

    it("validates limits for wire method (min $100)", () => {
      const r = validateWithdrawal({
        ...baseInput,
        paymentMethodId: "bank_2",
        amount: "50", // 50 USDC = $50 < $100 wire min
        asset: "USDC",
      });
      expect(r.valid).toBe(false);
      expect(r.errorCode).toBe("BELOW_MIN_LIMIT");
    });
  });

  describe("validation error messages", () => {
    it("provides human-readable messages for all error codes", () => {
      const cases: Array<[Partial<typeof baseInput>, string]> = [
        [{ amount: "" }, "valid amount"],
        [{ paymentMethodId: "" }, "payment method"],
        [{ amount: "9999" }, "Insufficient"],
        [{ paymentMethodId: "nonexistent" }, "not found"],
        [{ paymentMethodId: "card_1", amount: "1" }, "not available"],
      ];

      for (const [overrides, expectedSubstring] of cases) {
        const r = validateWithdrawal({ ...baseInput, ...overrides });
        expect(r.errorMessage).toBeDefined();
        expect(r.errorMessage!.toLowerCase()).toContain(
          expectedSubstring.toLowerCase()
        );
      }
    });
  });
});

// ── Formatting helpers ─────────────────────────────────────────────────────────

describe("formatUSD", () => {
  it("formats positive amount", () => {
    expect(formatUSD(1234.567)).toBe("$1,234.57");
  });

  it("formats zero", () => {
    expect(formatUSD(0)).toBe("$0.00");
  });

  it("formats small amount", () => {
    expect(formatUSD(0.095)).toBe("$0.10");
  });

  it("returns $0.00 for NaN", () => {
    expect(formatUSD(NaN)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatUSD(1000000)).toBe("$1,000,000.00");
  });
});

describe("formatFeePercent", () => {
  it("formats percentage correctly", () => {
    expect(formatFeePercent(0.015)).toBe("1.50%");
    expect(formatFeePercent(0.025)).toBe("2.50%");
    expect(formatFeePercent(0)).toBe("0.00%");
  });

  it("returns 0.00% for NaN", () => {
    expect(formatFeePercent(NaN)).toBe("0.00%");
  });
});

describe("describeFee", () => {
  it("describes percentage fee", () => {
    const desc = describeFee("1.5%", 100);
    expect(desc).toContain("1.50%");
    expect(desc).toContain("$1.50");
  });

  it("describes fixed fee", () => {
    const desc = describeFee("$15", 200);
    expect(desc).toContain("flat fee");
  });

  it("describes mixed fee with breakdown", () => {
    const desc = describeFee("$15 + 1%", 200);
    expect(desc).toContain("fixed");
    expect(desc).toContain("variable");
    expect(desc).toContain("$15.00");
    expect(desc).toContain("$2.00");
  });

  it("returns No fee for zero fee string", () => {
    expect(describeFee("0%", 100)).toBe("No fee");
  });
});

// ── DEFAULT_RATES and DEFAULT_BALANCES ─────────────────────────────────────────

describe("constants", () => {
  it("DEFAULT_RATES contains XLM, USDC, USDT", () => {
    expect(DEFAULT_RATES.XLM).toBeGreaterThan(0);
    expect(DEFAULT_RATES.USDC).toBe(1.0);
    expect(DEFAULT_RATES.USDT).toBeCloseTo(0.998);
  });

  it("DEFAULT_BALANCES contains positive balances", () => {
    expect(DEFAULT_BALANCES.XLM).toBeGreaterThan(0);
    expect(DEFAULT_BALANCES.USDC).toBeGreaterThan(0);
    expect(DEFAULT_BALANCES.USDT).toBeGreaterThan(0);
  });
});
