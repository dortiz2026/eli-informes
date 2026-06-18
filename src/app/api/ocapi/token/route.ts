import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/_lib/ocapi/auth";

export async function POST(request: NextRequest) {
  try {
    const { host } = await request.json();
    if (!host) {
      return NextResponse.json({ error: "Falta host en el body" }, { status: 400 });
    }

    const tokenData = await getAccessToken(host);
    return NextResponse.json(tokenData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
