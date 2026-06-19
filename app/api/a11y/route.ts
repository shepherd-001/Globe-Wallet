import { NextRequest, NextResponse } from "next/server";
import { a11yService } from "@/lib/services/a11y.service";
import type { A11yAuditRequest, A11yImpactLevel } from "@/lib/types";

export async function GET() {
  return NextResponse.json(
    {
      standard: a11yService.getStandard(),
      pages: a11yService.getPages(),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  let body: Partial<A11yAuditRequest> = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body.path) {
    return NextResponse.json(
      { success: false, error: "Missing required field: path" },
      { status: 400 },
    );
  }

  const minImpact = body.minImpact as A11yImpactLevel | undefined;
  const result = a11yService.auditPage({ path: body.path, minImpact });

  if (!result.success) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result, { status: 200 });
}
