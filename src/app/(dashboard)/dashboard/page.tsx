import { createClient } from "@/_lib/supabase/server";
import Link from "next/link";
import DashboardOverview from "@/_components/dashboard/DashboardOverview";

export const metadata = {
  title: "Inicio | Eli informes diarios",
  description: "Panel de control del sistema de monitoreo de tiendas e-commerce.",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getServiceIcon(iconName: string) {
  switch (iconName) {
    case "clock":
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "chart-bar":
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    default:
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
  }
}

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

  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-2xl glass-strong p-6 md:p-8">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-th-subtle rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-th-subtle rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-th-text-muted mb-2">
            {formattedDate}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-th-text">
            {greeting} 👋
          </h1>
          <p className="text-sm text-th-text-secondary mt-2 max-w-lg">
            Bienvenido al centro de operaciones. Consulta el estado de tus servicios y tiendas integradas.
          </p>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {/* Servicios Activos */}
        <div className="group relative overflow-hidden rounded-xl glass p-5 border-l-gradient glow-white-hover transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-th-text-muted mb-2">
                Servicios Activos
              </p>
              <p className="text-3xl font-bold text-th-text animate-number-in">
                {services?.length || 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-th-subtle">
              <svg className="w-5 h-5 text-th-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
          </div>
          <svg className="sparkline-decoration w-24 h-12" viewBox="0 0 100 40" fill="none">
            <path d="M0 35 Q 20 20, 40 25 T 80 15 T 100 10" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* Tiendas Conectadas */}
        <div className="group relative overflow-hidden rounded-xl glass p-5 border-l-gradient glow-white-hover transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-th-text-muted mb-2">
                Tiendas Conectadas
              </p>
              <p className="text-3xl font-bold text-th-text animate-number-in" style={{ animationDelay: "0.1s" }}>
                {stores?.length || 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-th-subtle">
              <svg className="w-5 h-5 text-th-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
              </svg>
            </div>
          </div>
          <svg className="sparkline-decoration w-24 h-12" viewBox="0 0 100 40" fill="none">
            <path d="M0 30 Q 25 10, 50 20 T 100 8" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* Usuarios del Portal */}
        <div className="group relative overflow-hidden rounded-xl glass p-5 border-l-gradient glow-white-hover transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-th-text-muted mb-2">
                Usuarios del Portal
              </p>
              <p className="text-3xl font-bold text-th-text animate-number-in" style={{ animationDelay: "0.2s" }}>
                {userCount || 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-th-subtle">
              <svg className="w-5 h-5 text-th-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <svg className="sparkline-decoration w-24 h-12" viewBox="0 0 100 40" fill="none">
            <path d="M0 25 Q 15 35, 35 20 T 65 15 T 100 5" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      {/* 3. Charts + Quick Orders Preview */}
      <DashboardOverview />

      {/* 4. Servicios Disponibles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-th-text-muted">
            Servicios Disponibles
          </h2>
          <span className="text-[10px] text-th-text-faint uppercase tracking-wider">
            {services?.length || 0} activos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {services?.map((service) => (
            <Link
              key={service.id}
              href={`/dashboard/${service.slug}`}
              className="group relative overflow-hidden rounded-xl glass p-5 flex items-start gap-4 glow-white-hover transition-all duration-300 hover:scale-[1.01]"
            >
              {/* Icon */}
              <div className="flex-shrink-0 p-3 rounded-xl bg-th-subtle text-th-text-muted group-hover:text-th-text group-hover:bg-th-subtle-hover transition-all duration-300">
                {getServiceIcon(service.icon)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-th-text text-sm">
                    {service.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-success/80 bg-success/[0.08] border border-success/10 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                    Activo
                  </span>
                </div>
                <p className="text-xs text-th-text-muted line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-4 h-4 text-th-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Tiendas Conectadas */}
      {stores && stores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-th-text-muted mb-4">
            Tiendas Conectadas
          </h2>
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <div
                key={store.id}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs text-th-text-secondary hover:text-th-text transition-colors"
              >
                <span className="status-dot status-dot-online" />
                <span className="font-medium">{store.name}</span>
                <span className="text-th-text-faint">·</span>
                <span className="text-th-text-muted text-[10px]">{store.ocapi_host}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
