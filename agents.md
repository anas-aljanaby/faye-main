# AGENTS.md — Mobile Optimization for فيء (Faye)

## Context

This is an Arabic RTL orphan sponsorship management app built with React 19,
TypeScript, Vite, Tailwind CSS, and Supabase. The app currently works well on
desktop but has NOT been optimized for mobile. Our sole focus is making every
screen work beautifully on mobile devices (375px–428px width range).

See `PROJECT_OVERVIEW.md` for architecture and `UI_GUIDE.md` for screen
descriptions. See `MOBILE_PROGRESS.md` for task status — **read it before
every run and update it after every run.**

## Critical Rules

1. **RTL layout** — use Tailwind logical properties (`ps-`, `pe-`, `ms-`,
   `me-`, `start-`, `end-`) instead of `pl-`/`pr-`/`left-`/`right-` wherever
   possible. The app already has `dir="rtl"`.
2. **Mobile-first approach** — base Tailwind classes = mobile. Use `md:` for
   tablet and `lg:` for desktop overrides.
3. **Do NOT break desktop** — every change must preserve the existing desktop
   layout. Always scope mobile changes behind responsive breakpoints.
4. **Do NOT touch Supabase, hooks, or business logic** — only modify
   components, layouts, and styles.
5. **Tailwind only** — no inline styles, no CSS modules, no new CSS files
   unless absolutely necessary.
6. **Arabic labels** — all user-facing text must be in Arabic. Copy exact
   strings from existing code when possible.
7. **Icons** — use the same icon library already in use in the project.
   Check existing imports in `Sidebar.tsx` and other components.
8. **One task per run** — pick the next incomplete task from
   `MOBILE_PROGRESS.md`, complete it fully, then update the progress doc.
   Do not skip ahead.
9. **Test by reading code** — you cannot see the browser. Verify your work
   by checking that Tailwind classes are correct, responsive prefixes are
   used properly, and the DOM structure makes sense. Run `npm run build`
   (or the project's build command) to confirm there are no compile errors.
10. **Preserve all existing functionality** — no features should be removed.
    Things can be rearranged or hidden behind menus on mobile, but every
    action must still be reachable.

## Role Definitions

The app has these user roles. Navigation differs per role:

### Team Member (عضو فريق) — includes admin and manager variants
Sidebar items: لوحة التحكم، الأيتام، الكفلاء، الموارد البشرية، المراسلات،
النظام المالي، سياسات فيء

### Sponsor (كافل)
Sidebar items: لوحة التحكم، الأيتام، المراسلات، الدفعات، سياسات فيء

## Task Execution Flow

1. Read `MOBILE_PROGRESS.md` fully
2. Find the first task with status `[ ]` (not started)
3. Read all files relevant to that task
4. Implement the changes
5. Run the build command to verify no errors
6. Update `MOBILE_PROGRESS.md`:
   - Change status to `[x]`
   - Add a brief summary of what was changed under "Completion Notes"
   - Add any issues or concerns under "Known Issues"
   - If a task was partially done, mark it `[~]` and explain what remains
7. Commit with message: `mobile: <task title>`

## Architecture Notes for Mobile

### Bottom Navigation Bar (Task 1)
- Create `components/MobileBottomNav.tsx`
- Render inside the app shell (likely in `App.tsx` where `Sidebar` is used)
- Show only below `md` breakpoint (`md:hidden`)
- Maximum 5 tabs. If a role has more than 5 nav items, the 5th tab is
  "المزيد" (more) which opens a bottom sheet or modal listing remaining items
- Must be role-aware — use the same permission/role logic as `Sidebar.tsx`
- Fixed to bottom of viewport, above any page content
- Add `pb-16` (or appropriate height) to the main content area on mobile
  so content isn't hidden behind the nav bar
- The hamburger menu in the Header should be removed on mobile once the
  bottom nav is in place. The sidebar drawer should no longer open on mobile.
- Active tab should be visually indicated (filled icon or primary color)
- Badge counts (messages, financial) should appear on relevant tabs

### Bottom Tab Allocation

**Team Member tabs:**
1. لوحة التحكم (Dashboard) — home icon
2. الأيتام (Orphans) — people/orphan icon
3. المراسلات (Messages) — chat icon + badge
4. النظام المالي (Financial) — finance icon + badge
5. المزيد (More) — dots/menu icon → opens: الكفلاء، الموارد البشرية،
   سياسات فيء، تسجيل الخروج

**Sponsor tabs:**
1. لوحة التحكم (Dashboard) — home icon
2. الأيتام (Orphans) — people/orphan icon
3. الدفعات (Payments) — payment icon
4. المراسلات (Messages) — chat icon + badge
5. سياسات فيء (Policies) — shield icon

(Sponsors have exactly 5, so no "More" needed. Logout goes in header avatar
dropdown which already exists.)

### Page-by-Page Mobile Optimization
For each page, the typical changes needed are:
- **Multi-column → single column**: any `grid-cols-2`, `grid-cols-3`,
  `flex-row` layouts should stack on mobile
- **Tables → card lists**: `DataTable` usage should either horizontally
  scroll or switch to a card layout on mobile
- **Oversized icons**: reduce icon sizes from desktop values. Typical mobile
  icon size: 18-20px in content, 24px in navigation
- **Touch targets**: minimum 44px tap targets for all interactive elements
- **Modals**: should be full-screen or near-full-screen on mobile
  (add `w-full h-full md:w-auto md:h-auto` type patterns)
- **Two-pane layouts** (e.g., Messages): single pane with navigation between
  list and detail views
- **Font sizes**: headings that are `text-3xl`/`text-4xl` on desktop should
  be `text-xl`/`text-2xl` on mobile
- **Padding/margins**: reduce generous desktop spacing on mobile
  (e.g., `p-4 md:p-8`)
- **Action buttons**: consider collapsing multiple action buttons into a
  floating action button or a toolbar on mobile
- **Horizontal scrolling**: for elements like tab lists that don't fit,
  use `overflow-x-auto` with `flex-nowrap`