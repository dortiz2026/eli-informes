"use client";

import { useRealtime } from "@/_hooks/use-realtime";
import PedidosList from "@/_components/tables/PedidosList";

export default function ConsultarPendientesClient() {
  const { data, loading, error, lastUpdated, refetch, intervalMs, setIntervalMs } = useRealtime<{ stores: any[] }>({
    url: "/api/ocapi/orders",
    intervalMs: 30000 // 30 segundos
  });

  return (
    <div className="space-y-6">
      {/* Header con Controles de Polling */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-white">Consultar Pedidos Pendientes</h1>
          <p className="text-xs text-gray-500 mt-1">
            {lastUpdated 
              ? `Última actualización: ${lastUpdated.toLocaleTimeString()}`
              : "Conectando con OCAPI..."
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Actualizar cada:</span>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="bg-black border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white transition-all"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
              <option value={300000}>5 min</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2.5 bg-black border border-gray-800 text-white hover:border-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            title="Actualizar ahora"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cargando inicial */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Consultando API de tiendas...</p>
        </div>
      )}

      {/* Error de Red */}
      {error && !data && (
        <div className="p-6 bg-red-950/20 border border-red-900/20 rounded-xl text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-900/40 text-red-200 hover:bg-red-900/60 rounded-lg text-xs transition-colors"
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
