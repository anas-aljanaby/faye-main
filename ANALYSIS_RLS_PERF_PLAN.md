## RLS, Data Loading, and Re-render Fix Plan

This file tracks the plan and status for fixing the intermittent data-loading issues and excessive `isManager` logging. It is intentionally ignored by git.

### Overview of Problems

1. **RLS user context via `pg_backend_pid()` is unsafe with connection pooling**, causing intermittent empty results for `orphans`, `sponsors`, and `team members`.
2. **AuthContext value and permission helpers are not memoized**, causing excessive re-renders and repeated `isManager` logs.
3. **`usePermissions` and several components call `isManager()` directly in render flow**, amplifying logging and re-renders.
4. **React Query persistence can store empty/failed results for up to 24 hours**, making missing data appear "stuck".
5. **Dashboard stats render `0` counts without checking loading state**, leading to brief but confusing zero values during load.
6. **Legacy hooks' custom cache revalidation toggles `loading` during background refetch**, causing flicker.
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
     - Add versioned cache key (`CACHE_VERSION`) to allow future invalidation.
   - **Status**: ✅ _Implemented (maxAge reduced to 4h, shouldDehydrateQuery guards error/empty-list queries, CACHE_VERSION=2 key added)._

5. **Improve Dashboard loading states for counts**
   - **Goal**: Prevent transient "0 orphans / 0 sponsors / 0 team members" during initial load.
   - **Approach**: Use `loading` flags from `useOrphansBasic`, `useSponsorsBasic`, and `useTeamMembersBasic` to render skeletons/spinners before showing counts.
   - **Status**: ✅ _Implemented (`countsLoading` flag gates 4 hero stat cards with an animate-pulse skeleton until all three basic hooks resolve)._

6. **Fix custom cache stale-while-revalidate flicker**
   - **Goal**: Stop toggling `loading` back to `true` during background refetch when cached data is already shown.
   - **Approach**: Add a `silent` parameter to all legacy `fetch*` functions; background revalidations pass `silent=true` to skip `setLoading(true)`.
   - **Status**: ✅ _Implemented across all 8 legacy hooks (useOrphans, useSponsors, useTeamMembers, useOccasions, useFinancialTransactions, useConversations, useMessages, useDelegates)._

7. **Consolidate on a single caching strategy (React Query)**
   - **Goal**: Remove the custom in-memory cache once all key hooks are migrated to React Query.
   - **Approach**:
    - Gradually migrate remaining hooks (`useTeamMembersBasic` and `useTeamMembers` done; `useOccasions`, `useFinancialTransactions`, etc. still pending).
     - Replace manual cache invalidation with `queryClient.invalidateQueries`.
     - Remove `utils/cache.ts` after all usages are migrated.
   - **Status**: _Partially done — `useTeamMembersBasic` and full `useTeamMembers` migrated to React Query. Remaining full hooks still use in-memory cache._

### Next Steps (Remaining Work)

1. **Migrate remaining high-traffic hooks to React Query**
   - Priority order: _Completed_.
   - For each: extract a standalone `fetch*Data` async function, replace hook body with `useQuery`, use stable empty-array defaults.
   - **Validation**: each migrated hook benefits from localStorage persistence, dedup, and the shouldDehydrateQuery empty-guard.

2. **Replace manual cache invalidation with `queryClient.invalidateQueries`**
   - Currently, create/update/delete operations call `cache.delete(key)` + `refetch()` manually.
   - After migration, replace with targeted `queryClient.invalidateQueries({ queryKey: [...] })`.
   - **Validation**: mutations on orphans/sponsors/team members/occasions correctly refresh all consumers.

3. **Remove `utils/cache.ts`**
   - Only after all runtime `import { cache }` usages are eliminated.
   - **Validation**: no imports of `utils/cache` remain in the codebase.

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
  - Effect: each HTTP request carries the user identity, so RLS policies see a stable user ID regardless of connection pooling, eliminating the "one entity at a time fails" race.

- **AuthContext and permissions helpers memoized**
  - `AuthProvider` now wraps helper functions (`isManager`, `canEdit*`) with `useCallback` and the exported `value` with `useMemo`, providing stable identities and preventing unnecessary re-renders.
  - `usePermissions` was updated to read permissions as a boolean flag instead of repeatedly calling `isManager()` during render paths. This reduces noise and repeated permission evaluations in components.
  - Effect: fewer re-renders and repeated logs; permission checks are stable and inexpensive.

- **React Query persistence hardened**
  - `maxAge` reduced from 24h to 4h. `CACHE_VERSION=2` key added to bust old snapshots on future schema changes.
  - `shouldDehydrateQuery` added: error-state queries and empty-array results for core list queries (`orphans-basic`, `sponsors-basic`, `team-members-basic`) are never written to localStorage.
  - Effect: a failed/empty first fetch no longer poisons the cache for up to 24 hours.

