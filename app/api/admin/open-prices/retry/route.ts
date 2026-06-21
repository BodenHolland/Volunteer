import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { retryOpenPricesQueue } from "@/lib/audit-pipeline";


export async function POST() {
  await requireAdmin();
  const result = await retryOpenPricesQueue(50);
  return NextResponse.json(result);
}
