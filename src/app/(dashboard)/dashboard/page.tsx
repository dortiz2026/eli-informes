import { createClient } from "@/_lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Inicio | Eli informes diarios",
  description: "Panel de control del sistema de monitoreo de tiendas e-commerce.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtener servicios de la BD
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true);

  // Obtener tiendas de la BD
  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true);

  // Obtener conteo de usuarios
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-white">Eli informes diarios</h1>
        <p className="text-gray-400 mt-2">Bienvenido al centro de operaciones. Consulta el estado de tus servicios y tiendas integradas.</p>
      </div>

      {/* 2. Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Servicios Activos</p>
          <p className="text-3xl font-bold text-white">{services?.length || 0}</p>
        </div>
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Tiendas Registradas</p>
          <p className="text-3xl font-bold text-white">{stores?.length || 0}</p>
        </div>
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Usuarios del Portal</p>
          <p className="text-3xl font-bold text-white">{userCount || 0}</p>
        </div>
      </div>

      {/* 3. Grid de servicios disponibles */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Servicios Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services?.map((service) => (
            <Link
              key={service.id}
              href={`/dashboard/${service.slug}`}
              className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-white transition-all flex flex-col justify-between h-40"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-white group-hover:text-white transition-colors">
                    {service.name}
                  </h3>
                  <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Activo
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{service.description}</p>
              </div>
              <div className="flex items-center text-xs font-semibold text-white mt-4 space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Acceder al servicio</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
