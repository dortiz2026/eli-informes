import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    if (!lowerEmail.endsWith("@patprimo.com.co")) {
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
      .eq("email", lowerEmail)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
    }

    // 2. Si no existe en la base de datos, registrar en la tabla users con is_verified = false
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email: lowerEmail,
          name: lowerEmail.split("@")[0],
          role: "viewer",
          is_verified: false,
          password_hash: null
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Error al registrar usuario en la base de datos: " + insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        action: "set-password",
        message: "Establece tu contraseña para continuar.",
        email: lowerEmail
      });
    }

    // 3. Si el usuario existe pero no tiene contraseña configurada (password_hash vacío)
    if (!user.password_hash) {
      return NextResponse.json({
        action: "set-password",
        message: "Establece tu contraseña para continuar.",
        email: lowerEmail
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

