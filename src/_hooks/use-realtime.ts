"use client";

import { useState, useEffect } from "react";

interface UseRealtimeOptions<T> {
  url: string;
  intervalMs?: number; // Configurable polling interval
  enabled?: boolean;
}

export function useRealtime<T>({
  url,
  intervalMs = 30000, // Por defecto 30 segundos
  enabled = true
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [customInterval, setCustomInterval] = useState<number>(intervalMs);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: Fallo al consultar datos`);
      }
      const jsonData = await res.json();
      setData(jsonData);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Error de red o de servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Primer fetch inmediato
    fetchData();

    // Configurar polling
    const timer = setInterval(() => {
      fetchData();
    }, customInterval);

    return () => clearInterval(timer);
  }, [url, customInterval, enabled]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
    intervalMs: customInterval,
    setIntervalMs: setCustomInterval
  };
}
