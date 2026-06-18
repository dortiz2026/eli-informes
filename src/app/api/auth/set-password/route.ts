import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { SetPasswordSchema } from "@/_lib/definitions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar esquema
    const parsed = SetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    // Validar si existe sesión activa de Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "No hay una sesión activa de Supabase. Por favor, asegúrate de activar tu cuenta haciendo clic en el enlace del correo de verificación antes de establecer tu contraseña." },
        { status: 401 }
      );
    }

    // 1. Actualizar contraseña del usuario logueado en Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    });

    if (authError) {
      return NextResponse.json(
        { error: "Error al actualizar contraseña en Supabase Auth: " + authError.message },
        { status: 500 }
      );
    }

    // 2. Actualizar la tabla pública public.users para marcar que ya tiene contraseña asignada
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: "assigned_in_auth", // Marcador de clave asignada
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("email", email);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar perfil en base de datos: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña establecida con éxito"
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
