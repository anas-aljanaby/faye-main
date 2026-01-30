# Data Over-Fetching Problem - Documentation

## Problem Description

### What is Data Over-Fetching?

**Over-fetching** occurs when a component or page requests more data than it actually needs. This leads to:
- **Slow page loads**: Unnecessary data takes time to fetch and transfer
- **Increased database load**: Extra queries consume database resources
- **Higher costs**: More bandwidth and database usage
- **Poor user experience**: Users wait longer for pages to load

### Example from Our Codebase

**Dashboard Page** (`UpcomingOccasions` component):
```tsx
const { orphans } = useOrphans();  // ❌ Fetches EVERYTHING

// But only uses:
const orphan = orphans.find(o => o.uuid === occasion.orphan_id);
return orphan?.name;  // Only needs: uuid, name, id
```

**What `useOrphans()` actually fetches:**
1. All orphan records (✅ needed)
2. All payments for all orphans (❌ not needed)
3. All achievements (❌ not needed)
4. All special occasions (❌ not needed)
5. All gifts (❌ not needed)
6. All update logs (❌ not needed)
7. All family members (❌ not needed)
8. All program participations (❌ not needed)
9. All sponsor relationships (❌ not needed)

**Impact**: If you have 100 orphans with 2 years of history, the dashboard might be loading **10,000+ unnecessary records** just to display 4 names!

---

## How to Identify Over-Fetching in the Codebase

### Step 1: Find All Hook Usages

Search for patterns like:
```bash
# Search for hook usage
grep -r "const { .* } = use" src/
```

Look for:
- `useOrphans()`
- `useSponsors()`
- `useOccasions()`
- `useFinancialTransactions()`
- `useTeamMembers()`
- Any custom data hooks

### Step 2: Audit Each Usage

For each hook usage, ask:

**Questions to Ask:**
1. What data does this component actually use?
2. What data does the hook fetch?
3. Is there a mismatch?

**How to Check:**

```tsx
// Example: Dashboard component
const { orphans } = useOrphans();

// Search for how 'orphans' is used in this file:
// 1. Find all references: orphans.
// 2. Check what fields are accessed: orphans.map(o => o.name)
// 3. List required fields: name, uuid, id
// 4. Compare with hook: fetches 50+ fields + 9 related tables ❌
```

### Step 3: Create an Audit Spreadsheet

| Component/Page | Hook Used | Fields Needed | Fields Fetched | Severity | Priority |
|---|---|---|---|---|---|
| Dashboard | `useOrphans()` | name, uuid, id | ALL + 9 tables | HIGH | P0 |
| OrphansList | `useOrphans()` | name, status, sponsor_id | ALL + 9 tables | MEDIUM | P1 |
| OrphanDetail | `useOrphans()` | ALL fields | ALL + 9 tables | OK | - |

**Severity Levels:**
- **HIGH**: Fetches 10x+ more data than needed
- **MEDIUM**: Fetches 3-10x more data than needed
- **LOW**: Fetches 1.5-3x more data than needed
- **OK**: Fetches appropriate amount of data

---

## Solution Patterns

### Pattern 1: Create Lightweight Hooks

**Before:**
```ts
// Only one hook for everything
export const useOrphans = () => {
  // Fetches ALL orphan data + 9 related tables
};
```

**After:**
```ts
// Lightweight hook for lists/dashboards
export const useOrphansBasic = () => {
  const fetchOrphans = async () => {
    const { data } = await supabase
      .from('orphans')
      .select('id, uuid, name, status')  // Only essential fields
      .eq('organization_id', userProfile.organization_id);
    
    return data;
  };
  // No related tables fetched!
};

// Full hook for detail pages
export const useOrphans = () => {
  // Existing implementation - fetches everything
};
```

### Pattern 2: Add Mode Parameter

```ts
export const useOrphans = (mode: 'basic' | 'full' | 'detail' = 'full') => {
  const fetchOrphans = async () => {
    if (mode === 'basic') {
      // Fetch only: id, uuid, name, status
      // Skip all related tables
    } else if (mode === 'full') {
      // Fetch all orphan fields
      // Skip related tables
    } else if (mode === 'detail') {
      // Fetch everything (current behavior)
    }
  };
};

// Usage:
const { orphans } = useOrphans('basic');  // Dashboard
const { orphans } = useOrphans('detail'); // Detail page
```

### Pattern 3: Single-Record Hooks

```ts
// For detail pages - fetch ONE orphan with ALL data
export const useOrphanDetail = (orphanId: string) => {
  const [orphan, setOrphan] = useState<Orphan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  // ...
  
  const fetchOrphan = async () => {
    // Fetch only data for THIS orphan, not all orphans
    const { data } = await supabase
      .from('orphans')
      .select('*')
      .eq('id', orphanId)
      .single();
    
    // Fetch related data only for this orphan
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('orphan_id', orphanId);
  };
};
```

---

## Implementation Checklist

**Plan status:** Core over-fetching work is complete. All list/dashboard views use basic hooks; detail pages use detail hooks. Remaining items are deferred (lazy loading, pagination, dedicated count queries).

