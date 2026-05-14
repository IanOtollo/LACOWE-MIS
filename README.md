# LACOWE Welfare MIS

> **Labour, Commerce & Works Employees Welfare Group — Management Information System**
> A full-stack, production-grade welfare fund management platform built with Next.js 14 and Supabase.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [Loan Workflow](#loan-workflow)
- [Member Password Format](#member-password-format)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Overview

LACOWE Welfare MIS is a secure, role-based management system for a welfare group operating within a government institution. It handles the full lifecycle of welfare activities including:

- Member registration and profile management
- Savings and shares account management
- Loan applications, approvals, and repayments
- Guarantor workflows with real-time notifications
- Admin financial controls and audit logging
- Member deposits and withdrawals

---

## Features

### 🏛️ Admin Portal
| Feature | Description |
|---|---|
| **Dashboard** | Real-time stats — active members, loans, pending applications, welfare fund balance |
| **Member Management** | Register new members with auto-generated credentials and accounts |
| **Loan Review** | Approve or reject loan applications with notifications sent to members |
| **Loan Disbursement** | Disburse approved loans directly to member savings accounts |
| **Seed Loan Products** | One-click seeding of default loan products (Emergency, Development, Education) |
| **Transaction Ledger** | Full transaction history with member and processor details |
| **Audit Logs** | Every sensitive action is logged with user, timestamp, and data snapshot |

### 👤 Member Portal
| Feature | Description |
|---|---|
| **Dashboard** | Personal greeting, account balances, active loan summary, recent transactions |
| **Deposit / Withdraw** | Move funds in and out of savings and shares accounts |
| **Loan Application** | Apply for loans by selecting a product, guarantors, and providing purpose details |
| **Loan Repayment** | Make repayments against active loans — auto-debits savings account |
| **Guarantor Requests** | Accept or decline requests from other members to act as guarantor |
| **Notifications** | Real-time in-app alerts for loan updates, guarantor requests, and system messages |
| **Profile** | View and update personal details |

### 🔐 Security
- Row Level Security (RLS) enforced at the database level via Supabase
- Role-based access control: `admin`, `member`, `committee`
- Forced password change on first login
- Service role used exclusively for admin-privileged server actions
- All financial actions go through server-side Next.js Server Actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Vanilla CSS |
| **Backend** | Next.js Server Actions |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Forms** | React Hook Form + Zod |
| **UI Components** | Custom design system (Card, Button, Badge, Table, Modal) |
| **Icons** | Lucide React |
| **Notifications** | Sonner (toast) |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone https://github.com/IanOtollo/LACOWE-MIS.git
cd LACOWE-MIS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials (see below)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the root of your project with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` on the client side.** It is only used in Server Actions.

For **Vercel deployment**, add these same variables in:  
`Project Settings → Environment Variables`

---

## Default Credentials

### Admin Account
| Field | Value |
|---|---|
| Email | `admin@lacowe.co.ke` |
| Password | `Password123!` |

> 🔒 Change this password immediately after first login in production.

### Member Accounts
When a new member is registered by the admin:

| Field | Format | Example |
|---|---|---|
| Email | `firstname.lastname@lacowe.co.ke` | `esther.kiarie@lacowe.co.ke` |
| Password | `Lacowe@` + member number | `Lacowe@LCW-0003` |

Members are forced to set a new password on their first login.

---

## Loan Workflow

```
Member Applies → Guarantors Notified → Guarantors Accept/Decline
       ↓
Admin Reviews Application
       ↓
Admin Approves / Rejects → Member Notified
       ↓ (if approved)
Admin Disburses Loan → Funds added to Member Savings
       ↓
Member Makes Repayments → Schedule Updated → Loan Closed on Full Repayment
```

### Loan Products (Default)
| Product | Rate | Min | Max | Term |
|---|---|---|---|---|
| Normal Loan | 12% p.a. | KES 5,000 | KES 500,000 | 3–36 months |
| Emergency Loan | 10% p.a. | KES 1,000 | KES 50,000 | 1–6 months |
| Development Loan | 14% p.a. | KES 10,000 | KES 1,000,000 | 6–60 months |
| School Fees Loan | 8% p.a. | KES 5,000 | KES 200,000 | 3–12 months |

> Run **"Seed Default Products"** from the Admin Dashboard to populate these into your database.

---

## Member Password Format

```
Lacowe@{MemberNumber}
```

Examples:
- `Lacowe@LCW-0001`
- `Lacowe@LCW-0042`

This is generated automatically on member registration and sent as an in-app notification to the member.

---

## Database Setup

1. Go to your Supabase project → **SQL Editor**
2. Run the migration file at `supabase/migrations/0001_lacowe_mis_schema.sql`
3. Then run these additional RLS policies to allow member-facing features:

```sql
-- Allow logged-in members to see other members (for guarantor selection)
CREATE POLICY "profiles_all_read" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow logged-in members to read available loan products
CREATE POLICY "loan_products_read_all" ON loan_products
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Add the three environment variables in Vercel Project Settings
4. Deploy

Vercel will auto-deploy on every push to `main`.

> **Tip:** If the build fails due to stale cache, update the build command to:
> ```
> rm -rf .next && next build
> ```

---

## Project Structure

```
lacowe-mis/
├── app/
│   ├── (auth)/login/          # Login page with real-time stats
│   ├── (admin)/admin/         # Admin portal (dashboard, members, loans, accounts)
│   └── (member)/portal/       # Member portal (dashboard, loans, accounts, guarantors)
├── components/
│   ├── admin/                 # Admin sidebar, topbar, layout
│   ├── auth/                  # ForcePasswordChange modal
│   ├── member/                # Member sidebar, RepayModal, TransactModal
│   └── ui/                    # Shared design system (Button, Card, Table, Modal, Badge...)
├── lib/
│   ├── actions/               # Server Actions (loans, members, repayments, guarantors...)
│   ├── supabase/              # Supabase client (browser + server + service role)
│   └── utils/                 # Helpers (currency, dates, loan calculator, references)
├── supabase/
│   └── migrations/            # Full database schema with RLS policies
└── scripts/
    └── seed_admin.ts          # Admin account seeding script
```

---

## License

This project is proprietary software built for **LACOWE Welfare Group**, JKUAT.  
Unauthorized distribution or reproduction is not permitted.

---

*Built with ❤️ for LACOWE Welfare Group.*
