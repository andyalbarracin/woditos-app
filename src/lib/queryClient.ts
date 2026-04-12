/**
 * Archivo: queryClient.ts
 * Ruta: src/lib/queryClient.ts
 * Última modificación: 2026-04-10
 * Descripción: Instancia compartida de QueryClient para TanStack Query.
 *   Exportada para poder limpiar el caché desde useAuth al hacer signOut.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});