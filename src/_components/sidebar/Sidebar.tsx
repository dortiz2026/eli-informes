"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/_lib/utils";
import type { Service } from "@/_lib/definitions";

interface SidebarProps {
  services: Service[];
}

export default function Sidebar({ services }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // Mapeo simple de nombres de ícono a caracteres/emojis o SVGs limpios en gris
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "clock":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "chart-bar":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Botón Hamburguesa Móvil (Visible solo en móvil) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Overlay Móvil */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Principal (Desktop & Móvil) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-black border-r border-gray-900 transition-all duration-300 flex flex-col justify-between",
          // Layout Responsivo
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64"
        )}
      >
        <div>
          {/* Cabecera / Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-900">
            <span className={cn("font-medium tracking-wide text-white transition-opacity duration-300", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
              Eli
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Lista de Servicios */}
          <nav className="p-4 space-y-2">
            {/* Link al Home Dashboard */}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200",
                pathname === "/dashboard"
                  ? "bg-white text-black font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-gray-950"
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={cn("transition-opacity duration-300", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
                Inicio
              </span>
            </Link>

            {/* Servicios Dinámicos de la BD */}
            {services.map((service) => {
              const href = `/dashboard/${service.slug}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={service.id}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "bg-white text-black font-semibold"
                      : "text-gray-400 hover:text-white hover:bg-gray-950"
                  )}
                >
                  {getIcon(service.icon)}
                  <span className={cn("transition-opacity duration-300", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
                    {service.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Salir */}
        <div className="p-4 border-t border-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={cn("transition-opacity duration-300", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
