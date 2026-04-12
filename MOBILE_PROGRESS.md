# Mobile Optimization Progress — فيء (Faye)

> This document tracks progress across multiple Codex runs.
> **Read before starting. Update after finishing.**

Last updated: 2026-04-12

---

## Phase 1: Global Chrome & Navigation

### Task 1.1: Bottom Navigation Bar `[x]`
**Priority:** P0 — must be done first, all other tasks depend on it
**Files likely involved:** `App.tsx`, `components/Sidebar.tsx`,
`components/Header.tsx`, new `components/MobileBottomNav.tsx`

**Requirements:**
- Create `MobileBottomNav.tsx` with role-aware tab rendering
- Role detection: use same auth/role logic as Sidebar (check `AuthContext`,
  `usePermissions`, or however Sidebar determines the role)
- Tab config for team members: Dashboard, Orphans, Messages (badge),
  Financial (badge), More
- Tab config for sponsors: Dashboard, Orphans, Payments, Messages (badge),
  Policies
- "More" menu: bottom sheet or modal with remaining nav items + logout
- Fixed bottom positioning, proper z-index above content
- Active route highlighting (use `useLocation` from react-router)
- Integrate into app shell — show below `md`, hide on `md` and above
- Add bottom padding to main content area on mobile to prevent overlap
- Hide hamburger button in Header on mobile (the sidebar drawer is replaced)
- Ensure the desktop sidebar is completely unaffected

**Completion Notes:** Added `components/MobileBottomNav.tsx` with role-aware
tabs for team members and sponsors, including message/financial badges,
active-route highlighting via `useLocation`, and a mobile bottom sheet for
`المزيد` with logout. Extracted shared nav/count logic into
`components/navigationConfig.tsx`, wired the new bar into `App.tsx`, added
mobile bottom padding to the main content area, and removed the mobile
hamburger trigger from `Header.tsx`. To prevent immediate overlap regressions,
legacy page-level mobile action bars were either hidden when redundant or
lifted above the new global bottom nav when they still expose selection
actions.

**Known Issues:** The old mobile sidebar drawer markup/state still exists
off-canvas and should be fully removed in Task 1.3. Some page-specific mobile
action strips now need dedicated redesign in their own page tasks, even though
they no longer collide with the new global navigation.

---

### Task 1.2: Header Mobile Refinement `[x]`
**Priority:** P0
**Files likely involved:** `components/Header.tsx`
**Depends on:** Task 1.1

**Requirements:**
- Remove hamburger menu icon on mobile (bottom nav replaces it)
- Keep: logo/brand, notification bell, user avatar dropdown
- Reduce header height on mobile if currently oversized
- Ensure notification bell badge is visible and tappable (min 44px)
- Verify avatar dropdown works well on mobile (proper positioning)
- Keep all desktop header behavior intact behind `md:` breakpoint

**Completion Notes:** Refined `components/Header.tsx` for mobile by reducing
the header height, tightening the brand sizing, and enforcing 44px tap
targets for the notification bell and avatar trigger. The bell badge and both
floating panels now clamp more cleanly inside narrow viewports, and mobile
theme access moved into the avatar dropdown so the top bar keeps only the
brand, notifications, and user menu while desktop header behavior remains
unchanged behind `md:`.

**Known Issues:** The old mobile sidebar drawer state/markup still exists in
the shell even though the header no longer exposes a mobile menu trigger; Task
1.3 should remove that remaining mobile sidebar plumbing.

---

### Task 1.3: Hide Sidebar on Mobile `[x]`
**Priority:** P0
**Files likely involved:** `components/Sidebar.tsx`, `App.tsx`
**Depends on:** Task 1.1

**Requirements:**
- Sidebar should not render at all below `md` breakpoint
- Remove any mobile sidebar overlay/drawer behavior
- Desktop sidebar (collapsible, resizable) must be completely untouched
- Clean up any related state (e.g., mobile sidebar open/close state)
  so there are no orphaned handlers

**Completion Notes:** Removed the remaining mobile sidebar drawer plumbing by
making `components/Sidebar.tsx` render only on desktop, deleting its old
mobile overlay/slide-in behavior and close button, and preserving the
existing desktop resize/collapse logic. Cleaned up `App.tsx` by removing the
unused mobile sidebar open state, and simplified `components/Header.tsx` to
drop the orphaned menu callback so mobile navigation now relies solely on the
bottom navigation introduced in Task 1.1.

**Known Issues:** No new functional issues were found during code review, but
`npm run build` still reports the existing Vite chunk-size warning for the
large main bundle.

---

## Phase 2: Page-by-Page Mobile Optimization

### Task 2.1: Sign-in Page (`/signin`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/SignIn.tsx`
**Depends on:** None (no nav chrome)

