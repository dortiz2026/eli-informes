import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { SetPasswordSchema } from "@/_lib/definitions";
import bcrypt from "bcryptjs";

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
        { error: "El usuario no existe o no se pudo verificar." },
        { status: 404 }
      );
    }

    // 2. Si ya tiene una contraseña establecida, evitar sobreescritura
    if (user.password_hash) {
      return NextResponse.json(
        { error: "La contraseña ya ha sido establecida previamente para este usuario." },
        { status: 400 }
      );
    }

    // 3. Cifrar la contraseña con bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Actualizar la tabla pública public.users con la nueva contraseña cifrada
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq("email", lowerEmail);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar contraseña en base de datos: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña establecida con éxito. Debes esperar a que un administrador verifique tu acceso."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

