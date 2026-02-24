## RLS, Data Loading, and Re-render Fix Plan

This file tracks the plan and status for fixing the intermittent data-loading issues and excessive `isManager` logging. It is intentionally ignored by git.

### Overview of Problems

1. **RLS user context via `pg_backend_pid()` is unsafe with connection pooling**, causing intermittent empty results for `orphans`, `sponsors`, and `team members`.
2. **AuthContext value and permission helpers are not memoized**, causing excessive re-renders and repeated `isManager` logs.
3. **`usePermissions` and several components call `isManager()` directly in render flow**, amplifying logging and re-renders.
4. **React Query persistence can store empty/failed results for up to 24 hours**, making missing data appear “stuck”.
5. **Dashboard stats render `0` counts without checking loading state**, leading to brief but confusing zero values during load.
6. **Legacy hooks’ custom cache revalidation toggles `loading` during background refetch**, causing flicker.
7. **Dual caching (React Query + custom in-memory cache)** complicates invalidation and can cause state divergence.

### Plan and Status

1. **Fix RLS user context (critical)**  
   - **Goal**: Stop using `pg_backend_pid()` + `user_sessions` table for per-request user context and instead use an HTTP header-based user identifier that is available on every request.  
   - **Approach**:  
     - Change `get_current_user_id()` in `001_initial_schema.sql` to read `x-user-id` from `current_setting('request.headers', true)` instead of querying `user_sessions`.  
     - Update client auth flow (`lib/auth.ts`) to set/clear `x-user-id` on the shared Supabase client headers instead of calling the `set_current_user_id` / `clear_current_user_id` RPC functions.  
     - Make `ensureUserContext` / `withUserContext` effectively no-ops (headers carry the context).  
   - **Status**: ✅ _Implemented (header-based RLS user context wired from auth to PostgreSQL)._

2. **Stabilize AuthContext value and permission helpers**  
   - **Goal**: Ensure `AuthProvider` does not trigger unnecessary re-renders and repeated `isManager` evaluations.  
   - **Approach**: Wrap permission helper functions (`canEdit*`, `isManager`) with `useCallback` and wrap the `value` object in `useMemo`.  
   - **Status**: ✅ _Implemented (permission helpers use `useCallback`, `AuthProvider` value is wrapped in `useMemo`)._

3. **Reduce `isManager()` usage in render paths**  
   - **Goal**: Stop calling `isManager()` inside hook/component return values and dependency arrays.  
   - **Approach**:  
     - In `usePermissions`, expose `isManager` as a boolean derived from context (`permissions?.is_manager`) instead of calling `isManager()`.  
     - In components (`TeamList`, `SponsorsList`, `SponsorPage`, `TeamMemberPage`), use the boolean from context or props in `useMemo` dependencies.  
   - **Status**: ✅ _Implemented (render-path permission checks now use a stable boolean manager flag)._

4. **Tighten React Query persistence semantics**  
   - **Goal**: Avoid persisting obviously bad/empty results for 24 hours.  
   - **Approach**:  
     - Reduce `gcTime` / persistence `maxAge`.  
     - Add `shouldDehydrateQuery` / equivalent to skip persisting empty arrays or failed queries.  
   - **Status**: _Planned._

5. **Improve Dashboard loading states for counts**  
   - **Goal**: Prevent transient “0 orphans / 0 sponsors / 0 team members” during initial load.  
   - **Approach**: Use `loading` flags from `useOrphansBasic`, `useSponsorsBasic`, and `useTeamMembersBasic` to render skeletons/spinners before showing counts.  
   - **Status**: _Planned._

6. **Fix custom cache stale-while-revalidate flicker**  
   - **Goal**: Stop toggling `loading` back to `true` during background refetch when cached data is already shown.  
   - **Approach**: Add an `isBackground` flag to legacy `fetch*` functions and only set `loading` for foreground fetches.  
   - **Status**: _Planned._

7. **Consolidate on a single caching strategy (React Query)**  
   - **Goal**: Remove the custom in-memory cache once all key hooks are migrated to React Query.  
   - **Approach**:  
     - Gradually migrate remaining hooks (`useTeamMembersBasic`, `useTeamMembers`, `useOccasions`, `useFinancialTransactions`, etc.) to React Query.  
     - Replace manual cache invalidation with `queryClient.invalidateQueries`.  
     - Remove `utils/cache.ts` after all usages are migrated.  
   - **Status**: _Planned._

