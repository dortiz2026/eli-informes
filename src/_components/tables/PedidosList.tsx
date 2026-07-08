"use client";

import { useMemo, useState } from "react";

// Clave de día local (YYYY-MM-DD) a partir de la fecha de creación del pedido
const toDateKey = (dateString: string): string => {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Etiqueta corta para mostrar el día (ej. "dom 06 jul")
const formatDayLabel = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

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

interface PedidosListProps {
  stores: StoreData[];
}

const PAGE_SIZE = 50;

export default function PedidosList({ stores }: PedidosListProps) {
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Totales generales
  const totalOrders = stores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);
  const storesWithErrors = stores.filter((s) => !s.success);
  const storesOnline = stores.filter((s) => s.success);

  // Filtered data
  const filteredStores =
    selectedStore === "all" ? stores : stores.filter((s) => s.storeId === selectedStore);

  // All orders flattened for table view
  const allOrders = filteredStores
    .flatMap((store) =>
      (store.orders || []).map((order) => ({
        ...order,
        storeName: store.storeName,
        storeId: store.storeId,
      }))
    )
    .sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime());

  const totalPages = Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = allOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSelectStore = (storeId: string) => {
    setSelectedStore(storeId);
    setPage(1);
  };

  // Contador acumulado de pedidos por día para la marca seleccionada.
  // useMemo => se recalcula SOLO cuando llegan datos nuevos (nuevo `stores`)
  // o cambia la tienda seleccionada; entre renders queda "cacheado".
  const ordersByDay = useMemo(() => {
    const relevant =
      selectedStore === "all"
        ? stores
        : stores.filter((s) => s.storeId === selectedStore);

    const counts = new Map<string, number>();
    for (const store of relevant) {
      for (const order of store.orders || []) {
        const key = toDateKey(order.creation_date);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // más reciente primero
  }, [stores, selectedStore]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return "< 1h";
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getAgeColor = (dateString: string): string => {
    const hours = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60)
    );
    if (hours >= 48) return "bg-error/10 text-error border border-error/10";
    if (hours >= 24) return "bg-warning/10 text-warning border border-warning/10";
    return "bg-th-subtle text-th-text-muted border border-th-border";
  };

  return (
    <div className="space-y-3">
      {/* 1. Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 glass rounded-xl px-4 py-3">
        {/* Total */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-th-text animate-number-in tabular-nums">
            {totalOrders}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-th-text-muted leading-tight">
            pedidos
            <br />
            pendientes
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-th-border" />

        {/* Per-store chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {stores.map((store) => (
            <div
              key={store.storeId}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-th-subtle border border-th-border"
            >
              <span
                className={`status-dot ${
                  store.success ? "status-dot-online" : "status-dot-offline"
                }`}
              />
              <span className="text-[11px] text-th-text-secondary font-medium">
                {store.storeName}
              </span>
              <span className="text-[11px] text-th-text font-bold tabular-nums">
                {store.orders?.length || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="ml-auto hidden sm:flex items-center gap-2 text-[10px]">
          <span className="text-success/80">{storesOnline.length} online</span>
          {storesWithErrors.length > 0 && (
            <span className="text-error">{storesWithErrors.length} error</span>
          )}
        </div>
      </div>

      {/* 2. Store Errors */}
      {storesWithErrors.length > 0 && (
        <div className="space-y-2">
          {storesWithErrors.map((store) => (
            <div
              key={store.storeId}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-error/[0.04] border border-error/[0.08] glow-red"
            >
              <span className="status-dot status-dot-offline" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-error/80">
                  {store.storeName}
                </span>
                <span className="text-[11px] text-error/50 ml-2">{store.error}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Tab Bar */}
      <div className="flex items-center border-b border-th-border overflow-x-auto custom-scrollbar">
        <button
          onClick={() => handleSelectStore("all")}
          className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
            selectedStore === "all"
              ? "text-th-text tab-active-underline"
              : "text-th-text-muted hover:text-th-text-secondary"
          }`}
        >
          Todas
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              selectedStore === "all"
                ? "bg-th-subtle-hover text-th-text"
                : "bg-th-subtle text-th-text-muted"
            }`}
          >
            {totalOrders}
          </span>
        </button>

        {stores
          .filter((s) => s.success)
          .map((store) => (
            <button
              key={store.storeId}
              onClick={() => handleSelectStore(store.storeId)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedStore === store.storeId
                  ? "text-th-text tab-active-underline"
                  : "text-th-text-muted hover:text-th-text-secondary"
              }`}
            >
              {store.storeName}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  selectedStore === store.storeId
                    ? "bg-th-subtle-hover text-th-text"
                    : "bg-th-subtle text-th-text-muted"
                }`}
              >
                {store.orders?.length || 0}
              </span>
            </button>
          ))}
      </div>

      {/* 4. Contador acumulado por día (solo lectura, no filtra) */}
      {ordersByDay.length > 0 && (
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-th-text-muted mb-2">
            Pedidos por día
            {selectedStore !== "all" && ` · ${filteredStores[0]?.storeName || ""}`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ordersByDay.map(({ date, count }) => (
              <div
                key={date}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-th-subtle border border-th-border"
              >
                <span className="text-[11px] text-th-text-secondary font-medium capitalize">
                  {formatDayLabel(date)}
                </span>
                <span className="text-[11px] text-th-text font-bold tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Compact Table */}
      {allOrders.length > 0 ? (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] custom-scrollbar">
            <table className="table-compact">
              <thead>
                <tr>
                  <th className="w-[120px]"># Orden</th>
                  <th className="w-[100px]">Fecha</th>
                  <th className="w-[80px]">Antigüedad</th>
                  <th>Ciudad</th>
                  <th>Envío</th>
                  {selectedStore === "all" && <th>Tienda</th>}
                </tr>
              </thead>
              <tbody className="stagger-rows">
                {pagedOrders.map((order) => (
                  <tr key={`${order.storeId}-${order.order_no}`}>
                    <td>
                      <span className="font-semibold text-th-text text-[13px]">
                        #{order.order_no}
                      </span>
                    </td>
                    <td>
                      <span className="text-th-text-secondary">
                        {formatDate(order.creation_date)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getAgeColor(
                          order.creation_date
                        )}`}
                      >
                        {formatRelativeDate(order.creation_date)}
                      </span>
                    </td>
                    <td>
                      <span className="text-th-text-secondary">
                        {order.city || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] uppercase tracking-wider text-th-text-muted px-1.5 py-0.5 bg-th-subtle border border-th-border rounded">
                        {order.shipping_method || "—"}
                      </span>
                    </td>
                    {selectedStore === "all" && (
                      <td>
                        <span className="text-[11px] text-th-text-secondary font-medium">
                          {order.storeName}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-th-border bg-th-subtle">
            <span className="text-[10px] text-th-text-faint">
              Mostrando {pagedOrders.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
              –{(currentPage - 1) * PAGE_SIZE + pagedOrders.length} de {allOrders.length} pedidos
            </span>

            <div className="flex items-center gap-3">
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-[10px] font-medium text-th-text-secondary bg-th-subtle-hover border border-th-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-th-border transition-colors"
                  >
                    ‹
                  </button>
                  <span className="text-[10px] text-th-text-faint px-1 tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-[10px] font-medium text-th-text-secondary bg-th-subtle-hover border border-th-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-th-border transition-colors"
                  >
                    ›
                  </button>
                </div>
              )}
              <span className="text-[10px] text-th-text-faint">
                {selectedStore === "all"
                  ? `${storesOnline.length} tiendas`
                  : filteredStores[0]?.storeName}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 glass rounded-xl">
          <svg
            className="w-16 h-16 text-th-text-faint mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={0.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <p className="text-sm text-th-text-muted font-medium">
            Sin pedidos pendientes
          </p>
          <p className="text-[11px] text-th-text-faint mt-1">
            {selectedStore === "all"
              ? "No hay pedidos pendientes en ninguna tienda."
              : `No hay pedidos pendientes para ${
                  filteredStores[0]?.storeName || "esta tienda"
                }.`}
          </p>
        </div>
      )}
    </div>
  );
}
