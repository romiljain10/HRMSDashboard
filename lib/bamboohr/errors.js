import { NextResponse } from "next/server";
import { BambooHRError } from "@/lib/bamboohr/client";

export function handleBambooError(err) {
  if (err instanceof BambooHRError) {
    const status = err.status ?? (err.code === "MISSING_CREDENTIALS" ? 500 : 502);
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
  }
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
    { status: 500 }
  );
}