### Next Execution Order (Continuing Work)

1. **React Query persistence hardening (highest impact / low risk)**
   - Lower persistence TTL from 24h to a shorter window (e.g. 2-6h) and keep `gcTime >= maxAge`.
   - Add `dehydrateOptions.shouldDehydrateQuery` to skip persisting:
     - queries in error state,
     - queries with `undefined`/`null` data,
     - known list queries where data is an empty array during initial fetch windows.
   - Add a versioned cache key so future persistence-policy changes can invalidate old snapshots intentionally.
   - **Validation**: reload app after forcing a temporary empty response and verify cache does not rehydrate stale-empty state.

2. **Dashboard loading-state correctness (user-visible trust fix)**
   - Use `loading` flags from `useOrphansBasic`, `useSponsorsBasic`, and `useTeamMembersBasic` in `Dashboard`.
   - Show skeleton/count placeholders until all three core counters are resolved at least once.
   - Prevent showing `0` unless fetch completed with a successful empty result.
   - **Validation**: throttle network + hard refresh; ensure no transient `0` counts appear before data settles.

3. **Legacy hook background-refetch flicker fix**
   - Update legacy cache hooks (`useOrphans`, `useSponsors`, `useTeamMembers`, `useOccasions`, `useFinancialTransactions`, `useMessages`, `useConversations`, `useDelegates`) to distinguish:
     - foreground loading (initial/explicit refresh),
     - background revalidation (keep existing UI data + non-blocking refresh indicator).
   - Add an explicit `isBackground`/`silent` fetch mode to avoid `setLoading(true)` when serving cached data.
   - **Validation**: open affected screens with warm cache; verify no loading-spinner flicker during SWR refresh.

4. **Cache-strategy consolidation (mid-term cleanup)**
   - Migrate remaining high-traffic hooks to React Query (priority: team members, occasions, financial transactions).
   - Replace manual cache invalidation with targeted `queryClient.invalidateQueries`.
   - Remove `utils/cache.ts` only after all runtime references are eliminated.
   - **Validation**: no imports of `utils/cache` remain; query invalidation covers create/update/delete flows.

### Observability and Regression Guardrails

- Add lightweight instrumentation for:
  - list query durations (`orphans-basic`, `sponsors-basic`, `team-members-basic`),
  - count of persisted queries,
  - count of persisted empty-list payloads (should trend toward zero after hardening).
- Add manual QA checklist for each phase:
  - hard refresh behavior,
  - role-specific visibility (team member vs sponsor),
  - cache restore across browser reload,
  - no permission-regression in manager-only UI controls.
- Recommended rollout: persistence hardening + dashboard fix first, then hook flicker pass, then full cache consolidation.

### Fixed Problems Log

- **RLS user context no longer depends on `pg_backend_pid()` + `user_sessions`**  
  - `get_current_user_id()` in `001_initial_schema.sql` now reads the `x-user-id` value from `request.headers` instead of querying `user_sessions`.  
  - `setCurrentUserId` in `lib/auth.ts` sets/clears the `x-user-id` header on the shared Supabase client instead of calling the `set_current_user_id` / `clear_current_user_id` RPCs.  
  - `ensureUserContext` / `withUserContext` in `lib/supabaseClient.ts` are now no-ops that simply execute the provided query, relying on headers for context.  
  - Effect: each HTTP request carries the user identity, so RLS policies see a stable user ID regardless of connection pooling, eliminating the “one entity at a time fails” race.

 - **AuthContext and permissions helpers memoized**  
   - `AuthProvider` now wraps helper functions (`isManager`, `canEdit*`) with `useCallback` and the exported `value` with `useMemo`, providing stable identities and preventing unnecessary re-renders.  
   - `usePermissions` was updated to read permissions as a boolean flag instead of repeatedly calling `isManager()` during render paths. This reduces noise and repeated permission evaluations in components.
   - Effect: fewer re-renders and repeated logs; permission checks are stable and inexpensive.

