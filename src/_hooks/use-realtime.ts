"use client";

import { useState, useEffect } from "react";

// Límites de auto-actualización: nunca menos de 5 min ni más de 30 min,
// para no saturar de peticiones a Salesforce.
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_INTERVAL_MS = 30 * 60 * 1000;

const clampInterval = (ms: number): number =>
  Math.min(Math.max(ms, MIN_INTERVAL_MS), MAX_INTERVAL_MS);

interface UseRealtimeOptions<T> {
  url: string;
  intervalMs?: number; // Configurable polling interval (clamp: 5 min - 30 min)
  enabled?: boolean;
}

export function useRealtime<T>({
  url,
  intervalMs = MIN_INTERVAL_MS, // Por defecto 5 minutos
  enabled = true
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [customInterval, setCustomInterval] = useState<number>(clampInterval(intervalMs));

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
    setIntervalMs: (ms: number) => setCustomInterval(clampInterval(ms))
  };
}