**Requirements:**
- Ensure the centered card is not overflowing on small screens
- Card should be nearly full-width on mobile with small horizontal margin
- Input fields and button should be full-width inside the card
- Logo/branding should scale down if needed
- Gradient background should still look good

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.2: Dashboard — Team Member View (`/`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/Dashboard.tsx`
**Depends on:** Task 1.1, 1.2, 1.3

**Requirements:**
- Hero strip: stack vertically, reduce heading size
- Quick action buttons: full-width stacked or side by side if they fit
- Four stat tiles: 2×2 grid on mobile (they likely already do this based
  on screenshots, but verify sizing)
- Analytics section ("نظرة سريعة"): cards stack vertically
- Week/month/year toggle: ensure it fits and is tappable
- رؤى ذكية card + آخر الأنشطة: stack vertically, full width
- Three widget row (occasions, financial approvals, achievements):
  stack vertically
- Orphan grid: 1 or 2 columns on mobile
- Sponsor cards: single column stack
- Team cards: single column stack
- "عرض الكل" links: ensure they're tappable
- Overall: reduce paddings, margins, font sizes for mobile density
- Reduce icon sizes throughout the dashboard to mobile-appropriate sizes

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.3: Dashboard — Sponsor View (`/`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/Dashboard.tsx`
**Depends on:** Task 1.1, 1.2, 1.3

**Requirements:**
- Hero: stack vertically, reduce heading sizes
- Action buttons (الدفعات، الرسائل، تصدير): horizontal scroll or wrap
- Three metric cards: stack or 1×3 horizontal scroll
- Orphan grid: 1-2 columns
- Team members section: single column
- السجل المالي الذكي: full-width, scrollable table if needed
- Promo cards: stack vertically
- The existing "mobile bottom bar" mentioned in UI_GUIDE.md — check if it
  conflicts with the new MobileBottomNav. If so, either integrate its
  actions into the page or remove if redundant
- Reduce icon sizes to mobile-appropriate sizes

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.4: Orphans List (`/orphans`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/OrphansList.tsx`,
`components/EntityCard.tsx`, `components/DataTable.tsx`

**Requirements:**
- Page header: title and action buttons. On mobile, collapse actions into
  a single "..." menu or row of icon buttons (no long text buttons)
- Search + filter row: stack if needed; filter popover must work on mobile
- Grid mode: single column on mobile (or 2 columns if cards are compact)
- Table mode: either horizontal scroll wrapper OR switch to card layout on
  mobile. Prefer cards for touch friendliness.
- Pagination: ensure controls are tappable
- "إضافة يتيم" modal: near-full-screen on mobile
- Reduce icon sizes in cards and table rows
- Bulk action bar (if visible): fixed bottom strip above the nav bar

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.5: Orphan Profile (`/orphan/:id`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/OrphanProfile.tsx`

**Requirements:**
- Profile header: stack avatar and info vertically on mobile
- Avatar should be smaller on mobile (e.g., 80px instead of 120px+)
- Horizontal tabs: scrollable horizontal list (`overflow-x-auto`)
- Tab content — all tabs need checking:
  - نظرة عامة: form fields stack single column
  - التعليم: same
  - الجدول الزمني: calendar should fit mobile width
  - المعرض: gallery grid 2 columns on mobile
  - المالية: table horizontal scroll or card layout
- Edit mode controls: accessible on mobile
- PDF export: button still accessible
- Back navigation: clear and tappable
- Reduce all oversized icons

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.6: Sponsors List (`/sponsors`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/SponsorsList.tsx`

**Requirements:**
- Same patterns as Task 2.4 (Orphans List) — apply equivalent responsive
  treatment to toolbar, grid/table toggle, cards, and modals
- "إضافة كافل" modal: near-full-screen on mobile
- Row actions: ensure tap targets are large enough

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.7: Sponsor Profile (`/sponsor/:id`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/SponsorPage.tsx`

**Requirements:**
- Same patterns as Task 2.5 (Orphan Profile) — stack header, scrollable
  tabs, responsive content per tab
- السجل المالي الذكي: full width, internal tables scroll horizontally
- Messaging modals: near-full-screen on mobile

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.8: Sponsor Payments (`/payments`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/SponsorPaymentsPage.tsx`

**Requirements:**
- Summary stat cards: 2×2 grid or horizontal scroll on mobile
- Filters row: stack vertically (search full-width, then filter chips)
- Expandable orphan sections: full width, no horizontal overflow
- Payment calendar inside expanded section: must fit 375px width;
  consider reducing month cell sizes or horizontal scrolling
- PaymentStatusBadge: ensure readable at mobile sizes

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.9: Messages (`/messages`) `[ ]`
**Priority:** P1
**Files likely involved:** `components/Messages.tsx`

**Requirements:**
- This is the most complex mobile adaptation due to two-pane layout
- Mobile: show ONLY conversation list initially (full width)
- When a conversation is tapped: hide list, show thread full-width
- Add a back button/arrow in thread header to return to list
- Use state or route to toggle between list and thread views
- Conversation list search: full width
- Thread composer: fixed bottom inside thread view, above bottom nav
- Message bubbles: max-width ~85% of screen
- "بدء محادثة جديدة" modal: near-full-screen
- Template modal: near-full-screen
- Desktop two-pane layout must be completely preserved

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.10: Human Resources (`/human-resources`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/HumanResources.tsx`,
`components/TeamList.tsx`

**Requirements:**
- Horizontal pill tabs: `overflow-x-auto` with `flex-nowrap`, hide
  scrollbar, snap scrolling if possible
- Active tab clearly visible even when scrolled
- Team list content: cards stack single column
- Volunteers table: horizontal scroll or card layout on mobile
- Delegates UI: same treatment
- Add/edit modals: near-full-screen
- Placeholder tabs: just ensure they don't overflow

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.11: Financial System (`/financial-system`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/FinancialSystem.tsx`

**Requirements:**
- KPI stat cards: 2×2 or horizontal scroll
- Charts: full width, reduce height slightly on mobile
- Bar chart and pie chart: stack vertically
- Transaction table: horizontal scroll wrapper or card layout
- Approve/reject modals: near-full-screen on mobile
- Receipt/PDF modal: full-screen on mobile
- Orphan payment sections with calendar: same treatment as Task 2.8
- Year selector: ensure it fits mobile width
- Filter controls: stack vertically

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.12: Policies (`/policies`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/policies/PoliciesLayout.tsx`,
`components/policies/PoliciesContent.tsx`, related policy components

**Requirements:**
- Reading progress bar: keep as-is (should work fine)
- Sidebar TOC: hide on mobile, add a floating TOC button or collapsible
  section at the top instead
- Main content column: full width with appropriate padding
- Typography: ensure long-form content is readable (16px+ body text)
- Tables inside policy content: horizontal scroll
- Print styles: should still work
- Stepper/grid components: stack on mobile

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 2.13: Team Member Page (`/team/:id`) `[ ]`
**Priority:** P2
**Files likely involved:** `components/TeamMemberPage.tsx`

**Requirements:**
- Profile header: stack vertically
- Two-column layout: stack (right column content above or below left)
- Calendar: must fit mobile width (reduce cell size if needed)
- Task lists and orphan/sponsor lists: single column
- Day task detail: below calendar, full width
- Assignment modals: near-full-screen
- The existing "mobile action bar" mentioned in UI_GUIDE — check if it
  conflicts with MobileBottomNav. Keep page-specific actions but ensure
  they don't overlap the global bottom nav

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

## Phase 3: Polish & Cross-Cutting

### Task 3.1: Modal Consistency Pass `[ ]`
**Priority:** P2
**Depends on:** All Phase 2 tasks

**Requirements:**
- Audit all modals/dialogs across the app
- Ensure consistent mobile treatment: near-full-screen below `md`
- Close button always accessible (not hidden by notch/safe area)
- Add `safe-area-inset-bottom` padding where modals have bottom actions
- Scroll behavior: modal body scrolls, header/footer fixed

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 3.2: Touch Target & Icon Size Audit `[ ]`
**Priority:** P2
**Depends on:** All Phase 2 tasks

**Requirements:**
- Scan all interactive elements for minimum 44px touch targets
- Reduce any oversized icons (anything above 24px in content areas)
- Ensure icon buttons have adequate padding for touch
- Check dropdowns, selects, and custom controls

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 3.3: Safe Areas & Viewport `[ ]`
**Priority:** P3
**Depends on:** Task 1.1

**Requirements:**
- Ensure `<meta name="viewport">` is correctly set in `index.html`
- Add `env(safe-area-inset-bottom)` to bottom nav for iPhone notch
- Add `env(safe-area-inset-top)` to header if needed
- Test that fixed elements (bottom nav, fixed headers) account for
  safe areas

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

### Task 3.4: Loading & Empty States on Mobile `[ ]`
**Priority:** P3
**Depends on:** All Phase 2 tasks

**Requirements:**
- Skeleton loaders should match mobile layouts (not desktop widths)
- Empty state illustrations/text should be centered and sized for mobile
- Error messages should not overflow on small screens

**Completion Notes:** (to be filled by agent)

**Known Issues:** (to be filled by agent)

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Navigation | 1.1, 1.2, 1.3 | In progress |
| Phase 2: Pages | 2.1 – 2.13 | Not started |
| Phase 3: Polish | 3.1 – 3.4 | Not started |

**Total tasks:** 20
**Completed:** 2
**Remaining:** 18
