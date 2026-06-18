import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { LoginSchema } from "@/_lib/definitions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar esquema
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    // 1. Iniciar sesión utilizando Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Error al iniciar sesión: " + signInError.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "dashboard",
      message: "Autenticación exitosa"
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
