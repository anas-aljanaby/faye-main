# Mobile Optimization Progress — فيء (Faye)

> This document tracks progress across multiple Codex runs.
> **Read before starting. Update after finishing.**

Last updated: 2026-04-16

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

### Task 2.1: Sign-in Page (`/signin`) `[x]`
**Priority:** P1
**Files likely involved:** `components/SignIn.tsx`
**Depends on:** None (no nav chrome)

**Requirements:**
- Ensure the centered card is not overflowing on small screens
- Card should be nearly full-width on mobile with small horizontal margin
- Input fields and button should be full-width inside the card
- Logo/branding should scale down if needed
- Gradient background should still look good

**Completion Notes:** Updated `components/SignIn.tsx` with a mobile-first
wrapper that avoids vertical clipping on short screens, tightened the card
and branding spacing for 375px–428px widths, and scaled the logo/headings
down below `md` while preserving the larger desktop presentation. Inputs and
the submit button now use full-width 48px+ touch targets inside a nearly
full-width card, and the gradient background remains intact.

**Known Issues:** No new sign-in specific issues were found during code
review. `npm run build` still reports the existing Vite chunk-size warning
for the large main bundle.

---

### Task 2.2: Dashboard — Team Member View (`/`) `[x]`
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

**Completion Notes:** Refined `components/Dashboard.tsx` for mobile-first
team-member use by tightening the hero spacing and typography, turning the
quick actions into full-width mobile buttons, and keeping the four key stats
as a denser 2×2 mobile grid with smaller icons and better text wrapping for
amounts. The analytics toggle now fits narrow screens with 44px tap targets,
the AI/activity and three widget sections stack cleanly, and the orphan,
sponsor, and team sections now use more tappable `عرض الكل` actions plus
smaller, more compact cards that stay single-column on phones while restoring
multi-column layouts from `md` upward.

**Known Issues:** `npm run build` still reports the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle, but no dashboard-specific compile issues were introduced.

---

### Task 2.3: Dashboard — Sponsor View (`/`) `[x]`
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

**Completion Notes:** Refined the sponsor dashboard in
`components/Dashboard.tsx` for 375px–428px widths by turning the hero into a
mobile-first layout with smaller typography, a horizontally scrollable action
row, and compact metric cards that scroll cleanly on narrow screens. The
orphan cards now collapse to a 1–2 column mobile grid, the follow-up team
section stays single-column until `md`, the smart financial record uses
touch-friendly stacked rows plus mobile-safe summary cards, and the promo
cards now stack vertically with lighter spacing. Removed the old sponsor-only
mobile action bar because it conflicted with the global `MobileBottomNav`,
while keeping its useful orphan-section shortcut as an in-page mobile button.

**Known Issues:** No new sponsor-dashboard-specific issues were found during
code review. `npm run build` still reports the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle.

---

### Task 2.4: Orphans List (`/orphans`) `[x]`
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

**Completion Notes:** Refined `components/OrphansList.tsx` into a true
mobile-first page by shrinking the header typography, moving the add/export
actions into a compact `...` menu on phones, and turning the filter control
into a touch-friendly mobile bottom sheet while preserving the desktop button
layout. Search and controls now stack cleanly on narrow widths, the grid view
stays single-column on phones, and list mode now swaps the desktop table for
full-width mobile cards with external page-level pagination so cards and the
desktop table both stay in sync with the server-side paging hook. Updated the
add-orphan and message modals to near-full-screen mobile sheets, improved the
selection action bar above the global bottom nav, and tightened shared
components in `EntityCard.tsx` and `DataTable.tsx` for smaller avatars,
lighter spacing, 44px tap targets, horizontal table scrolling, and optional
disabling of internal table pagination.

**Known Issues:** No new orphan-list-specific issues were found during code
review. `npm run build` still reports the existing `baseline-browser-mapping`
update notice and Vite chunk-size warning for the large main bundle.

---

### Task 2.5: Orphan Profile (`/orphan/:id`) `[x]`
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

**Completion Notes:** Reworked `components/OrphanProfile.tsx` into a
mobile-first layout by compressing the hero, stacking the avatar/name block,
adding a dedicated tappable back button, and keeping export/report actions
reachable with 44px targets. The tab rail now scrolls cleanly on phones, the
overview and education forms collapse to single-column layouts by default,
the interactive calendar and timeline controls were tightened to fit narrow
widths, the gallery stays a 2-column grid on mobile, and the financial tab
now uses a safer overflow wrapper plus reordered summary content for phones.
Also removed the obsolete page-level mobile action bar and updated the
profile’s page-specific modals and inline edit controls to use near-full-
screen mobile sheets with larger touch targets.

**Known Issues:** `npm run build` still reports the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle, but no orphan-profile-specific compile issues were
introduced.

---

### Task 2.6: Sponsors List (`/sponsors`) `[x]`
**Priority:** P2
**Files likely involved:** `components/SponsorsList.tsx`

**Requirements:**
- Same patterns as Task 2.4 (Orphans List) — apply equivalent responsive
  treatment to toolbar, grid/table toggle, cards, and modals
- "إضافة كافل" modal: near-full-screen on mobile
- Row actions: ensure tap targets are large enough

