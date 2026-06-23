"use client";

import { useRealtime } from "@/_hooks/use-realtime";
import { useState, useEffect } from "react";

interface Order {
  order_no: string;
  creation_date: string;
  order_total: number;
  payment_status: string;
  shipping_status: string;
  city: string;
  shipping_method: string;
}

interface StoreData {
  storeId: string;
  storeName: string;
  success: boolean;
  error?: string;
  orders?: Order[];
}

const CHART_CLASSES = ["chart-bar-1", "chart-bar-2", "chart-bar-3", "chart-bar-4"] as const;

export default function DashboardOverview() {
  const { data, loading } = useRealtime<{ stores: StoreData[] }>({
    url: "/api/ocapi/orders",
    intervalMs: 60000,
  });

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setAnimated(true), 150);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-th-border rounded-full" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-th-text border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-xs text-th-text-muted">Cargando datos...</p>
          </div>
        </div>
        <div className="lg:col-span-2 glass rounded-xl p-5 h-64">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-th-subtle rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stores = data?.stores || [];
  const totalOrders = stores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);
  const maxOrders = Math.max(...stores.map((s) => s.orders?.length || 0), 1);

  // Recent orders — flatten, sort by date, take last 8
  const recentOrders = stores
    .flatMap((s) =>
      (s.orders || []).map((o) => ({
        ...o,
        storeName: s.storeName,
        storeId: s.storeId,
      }))
    )
    .sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime())
    .slice(0, 8);

  // Donut chart calculations
  const donutRadius = 42;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativeOffset = 0;

  const donutSegments = stores
    .filter((s) => s.success && (s.orders?.length || 0) > 0)
    .map((store, i) => {
      const count = store.orders?.length || 0;
      const percentage = totalOrders > 0 ? count / totalOrders : 0;
      const dashLength = percentage * donutCircumference;
      const segment = {
        storeId: store.storeId,
        storeName: store.storeName,
        count,
        percentage,
        dashLength,
        gap: 3,
        offset: cumulativeOffset,
        colorIndex: i % CHART_CLASSES.length,
      };
      cumulativeOffset += dashLength;
      return segment;
    });

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* === LEFT: Donut Chart + Bar Chart === */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-th-text-muted">
            Distribución
          </h3>
          <span className="text-[10px] text-th-text-faint uppercase tracking-wider">
            {stores.filter((s) => s.success).length} tiendas
          </span>
        </div>

        {/* Donut Chart */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative">
            <svg viewBox="0 0 120 120" className="w-32 h-32">
              {/* Background track */}
              <circle
                cx="60"
                cy="60"
                r={donutRadius}
                fill="none"
                className="donut-track"
                strokeWidth="10"
              />
              {/* Segments */}
              <g transform="rotate(-90 60 60)">
                {donutSegments.map((seg) => {
                  const cssVarName = `--th-chart-${seg.colorIndex + 1}` as string;
                  return (
                    <circle
                      key={seg.storeId}
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke={`var(${cssVarName})`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={
                        animated
                          ? `${Math.max(seg.dashLength - seg.gap, 0)} ${donutCircumference - Math.max(seg.dashLength - seg.gap, 0)}`
                          : `0 ${donutCircumference}`
                      }
                      strokeDashoffset={-seg.offset}
                      className="donut-segment"
                    />
                  );
                })}
              </g>
              {/* Center text */}
              <text
                x="60"
                y="56"
                textAnchor="middle"
                dominantBaseline="middle"
                className="donut-text-primary"
                fontSize="26"
                fontWeight="700"
              >
                {totalOrders}
              </text>
              <text
                x="60"
                y="74"
                textAnchor="middle"
                className="donut-text-secondary"
                fontSize="9"
                fontWeight="500"
                style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
              >
                pedidos
              </text>
            </svg>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3 flex-1">
          {stores
            .filter((s) => s.success)
            .map((store, i) => {
              const count = store.orders?.length || 0;
              const pct = maxOrders > 0 ? (count / maxOrders) * 100 : 0;
              const barClass = CHART_CLASSES[i % CHART_CLASSES.length];

              return (
                <div key={store.storeId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-th-text-secondary">
                      {store.storeName}
                    </span>
                    <span className="text-[11px] font-bold text-th-text tabular-nums">
                      {count}
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${barClass}`}
                      style={{ width: animated ? `${Math.max(pct, 2)}%` : "0%" }}
                    />
                  </div>
                </div>
              );
            })}

          {/* Error stores */}
          {stores
            .filter((s) => !s.success)
            .map((store) => (
              <div key={store.storeId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-error/70 flex items-center gap-1.5">
                    <span className="status-dot status-dot-offline" />
                    {store.storeName}
                  </span>
                  <span className="text-[10px] text-error/50">error</span>
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill bg-error/20" style={{ width: "100%" }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* === RIGHT: Recent Orders Feed === */}
      <div className="lg:col-span-2 glass rounded-xl p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-th-text-muted">
            Órdenes Recientes
          </h3>
          <span className="text-[10px] text-th-text-faint">
            Últimas {recentOrders.length} órdenes
          </span>
        </div>

        {recentOrders.length > 0 ? (
          <div className="flex-1 space-y-1">
            {recentOrders.map((order, i) => (
              <div
                key={`${order.storeId}-${order.order_no}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-th-subtle transition-colors animate-row-in"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {/* Order number */}
                <span className="text-[13px] font-semibold text-th-text w-20 shrink-0">
                  #{order.order_no}
                </span>

                {/* Store badge */}
                <span className="text-[10px] font-medium text-th-text-muted bg-th-subtle px-2 py-0.5 rounded shrink-0">
                  {order.storeName}
                </span>

                {/* City */}
                <span className="text-xs text-th-text-secondary truncate flex-1">
                  {order.city || "—"}
                </span>

                {/* Shipping */}
                <span className="text-[10px] uppercase tracking-wider text-th-text-muted hidden sm:block">
                  {order.shipping_method || "—"}
                </span>

                {/* Time ago */}
                <span className="text-[10px] text-th-text-muted tabular-nums shrink-0 w-8 text-right">
                  {formatTimeAgo(order.creation_date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <svg
              className="w-12 h-12 text-th-text-faint mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={0.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-th-text-muted font-medium">Sin pedidos pendientes</p>
            <p className="text-[11px] text-th-text-faint mt-0.5">
              Todas las tiendas al día
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
