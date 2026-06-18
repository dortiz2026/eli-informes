import { NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Si el login fue exitoso, redirigir
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En caso de error, redirigir a login
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
