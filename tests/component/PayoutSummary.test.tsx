/**
 * Issue #21 — Component tests: PayoutSummary & FeeDisplay
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { PayoutSummary } from "../../components/dashboard/PayoutSummary";
import { FeeDisplay } from "../../components/ui/FeeDisplay";
import type { PayoutBreakdown, OffRampPaymentMethod } from "../../lib/off-ramp-utils";

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

const BREAKDOWN_ACH: PayoutBreakdown = {
  cryptoAmount: 100,
  asset: "XLM",
  usdValue: 9.5,
  feeAmount: 0.1425,
  fixedFee: 0,
  percentFee: 0.015,
  netPayout: 9.3575,
  paymentMethodId: "bank_1",
};

const BREAKDOWN_WIRE: PayoutBreakdown = {
  cryptoAmount: 1000,
  asset: "USDC",
  usdValue: 1000,
  feeAmount: 25,
  fixedFee: 15,
  percentFee: 0.01,
  netPayout: 975,
  paymentMethodId: "bank_2",
};

// ── PayoutSummary ─────────────────────────────────────────────────────────────

describe("PayoutSummary", () => {
  it("renders with default data-testid", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByTestId("payout-summary")).toBeInTheDocument();
  });

  it("renders custom data-testid", () => {
    render(
      <PayoutSummary
        breakdown={BREAKDOWN_ACH}
        method={ACH_METHOD}
        data-testid="custom-summary"
      />
    );
    expect(screen.getByTestId("custom-summary")).toBeInTheDocument();
  });

  it("shows crypto amount and asset", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/XLM/)).toBeInTheDocument();
  });

  it("shows USD value formatted as currency", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByText("$9.50")).toBeInTheDocument();
  });

  it("shows processing fee as negative value", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    // Fee display is "-$0.14" (rounded)
    expect(screen.getByText(/-\$0\.1[3-5]/)).toBeInTheDocument();
  });

  it("shows net payout amount", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByText("$9.36")).toBeInTheDocument();
  });

  it('shows "You\'ll receive" label', () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByText(/you'll receive/i)).toBeInTheDocument();
  });

  it("shows Transaction Summary heading", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(screen.getByText(/Transaction Summary/i)).toBeInTheDocument();
  });

  it("renders wire method breakdown correctly", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_WIRE} method={WIRE_METHOD} />);
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("-$25.00")).toBeInTheDocument();
    expect(screen.getByText("$975.00")).toBeInTheDocument();
  });

  it("has accessible aria-labels for key values", () => {
    render(<PayoutSummary breakdown={BREAKDOWN_ACH} method={ACH_METHOD} />);
    expect(
      screen.getByLabelText(/USD value/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Net payout/i)
    ).toBeInTheDocument();
  });

  it("renders with USDT asset", () => {
    const usdtBreakdown: PayoutBreakdown = {
      ...BREAKDOWN_ACH,
      asset: "USDT",
      cryptoAmount: 50,
      usdValue: 49.9,
    };
    render(<PayoutSummary breakdown={usdtBreakdown} method={ACH_METHOD} />);
    expect(screen.getByText(/USDT/)).toBeInTheDocument();
    expect(screen.getByText("$49.90")).toBeInTheDocument();
  });
});

// ── FeeDisplay ────────────────────────────────────────────────────────────────

describe("FeeDisplay", () => {
  it("renders fee string", () => {
    render(<FeeDisplay feeStr="1.5%" />);
    expect(screen.getByTestId("fee-display")).toBeInTheDocument();
    expect(screen.getByText("1.5%")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<FeeDisplay feeStr="1.5%" />);
    expect(screen.getByLabelText("Fee: 1.5%")).toBeInTheDocument();
  });

  it("renders fixed fee string", () => {
    render(<FeeDisplay feeStr="$15" />);
    expect(screen.getByText("$15")).toBeInTheDocument();
  });

  it("shows total fee amount for mixed fee when usdValue is provided", () => {
    render(<FeeDisplay feeStr="$15 + 1%" usdValue={200} />);
    // Should show total = $15 + $2 = $17
    expect(screen.getByText("($17.00)")).toBeInTheDocument();
  });

  it("does not show total for mixed fee when usdValue is 0", () => {
    render(<FeeDisplay feeStr="$15 + 1%" usdValue={0} />);
    expect(screen.queryByText(/\$17/)).not.toBeInTheDocument();
  });

  it("does not show total for pure percentage fee", () => {
    render(<FeeDisplay feeStr="1.5%" usdValue={100} />);
    // Only the fee string is shown, not a dollar total (no Info icon for pure %)
    expect(screen.queryByLabelText("Fee structure info")).not.toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { container } = render(<FeeDisplay feeStr="2%" className="text-red-500" />);
    expect(container.firstChild).toHaveClass("text-red-500");
  });

  it("showBreakdown renders sr-only breakdown for mixed fee", () => {
    const { container } = render(
      <FeeDisplay feeStr="$15 + 1%" usdValue={200} showBreakdown />
    );
    const srOnly = container.querySelector(".sr-only");
    expect(srOnly).toBeInTheDocument();
    expect(srOnly!.textContent).toMatch(/fixed/i);
    expect(srOnly!.textContent).toMatch(/equals/i);
  });

  it("does not render sr-only for pure fee without showBreakdown", () => {
    const { container } = render(<FeeDisplay feeStr="1.5%" usdValue={100} />);
    expect(container.querySelector(".sr-only")).not.toBeInTheDocument();
  });
});