- **Dashboard hero stat cards no longer show transient 0s**
  - `countsLoading` derived from the three `*Basic` hooks gates the four stat card numbers.
  - While any hook is in its initial load, an `animate-pulse` skeleton replaces the count.
  - Effect: users see a loading indicator instead of misleading zeros during the first data fetch.

- **Legacy hook SWR background-refetch no longer flickers the loading spinner**
  - Added `silent` parameter to all 8 legacy fetch functions. Background revalidation calls pass `silent=true`, skipping `setLoading(true)`.
  - Effect: screens with warm in-memory cache show data immediately; the spinner only appears on cold (cache-miss) loads.

- **`useTeamMembersBasic` migrated to React Query**
  - Now uses `useQuery` with key `['team-members-basic', organizationId]`, matching the other two basic hooks.
  - Benefits from localStorage persistence, `shouldDehydrateQuery` empty-guard, and React Query deduplication.
  - Effect: consistent cache behavior across all three Dashboard basic hooks; team member count survives a page reload like orphans and sponsors.

- **Full `useTeamMembers` hook migrated to React Query**
  - The full team-members hook now uses `useQuery` (`['team-members', organizationId]`) instead of the custom in-memory `cache`.
  - A dedicated `fetchTeamMembersData()` function now handles team members + tasks fetch/transform.
  - Legacy `refetch(useCache?, silent?)` call shape is preserved (arguments ignored) so existing callsites do not break.
  - Effect: team-member detail loading now uses unified React Query caching/dedup semantics and no longer depends on `utils/cache.ts`.

### Incremental Execution Plan (with manual checks after each change)

1. **Change: migrate `useOccasions` read path to React Query**
   - Why this is safe: it is read-heavy and already used by multiple pages that benefit from shared dedup/caching.
   - Expected outcome: opening Dashboard + Occasions modal in the same session should not issue duplicate cold fetches for identical params.
   - Manual test:
     - Open Dashboard (load upcoming occasions), then open the occasions management modal.
     - In Network/console, verify the second view reuses cache/refetches predictably instead of full duplicate load.
     - Confirm sponsor/team-member visibility rules are unchanged.

2. **Change: migrate `useFinancialTransactions` to React Query**
   - Why this is safe: data shape is list-oriented, no custom optimistic writes required for first pass.
   - Expected outcome: transactions list appears from cache immediately after reload when data is warm; no spinner flicker on background refresh.
   - Manual test:
     - Visit financial screen, reload, then navigate away/back.
     - Confirm data remains visible and updates in background without hard loading state regressions.

3. **Change: migrate `useConversations` + `useMessages` to React Query**
   - Why this is safe: chat fetches are read-centric and can benefit from key-based invalidation after send/delete mutations.
   - Expected outcome: opening the same conversation repeatedly should feel snappier and avoid redundant full fetches.
   - Manual test:
     - Open conversations list, enter a conversation, go back, re-enter.
     - Confirm message history is stable and no stale-empty screen persists after refresh.

4. **Change: replace remaining manual cache invalidation with `queryClient.invalidateQueries`**
   - Why this is safe: invalidation is explicit and key-scoped, avoiding custom cache divergence.
   - Expected outcome: after create/update/delete, all dependent views refresh consistently without manual `cache.delete(...)`.
   - Manual test:
     - Perform one mutation in each area (occasion, transaction, message when available).
     - Confirm list and detail views both refresh to the same state.

5. **Change: remove `utils/cache.ts` once no runtime imports remain**
   - Why this is safe: only done after all usage is eliminated and validated.
   - Expected outcome: search shows zero runtime imports of `utils/cache`; app behavior remains unchanged.
   - Manual test:
     - Run a repo search for `utils/cache` and verify no active app imports remain.
     - Smoke test Dashboard, Team Member page, Occasions, Financial, and Messages.

### Latest Completed Change

- **Change**: migrated `useMessages` read path from custom in-memory cache to React Query (`useQuery` key: `['messages', conversationId]`), while preserving real-time behavior.
- **Why this is good**:
  - Preserves existing consumer API (`messages`, `loading`, `error`, `sendMessage`, `markMessagesAsRead`) used by `Messages` UI.
  - Keeps realtime insert/update behavior by updating React Query cache via `queryClient.setQueryData`.
  - Maintains polling fallback on realtime channel errors/timeouts without depending on `utils/cache`.
- **Expected outcome**:
  - Opening a conversation shows message history with the same ordering and sender metadata.
  - New incoming messages and read-state updates still appear in near real-time, with polling fallback if subscription fails.
- **Manual test**:
  1. Open a conversation and verify existing messages load in chronological order.
  2. Send a message and verify it appears immediately in the thread.
  3. From another account/session, send a message in the same conversation and verify live update appears.
  4. Re-open the conversation and verify unread messages are marked as read correctly.
