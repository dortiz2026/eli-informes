import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/_lib/session";

export async function POST(request: NextRequest) {
  await deleteSession();
  return NextResponse.json({ success: true, message: "Sesión cerrada" });
}

