import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    if (!email.endsWith("@patprimo.com.co")) {
      return NextResponse.json(
        { error: "Solo se permiten correos con dominio @patprimo.com.co" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Buscar si el usuario ya existe en nuestra tabla public.users
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
    }

    // 2. Si no existe en la base de datos, registrar en Supabase Auth y disparar confirmación de email
    if (!user) {
      // Registramos en Supabase Auth con una clave temporal. El usuario recibirá un correo con el link de verificación de Supabase.
      const tempPassword = Math.random().toString(36).slice(-10) + "TempPash1!";
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback?next=/set-password?email=${encodeURIComponent(email)}`
        }
      });

      if (signUpError) {
        return NextResponse.json(
          { error: "Error al registrar en Supabase Auth: " + signUpError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        action: "verification-sent",
        message: "Se ha enviado un correo de verificación. Revisa tu bandeja de entrada para activar tu cuenta."
      });
    }

    // 3. Si el usuario existe pero no tiene contraseña configurada (password_hash vacío)
    if (!user.password_hash) {
      return NextResponse.json({
        action: "set-password",
        message: "Establece tu contraseña para continuar.",
        email: email
      });
    }

    // 4. Si el usuario ya existe con contraseña activa, requerir inicio de sesión
    return NextResponse.json({
      action: "login",
      message: "Introduce tu contraseña para acceder."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
