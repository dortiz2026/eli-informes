"use client";

import { useRealtime } from "@/_hooks/use-realtime";
import PedidosList from "@/_components/tables/PedidosList";

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

export default function ConsultarPendientesClient() {
  const { data, loading, error, lastUpdated, refetch, intervalMs, setIntervalMs } = useRealtime<{ stores: StoreData[] }>({
    url: "/api/ocapi/orders",
    intervalMs: 30000,
  });

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    if (diffSecs < 60) return `hace ${diffSecs}s`;
    if (diffMins < 60) return `hace ${diffMins}min`;
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header compacto con LIVE indicator */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 glass-strong rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-th-text">Pedidos Pendientes</h1>
              <div className="live-indicator">
                <span className="live-dot" />
                <span>Live</span>
              </div>
            </div>
            <p className="text-[11px] text-th-text-muted mt-0.5">
              {lastUpdated
                ? `Actualizado ${formatRelativeTime(lastUpdated)}`
                : "Conectando con OCAPI..."
              }
              {loading && data && (
                <span className="ml-1.5 text-th-text-faint">· sincronizando...</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Polling select */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-th-subtle border border-th-border">
            <svg className="w-3 h-3 text-th-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="bg-transparent text-[11px] text-th-text-secondary focus:outline-none cursor-pointer"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
              <option value={300000}>5 min</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 rounded-lg bg-th-subtle border border-th-border text-th-text-muted hover:text-th-text hover:bg-th-subtle-hover transition-all duration-200 disabled:opacity-30"
            title="Actualizar ahora"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cargando inicial */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-th-border rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-th-text border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm text-th-text-secondary">Consultando tiendas</p>
            <p className="text-[11px] text-th-text-faint mt-1">Conectando con API OCAPI...</p>
          </div>
        </div>
      )}

      {/* Error de Red */}
      {error && !data && (
        <div className="p-5 glass rounded-xl text-center space-y-3 glow-red">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-error/10 mb-1">
            <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-error/80">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error/10 text-error/80 hover:bg-error/20 rounded-lg text-xs transition-colors border border-error/10"
          >
            Reintentar Conexión
          </button>
        </div>
      )}

      {/* Lista de Pedidos por Tienda */}
      {data?.stores && (
        <PedidosList stores={data.stores} />
      )}
    </div>
  );
}
