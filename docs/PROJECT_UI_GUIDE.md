# UI guide (frontend perspective)

This document describes what users **see and interact with** in the Yetim web app: global chrome, navigation, and each main screen. Copy and labels are largely **Arabic**; layout follows **RTL** conventions.

For architecture and routes, see [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).

---

## Global layout

**Signed-in shell**

- **Sidebar (right in RTL)** — Vertical navigation with icons and Arabic labels. Items can show small **badge counts** (messages / financial) when applicable. The bar can be **collapsed** to icon-only, **resized** by dragging (desktop), and is **off-canvas** on small screens until opened from the header.
- **Header (top)** — Full-width **primary-colored** bar: **hamburger** on mobile, **user name** and **role** (“عضو فريق” or “كافل”) on desktop, **notifications** bell (with a numeric badge), **theme / appearance** control, **avatar** with a dropdown for **sign out** (and related actions).
- **Main area** — Light page background; content sits in padded region below the header.

**Who sees which nav items**

The sidebar **hides** some destinations by role (users never see a dead link):

- **Sponsors** do not see: الكفلاء، الموارد البشرية، النظام المالي.
- **Team members** do not see: **الدفعات** is not a sidebar item for them; the **`/payments`** route is sponsor-only and redirects team users to the dashboard if visited directly.

**Sign-in (`/signin`)**

- Full-screen **soft gradient** background.
- Centered **branding** (heart icon, “منصة يتيم”, subtitle “نظام إدارة رعاية الأيتام”).
- **White card** with email and password fields (email field LTR), error alert if login fails, primary **تسجيل الدخول** button with loading state.

---

## لوحة التحكم — Dashboard (`/`)

The dashboard **changes by role**.

### Team members

1. **Hero strip** — Time-based greeting (“صباح الخير” / “مساء الخير”), welcome title with the user’s name, subtitle about the main dashboard. **Quick actions**: links to **عرض الأيتام** and **الرسائل**.
2. **Four stat tiles** — Counts for: أيتام، كفلاء، دفعات مستحقة، دفعات متأخرة (with loading skeletons while data loads; overdue count emphasized in red when non-zero).
3. **نظرة سريعة على المؤشرات** — Section title and **week / month / year** toggle. Three **large stat cards** (إجمالي الأيتام، إجمالي الكفلاء، التبرعات (تجريبي) with a fixed demo value). Beside them: **رؤى ذكية** card (gradient) with AI-generated Arabic text and **تحديث التحليل**; **آخر الأنشطة** list (sample activity lines with colored dots).
4. **Three widgets in a row** — **المناسبات القادمة** (upcoming occasions with type chips, optional links to orphan profiles, “عرض الكل” opens a modal), **الموافقات المالية المعلقة** (count + total amount + link to النظام المالي), **أحدث الإنجازات** (links to orphan profiles).
5. **الأيتام** — Grid of up to four **avatar cards** (name, age) linking to profiles; **عرض الكل** if there are more.
6. **الكفلاء** — Rows/cards showing initial, name, and “يكفل N يتيم”; link to sponsor profile; **عرض الكل** when many.
7. **فريق العمل** — Similar cards with avatars; current user sorted first; **عرض الكل** redirects to human resources.

### Sponsors (كفلاء)

If the logged-in sponsor record is missing, a simple **red error message** appears.

Otherwise:

1. **Hero** — Greeting, name, subtitle about sponsored orphans. Actions: **الدفعات**, **الرسائل**, **تصدير** (PDF snapshot of the page).
2. **Three metrics** — عدد الأيتام المكفولين، دفعات مستحقة، دفعات متأخرة.
3. **الأيتام المكفولين** — Grid of avatar cards (up to four) → orphan profiles.
4. **فريق المتابعة** — Assigned team members as clickable rows; separate **مدير المنظمة** card when available.
5. **السجل المالي الذكي** — Large card: totals (تبرعات، متأخر، مستحق), per-orphan payment status rows, recent donations list; primary button **عرض جميع الدفعات** → `/payments`.
6. **Two promo-style cards** — **تواصل معنا** (hours + call button) and link tile to **سياسات يتيم**.
7. **Mobile bottom bar** — رجوع، scroll to orphans، رسالة، تصدير.

