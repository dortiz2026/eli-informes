"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/_lib/utils";

interface PedidosListProps {
  stores: any[];
}

export default function PedidosList({ stores }: PedidosListProps) {
  const [selectedStore, setSelectedStore] = useState<string>("all");

  const filteredStores = selectedStore === "all"
    ? stores
    : stores.filter(s => s.storeId === selectedStore);

  // Totales generales (solo cantidad de pedidos, no montos)
  const totalOrders = stores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Cards de Resumen General (Ajustado a 2 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Pedidos Pendientes</p>
          <p className="text-3xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Filtro por Tienda</p>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="mt-1 w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-all"
          >
            <option value="all">Todas las Tiendas</option>
            {stores.map(s => (
              <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Grid de Tiendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStores.map((store) => (
          <div key={store.storeId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
            {/* Header de Tienda */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">{store.storeName}</h3>
                <p className="text-xs text-gray-500">
                  {store.success ? "Conectado correctamente" : "Fallo de conexión"}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                store.success 
                  ? "bg-green-950/40 text-green-400 border border-green-900/30"
                  : "bg-red-950/40 text-red-400 border border-red-900/30"
              }`}>
                {store.orders?.length || 0} pedidos
              </span>
            </div>

            {/* Contenido / Lista de Pedidos */}
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {store.error && (
                <div className="p-4 bg-red-950/20 border border-red-900/20 text-red-400 rounded-lg text-sm text-center">
                  Error: {store.error}
                </div>
              )}

              {!store.error && (!store.orders || store.orders.length === 0) && (
                <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                  Sin pedidos pendientes
                </div>
              )}

              {!store.error && store.orders && store.orders.length > 0 && (
                <div className="space-y-3">
                  {store.orders.map((order: any) => (
                    <div key={order.order_no} className="p-3 bg-black/40 border border-gray-800/60 rounded-lg flex justify-between items-center text-sm hover:border-gray-700 transition-colors">
                      <div>
                        <p className="font-semibold text-white">#{order.order_no}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.creation_date).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })} - {order.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 px-1.5 py-0.5 bg-gray-800/40 border border-gray-800 rounded">
                          {order.shipping_method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
