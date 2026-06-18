import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true, message: "Sesión cerrada" });
}