---

## الأيتام — Orphans list (`/orphans`)

- **Page header** with title and actions such as **إضافة يتيم**, **تصدير** (spreadsheet download), **تبديل العرض** between **شبكة** and **جدول**.
- **Search** field and **فرز وتصفية** popover: sort by name / age / performance; filter by performance level (ممتاز، جيد جداً، جيد، الكل).
- **Grid mode** — Cards (`EntityCard`-style) with avatar, key fields, and row actions.
- **List mode** — `DataTable` with selectable rows, columns for اليتيم (avatar + name + age), الموقع, المرحلة الدراسية, الأداء (colored pill), الحضور. Bulk action **مراسلة المحدد** opens a compose modal (currently simulated).
- **Pagination** at the bottom (fixed page size).
- **إضافة يتيم جديد** modal — Name, age, grade, country.

---

## ملف اليتيم — Orphan profile (`/orphan/:id`)

- **Rich profile header** — Large avatar (with upload where allowed), name, badges, edit controls for permitted users.
- **Horizontal tabs**:
  - **نظرة عامة** — Personal and family fields (many **editable** in edit mode: تاريخ الميلاد، الجنس، الدولة، المحافظة، القائم بالرعاية، العائلة، السكن، …).
  - **التعليم** — School-related fields.
  - **الجدول الزمني** — Calendar / events; modals to add or adjust occasions.
  - **المعرض** — **معرض الصور والإنجازات** and **قائمة الإنجازات**; modals to add achievements (optional media).
  - **المالية** — Payment history table and status visualization.
- Additional UI may include **AI-assisted narrative** blocks, charts (e.g. Recharts line chart), **PDF export**, and **تحديثات/ملاحظات** with add-note modal.
- **Back navigation** via browser or in-page controls as provided.

---

## الكفلاء — Sponsors list (`/sponsors`)

*Team members only (sidebar hidden for sponsors).*

- Similar **toolbar** to orphans: search, sort popover, **grid / table** toggle, **إضافة كافل جديد**, and row actions.
- **Add sponsor** modal — Name field.
- **Edit sponsor** modal from row actions.
- **Send message** modal in some flows.
- Cards or table rows link to **`/sponsor/:id`**.

---

## ملف الكافل — Sponsor page (`/sponsor/:id`)

- **Profile strip** — Avatar upload (where permitted), name, metadata, actions (e.g. messaging modals for staff).
- **السجل المالي الذكي** — Same conceptual blocks as on the sponsor dashboard: donation total, overdue/due summaries, linked orphans’ payment status, recent transactions (uses demo/static transaction data in parts of the UI).
- Links back to lists or related orphans as appropriate.

---

## تتبع الدفعات — Sponsor payments (`/payments`)

*Sponsors only; others are redirected to the dashboard.*

- Title **تتبع الدفعات** and subtitle; link back to **لوحة التحكم**.
- **Summary stat cards** — Paid totals, outstanding, processing, counts.
- **Filters** — Search by orphan name, **status** filter (all / paid / due / overdue / …), **sort** (name, due date, amount), **year** selector affecting which payments are shown (demo payments may be synthesized when a year has no data).
- **Expandable sections per orphan** — Avatar, name, link **عرض الملف الشخصي**, aggregate payment counts and amounts; expanded area shows **تقويم الدفعات** and line items with **PaymentStatusBadge**.

---

## الموارد البشرية — Human resources (`/human-resources`)

*Team members only.*

- Title **الموارد البشرية** and short description.
- **Horizontal pill tabs** (scrollable on small screens):  
  إدارة فريق العمل، سجل المتطوعين، المندوبين، الإجازات، الحضور والانصراف، اللوائح والسياسات، العطلات الرسمية، الحوافز والجوائز، التعميمات الإدارية، الجزاءات التأديبية، السلف، الرواتب.
