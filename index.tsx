import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import './index.css';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';

// Increment this when persistence schema or query shapes change incompatibly.
// Doing so invalidates any snapshots saved under a previous version key.
const CACHE_VERSION = 3;
const PERSIST_MAX_AGE = 4 * 60 * 60 * 1000;  // 4 hours — avoids stale-empty snapshots persisting all day
const GC_TIME = 30 * 60 * 1000;               // 30 minutes — in-memory cache aligned with persistence window

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: GC_TIME,
      retry: 2, // Retry failed fetches up to 2 times (e.g. transient RLS/network)
    },
  },
});

const shouldPersistQuery = (query: Parameters<NonNullable<NonNullable<React.ComponentProps<typeof PersistQueryClientProvider>['persistOptions']['dehydrateOptions']>['shouldDehydrateQuery']>>[0]) => {
  // TanStack's default dehydration only persists successful queries. Preserving that
  // behavior prevents pending-query promises from being serialized into invalid cache entries.
  if (query.state.status !== 'success') return false;

  // Never persist list queries that resolved to an empty array — these are the most
  // likely victims of a race between RLS header setup and the first fetch.
  const listQueryKeys = ['orphans-basic', 'sponsors-basic', 'team-members-basic'];
  const firstKey = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : '';
  if (listQueryKeys.includes(firstKey) && Array.isArray(query.state.data) && query.state.data.length === 0) {
    return false;
  }

  return true;
};

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: `YETIM_REACT_QUERY_CACHE_v${CACHE_VERSION}`,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <OrganizationProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE,
          dehydrateOptions: {
            shouldDehydrateQuery: shouldPersistQuery,
          },
        }}
      >
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </OrganizationProvider>
  </React.StrictMode>
);
