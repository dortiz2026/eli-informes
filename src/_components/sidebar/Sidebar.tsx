"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/_lib/utils";
import { useTheme } from "@/_components/ThemeProvider";
import type { Service } from "@/_lib/definitions";

interface SidebarProps {
  services: Service[];
}

export default function Sidebar({ services }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "clock":
        return (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "chart-bar":
        return (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        );
      default:
        return (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Botón Hamburguesa Móvil */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 glass-strong text-th-text rounded-xl focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Overlay Móvil */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-th-overlay z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-th-sidebar-bg backdrop-blur-xl border-r border-th-sidebar-border transition-all duration-300 flex flex-col justify-between",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64"
        )}
      >
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-th-sidebar-border">
            <div className={cn("flex items-center gap-2 transition-all duration-300", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
              <div className="w-7 h-7 rounded-lg bg-th-text flex items-center justify-center">
                <span className="text-th-bg font-bold text-sm">E</span>
              </div>
              <span className="font-semibold tracking-tight text-th-text text-sm">
                Eli
              </span>
            </div>
            {/* Collapsed logo */}
            <div className={cn("items-center justify-center transition-all duration-300 hidden", collapsed && "md:flex")}>
              <div className="w-8 h-8 rounded-lg bg-th-text flex items-center justify-center">
                <span className="text-th-bg font-bold text-sm">E</span>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-th-text-muted hover:text-th-text hover:bg-th-subtle transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Section Label */}
          <div className={cn("px-5 pt-5 pb-2 transition-all duration-300", collapsed ? "md:opacity-0" : "opacity-100")}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-th-text-faint">
              Navegación
            </p>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-0.5">
            {/* Home Link */}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 group relative",
                pathname === "/dashboard"
                  ? "text-th-text bg-th-subtle-hover"
                  : "text-th-text-muted hover:text-th-text-secondary hover:bg-th-subtle"
              )}
            >
              {pathname === "/dashboard" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-th-text" />
              )}
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className={cn("transition-all duration-300 font-medium", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
                Inicio
              </span>
            </Link>

            {/* Dynamic Services */}
            {services.map((service) => {
              const href = `/dashboard/${service.slug}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={service.id}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 group relative",
                    isActive
                      ? "text-th-text bg-th-subtle-hover"
                      : "text-th-text-muted hover:text-th-text-secondary hover:bg-th-subtle"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-th-text" />
                  )}
                  <span className="flex-shrink-0">{getIcon(service.icon)}</span>
                  <span className={cn("transition-all duration-300 font-medium", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
                    {service.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: Theme Toggle + Logout */}
        <div className="p-3 border-t border-th-sidebar-border space-y-0.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-th-text-muted hover:text-th-text hover:bg-th-subtle transition-all"
          >
            {theme === "dark" ? (
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            <span className={cn("transition-all duration-300 font-medium", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
              {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-th-text-muted hover:text-error hover:bg-error/[0.05] transition-all"
          >
            <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className={cn("transition-all duration-300 font-medium", collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100")}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
