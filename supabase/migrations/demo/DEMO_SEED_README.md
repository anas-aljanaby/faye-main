# Demo Seed Scripts

This folder contains SQL scripts that create a **complete demo organization** with realistic, well-distributed data for testing every major module of the Yetim app. The data timeline runs from **2026-01-01** through **2026-03-31**.

## Prerequisites

- **Initial schema** applied: `supabase/migrations/001_initial_schema.sql`
- Scripts are runnable on a **fresh DB** (no demo data) or after running the cleanup script

## Execution Order

| Order | Script | Purpose |
|-------|--------|---------|
| 0 | `006_demo_cleanup.sql` | (Optional) Remove existing demo org data before re-seeding |
| 1 | `007_demo_org_and_users.sql` | Organization, user profiles, permissions, auth accounts |
| 2 | `008_demo_orphans_and_relationships.sql` | Orphans, sponsor–orphan, team–orphan, sponsor–team links |
| 3 | `009_demo_orphan_data.sql` | Payments, achievements, occasions, gifts, logs, family, programs |
| 4 | `010_demo_financials.sql` | Financial transactions, receipts, sponsor notes |
| 5 | `011_demo_hr_and_messaging.sql` | Tasks, delegates, conversations, messages |

**Full reseed:** Run `006_demo_cleanup.sql` then `007` → `008` → `009` → `010` → `011`.  
**Fresh DB:** Run only `007` through `011`.

## Login Credentials

All demo passwords: **`admin`**

| Role | Login (email or username) |
|------|---------------------------|
| **Super admin** (system admin, invisible in team/sponsor lists) | `admin@yetim-demo.com` or `admin` |
| Team (manager) | `member.khaled@yetim.com` or `member.khaled` |
| Team (staff) | `member.noora@yetim.com` or `member.noora` |
| Sponsor | `sponsor.abdullah@yetim.com` or `sponsor.abdullah` |
| Sponsor | `sponsor.fatma@yetim.com` or `sponsor.fatma` |
| Sponsor | `sponsor.mohammad@yetim.com` or `sponsor.mohammad` |
| Sponsor | `sponsor.muna@yetim.com` or `sponsor.muna` |
| Sponsor | `sponsor.saad@yetim.com` or `sponsor.saad` |

---

## Datasets Created and Component Mapping

### 1. Organization and users (007)

- **1 organization:** منصة يتيم - Demo  
- **1 super admin:** مدير النظام (`is_system_admin = TRUE`) – invisible in team/sponsor lists; full permissions; login `admin` / `admin@yetim-demo.com`.  
- **2 team members:** خالد الغامدي (manager, full permissions), نورة السعد (staff, limited: no approve/create expense)  
- **5 sponsors:** عبدالله الراجحي, فاطمة الأحمد (Jan); محمد الشمري, منى العتيبي (Feb); سعد الدوسري (Mar)  
- **User permissions:** Super admin + manager + staff permission sets  
- **Custom auth:** All 8 users can log in with password `admin`  

**Site components:** Sign-in, Sidebar (role-based nav), Dashboard, Human Resources (team list), Sponsors list, permission-gated access to Financial System / Orphans / Sponsors.

---

### 2. Orphans and relationships (008)

- **20 orphans:** 12 joined Jan 2026, 5 Feb, 3 Mar (أحمد، سارة، يوسف، ليلى، رامي، مريم، كريم، دانة، فادي، لمى، ريم، وائل، عمر، هيا، تالا، ناصر، جنى، نور، ياسر، لمياء).  
- **Sponsor–orphan:** Every orphan has at least one sponsor; sponsors have 2–5 orphans each.  
- **Team–orphan assignments:** Khaled and Noora each have assigned orphans for tasks.  
- **Sponsor–team member:** Each sponsor linked to a primary contact (Khaled or Noora).  

**Site components:** Orphans list, Orphan profile, Sponsor profile (sponsored orphans), Dashboard (my orphans / assignments), Payments page (per-orphan).

---

### 3. Orphan-related data (009)

- **Payments (2026-01–03):**  
  - Most paid in Jan/Feb; March has a mix: مدفوع, مستحق, متأخر, قيد المعالجة.  
  - **Edge cases:** سارة (فاطمة) has متأخر for Feb; نور (سعد) has only March مستحق with no paid date (“sponsor who has paid nothing”).  
- **Achievements:** Several orphans with titles/descriptions and dates in 2026.  
- **Special occasions:**  
  - **orphan_specific:** Birthdays for أحمد، سارة، يوسف.  
  - **organization_wide:** يوم اليتيم العالمي.  
  - **multi_orphan:** رحلة ترفيهية جماعية with multiple orphans via `occasion_orphans`.  
- **Gifts, update logs, family members, program participations** (educational, psychological_child, psychological_guardian with mixed statuses).  

**Site components:** Orphan profile (payments, achievements, occasions, gifts, family, programs, update log), Dashboard (upcoming occasions, payment status), Occasions management.

---

### 4. Financials (010)

- **Income (إيرادات):** Multiple completed entries (كفالة يتيم, تبرع عام); one قيد المراجعة (March).  
- **Expenses (مصروفات):** مكتملة, قيد المراجعة, مرفوضة; some linked to orphans.  
- **Receipts and receipt_orphans:** Income tied to sponsors and split by orphan where applicable.  
- **Sponsor notes:** Private notes from sponsors on their sponsored orphans.  

**Site components:** Financial System (transaction list, filters, type/status, approval workflow), Sponsor receipts, Sponsor profile (notes on orphans).

---

### 5. HR and messaging (011)

- **Tasks:** Mix of completed and pending; some tied to orphans, one general.  
- **Delegates:** 3 delegates (مندوبين) with name, task, emails, phones.  
- **Conversations and messages:** 2–3 threads between team members and sponsors with sample messages and read/unread.  

**Site components:** Human Resources (Tasks, Delegates), Messages (inbox, conversations, chat).

---

## Timeline Summary

| Area | Jan 2026 | Feb 2026 | Mar 2026 |
|------|----------|----------|----------|
| Orphans joining | 12 | 5 | 3 |
| Sponsors joining | 2 | 2 | 1 |
| Payments | Mostly paid | Mostly paid; one late (سارة) | Mix: paid, مستحق, قيد المعالجة; نور مستحق only |
| Financial tx | Income + expense (completed) | Income + expense (completed + rejected) | Income (pending) + expenses (completed + pending) |

---

## Edge Cases Covered

- **Sponsor who has paid nothing:** سعد sponsors نور; نور has only March payment as مستحق (no paid_date).  
- **Late sponsor:** فاطمة sponsors سارة; سارة has February payment as متأخر.  
- **Financial transactions:** All statuses (مكتملة, قيد المراجعة, مرفوضة) and both types (إيرادات, مصروفات).  
- **Occasions:** All three types (orphan_specific, organization_wide, multi_orphan) with correct links.

---

## Referential Integrity

Scripts respect foreign keys and insert in dependency order. Cleanup (`006`) deletes in reverse dependency order so it is safe to run before a full reseed.