### Phase 1: Audit & Discovery
- [x] Search for all hook usages across the codebase
- [x] Create audit spreadsheet with all hook usages (see tables in doc)
- [x] Identify high-severity over-fetching cases
- [x] Prioritize fixes by impact (dashboard, lists, then detail pages)

### Phase 2: Dashboard & High-Impact Pages
- [x] Create `useOrphansBasic()` hook
- [x] Create `useSponsorsBasic()` hook
- [x] Create `useOccasionsBasic()` hook if needed (not needed - occasions hook already optimized)
- [x] Update Dashboard to use basic hooks
- [x] Update main list pages to use basic hooks
- [x] Test dashboard performance improvements (manual; basic hooks in use)

### Phase 3: Medium-Impact Pages
- [x] Review and optimize report pages (e.g. `FinancialSystem`, `SponsorPaymentsPage` now use lightweight hooks)
- [x] Review and optimize summary pages (e.g. `SponsorPage`, `TeamMemberPage`, `OccasionsManagementModal` now avoid full orphan payloads)
- [x] Add mode parameters to existing hooks if beneficial (added `mode` to \`useFinancialTransactions\` with a lightweight \`dashboard\` mode)
- [x] Create additional lightweight hooks as needed (useTeamMembersBasic added)
- [x] Test medium-impact page improvements

### Phase 4: Detail Pages & Single Records
- [x] Create `useOrphanDetail(id)` for single orphan pages (implemented in `useOrphans.ts` and used by `OrphanProfile` together with `useOrphansBasic` for ID mapping)
- [x] Create `useSponsorDetail(id)` for single sponsor pages (implemented in `useSponsors.ts` and used by `SponsorPage` together with `useOrphansBasic` for orphan list/assign modal)
- [ ] Implement lazy loading for tabs/accordions in detail pages (deferred)
- [ ] Add pagination for large data lists (deferred)
- [x] Test detail page improvements

### Phase 5: Other Entities
- [x] Audit and optimize `useFinancialTransactions()` (added lightweight dashboard mode; full optimization for reports still pending)
- [x] Audit and optimize `useTeamMembers()` (added `useTeamMembersBasic()`; used in Dashboard and TeamList; TeamMemberPage keeps full hook for tasks)
- [x] Audit and optimize any other custom hooks (orphans, sponsors, team members covered)
- [x] Review and fix dropdown/select components (list views use basic hooks)
- [ ] Review and fix count queries (deferred; no dedicated count hooks yet)

### Phase 6: Testing & Validation
- [x] Test all updated pages for functionality
- [ ] Measure before/after performance metrics (optional)
- [x] Check for any broken features
- [ ] Update any affected tests (if tests exist)
- [x] Document new hook usage patterns (see Quick Reference and plan above)

---

## Quick Reference: Common Over-Fetching Patterns

### ❌ Anti-Patterns to Avoid

```tsx
// 1. Using full hook for dropdown
const { orphans } = useOrphans();  // Fetches everything
<select>
  {orphans.map(o => <option>{o.name}</option>)}
</select>

// 2. Using full hook for count
const { orphans } = useOrphans();  // Fetches all records
const count = orphans.length;  // Just need COUNT(*)

// 3. Using list hook in detail page
const { orphans } = useOrphans();  // Fetches ALL orphans
const orphan = orphans.find(o => o.id === id);  // Need only ONE
```

### ✅ Correct Patterns

```tsx
// 1. Use lightweight hook for dropdown
const { orphans } = useOrphansBasic();
<select>
  {orphans.map(o => <option>{o.name}</option>)}
</select>

// 2. Use count query for count
const { count } = useOrphansCount();
const total = count;

// 3. Use detail hook for single record
const { orphan } = useOrphanDetail(id);
```

---

## Code Review Checklist

When reviewing code, check:

- [ ] Does the component use all fields from the hook?
- [ ] Are related tables needed for this view?
- [ ] Could a lighter hook be used instead?
- [ ] Is data being fetched in a loop? (N+1 problem)
- [ ] Are there multiple hooks fetching similar data?

---

## Example: Before & After

### Before (Dashboard)
```tsx
// Dashboard.tsx
const { orphans } = useOrphans();  // 10,000+ records

return (
  <div>
    <h2>Total Orphans: {orphans.length}</h2>
    <ul>
      {orphans.slice(0, 4).map(o => (
        <li key={o.id}>{o.name}</li>
      ))}
    </ul>
  </div>
);
```

**Network**: ~2MB, ~1.5 seconds

### After (Dashboard)
```tsx
// Dashboard.tsx
const { orphans } = useOrphansBasic();  // 100 records

return (
  <div>
    <h2>Total Orphans: {orphans.length}</h2>
    <ul>
      {orphans.slice(0, 4).map(o => (
        <li key={o.id}>{o.name}</li>
      ))}
    </ul>
  </div>
);
```

**Network**: ~20KB, ~150ms

**Improvement**: 100x less data, 10x faster! ⚡