**Completion Notes:** Reworked `components/SponsorsList.tsx` into a
mobile-first screen by collapsing the header actions into a compact `...`
menu on phones, tightening the page spacing and typography, and turning the
sort controls into a touch-friendly mobile bottom sheet with filter counts.
List mode now swaps the desktop table for full-width mobile sponsor cards
with external pagination, while grid mode stays single-column on phones and
keeps denser multi-column layouts from `sm`/`lg` upward. Updated the
add-sponsor, edit, message, and orphan-assignment dialogs to near-full-screen
mobile sheets with 48px actions, removed the obsolete page-level mobile bar,
and improved selection handling so the bulk action strip sits safely above
the global bottom navigation.

**Known Issues:** `npm run build` completed successfully, but the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle still remain.

---

### Task 2.7: Sponsor Profile (`/sponsor/:id`) `[x]`
**Priority:** P2
**Files likely involved:** `components/SponsorPage.tsx`

**Requirements:**
- Same patterns as Task 2.5 (Orphan Profile) — stack header, scrollable
  tabs, responsive content per tab
- السجل المالي الذكي: full width, internal tables scroll horizontally
- Messaging modals: near-full-screen on mobile

**Completion Notes:** Reworked `components/SponsorPage.tsx` into a
mobile-first sponsor profile by tightening and stacking the header, adding a
clear back button plus 44px action controls, and introducing a horizontal
scrollable mobile tab rail so phones can switch between overview, sponsored
orphans, financial details, and support content without squeezing the desktop
layout. The sponsored orphans section now stays single-column on mobile, the
smart financial record was expanded into full-width responsive summary cards
plus horizontally scrollable tables for orphan payment status and recent
donations, and the old page-level mobile action bar was removed because it
conflicted with the global bottom navigation. Updated the message composer
and orphan-assignment modal into near-full-screen mobile sheets while keeping
their existing behavior intact on larger breakpoints.

**Known Issues:** `npm run build` completed successfully, but the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle still remain.

---

### Task 2.8: Sponsor Payments (`/payments`) `[x]`
**Priority:** P1
**Files likely involved:** `components/SponsorPaymentsPage.tsx`

**Requirements:**
- Summary stat cards: 2×2 grid or horizontal scroll on mobile
- Filters row: stack vertically (search full-width, then filter chips)
- Expandable orphan sections: full width, no horizontal overflow
- Payment calendar inside expanded section: must fit 375px width;
  consider reducing month cell sizes or horizontal scrolling
- PaymentStatusBadge: ensure readable at mobile sizes

**Completion Notes:** Reworked `components/SponsorPaymentsPage.tsx`
into a mobile-first sponsor payments screen by tightening the page header,
keeping the year selector and dashboard link as full-width mobile controls,
and turning the summary area into a denser 2×2 stat grid on phones while
preserving wider desktop layouts from `md`/`lg` upward. The filters now
stack as a full-width search field, horizontally scrollable status chips with
counts, and a separate mobile-friendly sort row, while each orphan section
was rebuilt as a touch-friendly expandable card with smaller avatars,
wrapped summary pills, and no page-level horizontal overflow. The payment
calendar now uses compact month tiles with contained horizontal scrolling on
small widths, the history list was tightened into stacked mobile cards, and
`components/PaymentStatusBadge.tsx` was updated with slightly taller, more
readable pills for narrow screens.

**Known Issues:** `npm run build` completed successfully, but the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle still remain.

---

### Task 2.9: Messages (`/messages`) `[x]`
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

**Completion Notes:** Reworked `components/Messages.tsx` into a mobile-first
messaging screen by preserving the existing desktop two-pane layout from `md`
upward while making phones show only the conversation list first and switch to
a full-width thread view after selection. The list header now uses a full-width
search field plus a touch-friendly new-conversation action, the thread header
adds a dedicated mobile back button, message bubbles now cap at roughly 85% of
the viewport, and the composer was tightened into a bottom-anchored thread
footer with safe-area padding so it stays reachable above the global bottom
navigation. Updated both the new-conversation modal and the templates modal to
near-full-screen mobile sheets with larger tap targets and scrollable content.

**Known Issues:** `npm run build` completed successfully, but the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle still remain.

---

### Task 2.10: Human Resources (`/human-resources`) `[x]`
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

**Completion Notes:** Reworked `components/HumanResources.tsx` into a more
mobile-first shell by tightening the page header, turning the long HR section
tabs into a snap-scrolling horizontal rail, and ensuring placeholder sections
stay contained on narrow screens. The embedded `components/TeamList.tsx` now
uses a dedicated single-column mobile card list below `md`, tighter toolbar
controls, more flexible permission rows, and near-full-screen bottom-sheet
modals for member actions. The volunteers and delegates sections now stack
their filters and summary cards cleanly, swap desktop tables for touch-friendly
mobile cards, and use near-full-screen add/edit sheets with safer mobile
footer actions and 48px inputs/buttons.

**Known Issues:** `npm run build` completed successfully, but the existing
`baseline-browser-mapping` update notice and Vite chunk-size warning for the
large main bundle still remain.

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
| Phase 1: Navigation | 1.1, 1.2, 1.3 | Completed |
| Phase 2: Pages | 2.1 – 2.13 | In progress |
| Phase 3: Polish | 3.1 – 3.4 | Not started |

**Total tasks:** 20
**Completed:** 9
**Remaining:** 11
