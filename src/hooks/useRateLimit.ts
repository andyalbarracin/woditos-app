/**
 * Archivo: useRateLimit.ts
 * Ruta: src/hooks/useRateLimit.ts
 * Última modificación: 2026-04-10
 * Descripción: Hook de rate limiting client-side para proteger acciones
 *   que pueden ser abusadas (notificaciones masivas, comunicados, etc).
 *   No reemplaza el rate limiting server-side, es una capa adicional de UX.
 *
 * Uso:
 *   const { attempt, blocked, secondsLeft } = useRateLimit('communicate', 3, 60);
 *   // máximo 3 intentos por 60 segundos
 *
 *   const handleSend = () => {
 *     if (!attempt()) {
 *       toast.error(`Esperá ${secondsLeft}s antes de enviar otro mensaje`);
 *       return;
 *     }
 *     // continuar con la acción
 *   };
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface RateLimitState {
  attempts: number[];  // timestamps de cada intento
}

/**
 * Hook de rate limiting con ventana deslizante.
 *
 * @param key        - Identificador único de la acción (ej: 'communicate', 'invite')
 * @param maxAttempts - Máximo de intentos permitidos en la ventana
 * @param windowSecs  - Duración de la ventana en segundos
 */
export function useRateLimit(key: string, maxAttempts: number, windowSecs: number) {
  const storeKey = `ratelimit:${key}`;
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Leer intentos almacenados (sessionStorage — se resetea al cerrar tab)
  const getAttempts = useCallback((): number[] => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [storeKey]);

  // Guardar intentos filtrados por ventana vigente
  const saveAttempts = useCallback((attempts: number[]) => {
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(attempts));
    } catch {
      // sessionStorage puede fallar en modo privado — silenciar
    }
  }, [storeKey]);

  // Obtener intentos dentro de la ventana actual
  const getValidAttempts = useCallback((): number[] => {
    const now = Date.now();
    const windowMs = windowSecs * 1000;
    return getAttempts().filter(ts => now - ts < windowMs);
  }, [getAttempts, windowSecs]);

  const blocked = getValidAttempts().length >= maxAttempts;

  // Actualizar countdown si está bloqueado
  useEffect(() => {
    if (!blocked) {
      setSecondsLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateCountdown = () => {
      const valid = getValidAttempts();
      if (valid.length < maxAttempts) {
        setSecondsLeft(0);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const oldest = Math.min(...valid);
      const resetAt = oldest + windowSecs * 1000;
      const remaining = Math.ceil((resetAt - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [blocked, getValidAttempts, maxAttempts, windowSecs]);

  /**
   * Registra un intento. Devuelve true si se permite, false si está bloqueado.
   * Llamar ANTES de ejecutar la acción.
   */
  const attempt = useCallback((): boolean => {
    const now = Date.now();
    const windowMs = windowSecs * 1000;
    const valid = getAttempts().filter(ts => now - ts < windowMs);

    if (valid.length >= maxAttempts) return false;

    saveAttempts([...valid, now]);
    return true;
  }, [getAttempts, saveAttempts, maxAttempts, windowSecs]);

  /** Resetear manualmente el contador (ej: al cambiar de sesión) */
  const reset = useCallback(() => {
    try { sessionStorage.removeItem(storeKey); } catch { /* silent */ }
    setSecondsLeft(0);
  }, [storeKey]);

  return { attempt, blocked, secondsLeft, reset };
}