import { createClient } from "@/_lib/supabase/server";
import Sidebar from "@/_components/sidebar/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar la existencia y verificación del usuario en la base de datos
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (userError || !dbUser || !dbUser.is_verified) {
    // Si no está verificado o no existe, destruir sesión y redirigir
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Obtener todos los servicios activos de la BD para pintar el menú lateral dinámicamente
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      {/* Sidebar Colapsable Pasándole los servicios de la BD */}
      <Sidebar services={services || []} />

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col md:pl-64 transition-all duration-300">
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto mt-14 md:mt-0 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
