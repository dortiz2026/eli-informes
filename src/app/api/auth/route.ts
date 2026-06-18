import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { LoginSchema } from "@/_lib/definitions";
import bcrypt from "bcryptjs";
import { createSession } from "@/_lib/session";

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
    const lowerEmail = email.toLowerCase();
    const supabase = await createClient();

    // 1. Buscar si el usuario existe en nuestra tabla public.users
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", lowerEmail)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // 2. Validar si el usuario está verificado
    if (!user.is_verified) {
      return NextResponse.json(
        { error: "Tu cuenta está pendiente de verificación por un administrador. Por favor, espera a que se te autorice para ingresar." },
        { status: 403 }
      );
    }

    // 3. Validar si el usuario tiene una contraseña configurada
    if (!user.password_hash) {
      return NextResponse.json(
        { error: "No has establecido una contraseña para esta cuenta. Por favor, introduce tu correo primero para establecerla." },
        { status: 400 }
      );
    }

    // 4. Verificar la contraseña ingresada
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // 5. Crear sesión cookie-based persistente
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      role: user.role || "viewer"
    });

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