- **Content**
  - **إدارة فريق العمل** — Embedded **TeamList** (permissions, member management UI).
  - **سجل المتطوعين** — Full **volunteers** table with ratings, progress bars, classification pills, add/edit modal.
  - **المندوبين** — Delegates management UI with modals.
  - **Other tabs** — Placeholder panel: section title + “محتوى هذا القسم سيتم إضافته قريباً.”

---

## المراسلات — Messages (`/messages`)

- **Two-pane card** (full height within the main area):
  - **Right pane (conversation list)** — Search **بحث في الرسائل...**, **+** to **بدء محادثة جديدة** (modal listing organization users with avatar + role). Each row: avatar, name, unread badge, last message preview, time.
  - **Left pane (thread)** — On desktop, empty state **حدد محادثة** with icon until a row is selected. On mobile, list hides when a thread is open; **back** returns to list.
- **Active thread** — Header with participant avatar, name, role (كافل / عضو فريق). **Message bubbles**: outgoing (primary background), incoming (white card). Composer: textarea, **قوالب الرسائل** (opens modal to pick/edit/delete templates), **إرسال**.
- **قوالب الرسائل** modal — List of templates with edit/delete; add new template form.

---

## النظام المالي — Financial system (`/financial-system`)

*Team members only.*

- **Summary KPIs** — Stat cards (e.g. balances, counts) at the top.
- **Charts** — **توجهات الإيرادات والمصروفات** (bar chart), **مصادر الإيرادات** (pie chart) in card containers.
- **Transaction workflow** — Filters and a **large table** of movements with status pills; actions to **approve / reject** open prominent modals (green approval header, detailed receipt and orphan breakdown when present). **عرض المزيد** reveals pagination.
- **Modals** — **إضافة حركة مالية جديدة**, **إضافة كافل جديد**, **إيصال تبرع** view with print/PDF, etc.
- **دفعات الأيتام** — Section with **expandable orphan rows** (avatar, stats, link to profile); inside, **year selector** and **12-month payment calendar** visualization.

---

## سياسات يتيم — Policies (`/policies`)

- **Distinct reading layout** (`PoliciesLayout`): `dir="rtl"`, light gray background.
- **Thin progress bar** fixed at the very top of the viewport (reading progress while scrolling).
- **Policies header** — Title area and actions such as **print** (triggers browser print; sidebar hidden in print CSS).
- **Main column** — Long-form **PoliciesContent**: sections with anchors, typography components (callouts, tables, steppers, grids — see `components/policies/`).
- **Sidebar TOC** — Sticky on large screens; tracks **active section** while scrolling; clicking scrolls smoothly to headings.
- **Footer** — Policies footer block.

The main app **sidebar still appears** unless the user navigates in a way that hides it — the policies content is the focus inside the usual shell.

---

## عضو الفريق — Team member page (`/team/:id`)

- **Profile header** — Avatar (upload), name, role, navigation back.
- **Two-column style layout** (on wide screens):
  - **Left column** — **المهام المستحقة** checklist; **مهام واقتراحات ذكية** with **إنشاء اقتراحات** (AI) and “add to tasks” buttons; **الأيتام قيد المتابعة** list with **تعيين أيتام** when allowed; **الكفلاء المعينون** with **تعيين كفلاء** when allowed.
  - **Right column** — **Month calendar** (Arabic weekday initials); dots on days with tasks; selecting a day shows **مهام يوم …** list below.
- **Modals** — Assign orphans/sponsors, add task for a day.
- **Mobile action bar** — رجوع، إضافة مهمة، اقتراحات، scroll to orphans، رسالة.

---

## Theme and appearance

From the header, users can open **تخصيص المظهر** (`ThemeSettings`): controls that adjust colors / theme preferences consistent with `ThemeContext` (exact options are defined in that component).

---

## Empty, loading, and error states

Across screens, users routinely see:

- **Spinners** or skeleton blocks while data loads.
- **Gray placeholder text** when lists are empty (لا توجد محادثات، لا يوجد أيتام معينون، …).
- **Inline red messages** when a record is missing or an operation fails.

This matches the implemented components rather than an idealized design spec.
