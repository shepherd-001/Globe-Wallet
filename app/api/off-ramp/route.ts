import { NextRequest, NextResponse } from "next/server";
import { financeServices } from "../../../lib/services/container";
import { db } from "../../../lib/db/mock-db";
import { OffRampRequest } from "../../../lib/types";

export async function POST(request: NextRequest) {
  let body: OffRampRequest;

  try {
    body = (await request.json()) as OffRampRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { asset, amount, paymentMethodId, fiatAmount } = body;

  if (!asset || typeof asset !== "string") {
    return NextResponse.json(
      { success: false, error: "Asset is required" },
      { status: 422 },
    );
  }

  if (!paymentMethodId || typeof paymentMethodId !== "string") {
    return NextResponse.json(
      { success: false, error: "Payment method is required" },
      { status: 422 },
    );
  }

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { success: false, error: "Amount must be greater than zero" },
      { status: 422 },
    );
  }

  if (typeof fiatAmount !== "number" || fiatAmount <= 0) {
    return NextResponse.json(
      { success: false, error: "Fiat amount is required" },
      { status: 422 },
    );
  }

  const method = financeServices.offRamp
    .getMethods()
    .find((method) => method.id === paymentMethodId);
  if (!method) {
    return NextResponse.json(
      { success: false, error: "Payment method not found" },
      { status: 404 },
    );
  }

  if (fiatAmount < method.minAmount || fiatAmount > method.maxAmount) {
    return NextResponse.json(
      {
        success: false,
        error: `Withdrawal must be between ${method.minAmount} and ${method.maxAmount} ${method.currency}`,
      },
      { status: 422 },
    );
  }

  try {
    const result = await financeServices.offRamp.initiateWithdrawal(
      amount,
      asset,
      paymentMethodId,
      method.currency,
    );

    await db.saveTransaction({
      id: `withdraw_${Math.random().toString(36).slice(2, 10)}`,
      type: "withdraw",
      amount,
      asset,
      address: paymentMethodId,
      date: new Date().toISOString(),
      status: result.success ? (result.status ?? "pending") : "failed",
      stellarHash: result.hash,
      detail: `Withdrawal to ${method.name}`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          methodId: paymentMethodId,
          methodName: method.name,
          asset,
          amount,
          fiatAmount,
          status: result.status,
          hash: result.hash,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to process off-ramp",
      },
      { status: 500 },
    );
  }
}
