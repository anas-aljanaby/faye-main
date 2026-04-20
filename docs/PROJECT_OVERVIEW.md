# Project overview: يتيم (Yetim)

## Purpose

**Yetim** is a web application for managing orphan care operations for an association (جمعية يتيم). It centralizes records for orphans and sponsors, internal team and permissions, messaging, financial transactions, and published internal policies. The UI is primarily **Arabic (RTL)** and is built as a **single-page application** backed by **Supabase** (database, auth, storage) with optional **Google Gemini** integration for AI-assisted reporting on the dashboard.

## Who uses it

- **Team members** (`team_member`): full access to operational areas that the app restricts to staff (sponsors directory, human resources, financial system).
- **Sponsors** (`sponsor`): signed-in users with a more limited experience; routes wrapped in `TeamMemberRoute` redirect them to the dashboard.

Authentication and profile data come from Supabase; fine-grained capabilities (orphans, sponsors, transactions, expenses, financial visibility, manager flag) are modeled in `user_permissions` and exposed via `usePermissions` / `AuthContext`.

## Application shell

After sign-in, the layout is:

- **Sidebar** — primary navigation, collapsible width, badge counts for messages and financial items where configured.
- **Header** — top bar; opens the sidebar on small screens.
- **Main content** — routed views inside a scrollable region.

Routing uses **React Router** with **`HashRouter`**, which suits static hosting (for example Vercel) without server-side URL rewriting for client routes.

## Panels and routes

These are the main **navigation panels** (sidebar labels are Arabic as in the product):

| Panel (English) | Path | Primary component | Notes |
|------------------|------|-------------------|--------|
| Dashboard | `/` | `Dashboard` | Summary metrics, activity-style feed, occasions, PDF export hooks, Gemini usage for reports. |
| Orphans | `/orphans` | `OrphansList` | List of orphans; detail at `/orphan/:id` → `OrphanProfile`. |
| Sponsors | `/sponsors` | `SponsorsList` | **Team members only** (`TeamMemberRoute`). Detail at `/sponsor/:id` → `SponsorPage`. |
| Human resources | `/human-resources` | `HumanResources` | **Team members only.** Legacy path `/team` redirects here. Member detail: `/team/:id` → `TeamMemberPage`. |
| Messages | `/messages` | `Messages` | Internal messaging / conversations. |
| Financial system | `/financial-system` | `FinancialSystem` | **Team members only**; transactions and related workflows. |
| Yetim policies | `/policies` | `PoliciesPage` | Static policy content with its own sub-layout (`components/policies/*`). |

Additional routes without sidebar entries:

- **`/payments`** — `SponsorPaymentsPage` (sponsor payment flows).
- **`/signin`** — `SignIn` (unauthenticated).

Unknown paths under the authenticated area fall through to the dashboard (`Navigate` to `/`).

## Tech stack (high level)

- **React 19**, **TypeScript**, **Vite**
- **Tailwind CSS** for styling
- **TanStack Query** with persisted client cache (`index.tsx`)
- **Supabase** client in `lib/`
- **Charts**: Chart.js / react-chartjs-2, Recharts
- **PDF / capture**: jsPDF, html2canvas
- **AI**: `@google/genai` (Gemini), configured for build-time define where applicable

## General file outline

```
yetim-main/
├── App.tsx                 # Routes, layout shell, auth/policy providers
├── index.tsx               # React mount, React Query persistence, ThemeProvider
├── index.css               # Global styles (Tailwind entry)
├── types.ts                # Shared TypeScript types
├── data.ts                 # Legacy/static or seed-style data used in some views
├── vite.config.ts          # Vite + env (e.g. Gemini key handling)
├── vercel.json             # SPA hosting redirects
├── package.json
│
├── components/             # Feature UI (pages and shared UI)
│   ├── policies/           # Policy site section (layout, nav context, content blocks)
│   ├── Dashboard.tsx
│   ├── OrphansList.tsx, OrphanProfile.tsx
│   ├── SponsorsList.tsx, SponsorPage.tsx, SponsorPaymentsPage.tsx
│   ├── HumanResources.tsx, TeamList.tsx, TeamMemberPage.tsx
│   ├── FinancialSystem.tsx
│   ├── Messages.tsx
│   ├── SignIn.tsx
│   ├── Sidebar.tsx, Header.tsx
│   ├── ProtectedRoute.tsx, TeamMemberRoute.tsx
│   ├── DataTable.tsx, EntityCard.tsx, Avatar*.tsx, …
│   └── …
│
├── contexts/               # AuthContext, ThemeContext
├── hooks/                  # Data hooks (orphans, sponsors, team, messages, finances, occasions, permissions, …)
├── lib/                    # Supabase client and auth helpers
├── utils/                  # Messaging, avatars, id mapping, etc.
├── scripts/                # Node/tsx tooling (import SQL generation, data import, transliteration)
│
├── supabase/
│   └── migrations/         # SQL schema, seeds, imports (e.g. initial schema, admin user, data import)
│
├── DEPLOYMENT.md           # Deployment notes
├── README.md               # Run, build, Vercel, high-level structure
├── README_AVATARS.md       # Avatar storage guidance
└── PROJECT_OVERVIEW.md     # This document
```

## Related documentation

- **`README.md`** — local setup, environment variables, Vercel deployment.
- **`DEPLOYMENT.md`** — deployment procedures for this project.
- **`supabase/migrations/`** — source of truth for database tables, RLS, and seed/import scripts.
