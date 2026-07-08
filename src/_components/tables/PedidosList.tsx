"use client";

import { useState } from "react";

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

const toDateKey = (dateString: string): string => {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function PedidosList({ stores }: PedidosListProps) {
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
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

  // Filtro por fecha (día exacto elegido por el usuario)
  const displayOrders = selectedDate
    ? allOrders.filter((order) => toDateKey(order.creation_date) === selectedDate)
    : allOrders;

  const totalPages = Math.max(1, Math.ceil(displayOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = displayOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSelectStore = (storeId: string) => {
    setSelectedStore(storeId);
    setPage(1);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

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

      {/* 3. Tab Bar + Date Filter */}
      <div className="flex items-center justify-between gap-3 border-b border-th-border">
        <div className="flex items-center overflow-x-auto custom-scrollbar">
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

        {/* Date filter */}
        <div className="flex items-center gap-1.5 pr-1 shrink-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleSelectDate(e.target.value)}
            className="text-[11px] px-2 py-1.5 rounded-md bg-th-subtle border border-th-border text-th-text-secondary focus:outline-none focus:ring-1 focus:ring-th-border"
          />
          {selectedDate && (
            <button
              onClick={() => handleSelectDate("")}
              className="text-[10px] px-2 py-1.5 rounded-md bg-th-subtle border border-th-border text-th-text-muted hover:text-th-text-secondary hover:bg-th-subtle-hover transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* 4. Compact Table */}
      {displayOrders.length > 0 ? (
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
              –{(currentPage - 1) * PAGE_SIZE + pagedOrders.length} de {displayOrders.length} pedidos
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
            {selectedDate
              ? `No hay pedidos para el ${selectedDate}${
                  selectedStore === "all" ? "" : ` en ${filteredStores[0]?.storeName || "esta tienda"}`
                }.`
              : selectedStore === "all"
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
