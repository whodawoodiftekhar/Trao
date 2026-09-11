import { QueryClient } from '@tanstack/react-query';

let globalQueryClient: QueryClient | null = null;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
}

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client;
}


/**
 * Drops a deleted kit from the cache. The kit list is invalidated rather than
 * hand-filtered so the server stays the source of truth.
 */
export function purgeKit(kitId: string, client: QueryClient) {
  if (!kitId) return;
  client.removeQueries({ queryKey: ['kit', kitId] });
  client.removeQueries({ queryKey: ['mock-history', kitId] });
  client.invalidateQueries({ queryKey: ['kits'] });
}
