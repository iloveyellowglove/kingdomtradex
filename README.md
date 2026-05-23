# KingdomTrade Exchange

**Professional cryptocurrency exchange platform.**

All balances, trades, and profits are processed in real time via Supabase PostgreSQL.

Last updated: 2026-05-23

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Auth**: `@supabase/ssr` cookie-based sessions (custom `sessions` table)
- **Database**: `@supabase/supabase-js` (Supabase PostgreSQL)
- **Styling**: Tailwind CSS
- **Email**: Resend
- **Cron**: Vercel Cron Jobs
- **Payments**: Plisio API

## Quick Setup

### 1. Database

Run the Supabase migration SQL in your Supabase SQL Editor:

```bash
# Copy contents of sql/supabase_migration.sql into Supabase SQL Editor
```

Default admin: `admin@kingdomtradex.com` / `admin123` (CHANGE IMMEDIATELY in production).

### 2. Environment Variables

Copy `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLISIO_API_KEY=your-plisio-key
PLISIO_CRON_SECRET=your-cron-secret
RESEND_API_KEY=your-resend-key
APP_URL=https://your-domain.vercel.app
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=your-model
CRON_SECRET=your-cron-secret
```

### 3. Development

```bash
npm install
npm run dev
```

### 4. Production Build

```bash
npm run build
npm start
```

## Vercel Deployment

Push to `main` — Vercel auto-deploys with the configuration in `vercel.json`.

Cron jobs:
- Daily profit: `0 1 * * *` → `/api/cron/daily-profit`
- Process withdrawals: `0 */6 * * *` → `/api/cron/process-withdrawals`

### Disabling Vercel Authentication

If your deployed site shows a login screen:
1. Vercel project dashboard → **Settings** → **Deployment Protection**
2. Set **Vercel Authentication** to **Disabled** or **Unprotected Previews**

## Project Structure

```
Exchange/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Navbar, Footer, OracleChat)
│   │   ├── page.tsx                # Landing page
│   │   ├── (auth)/                 # Login, register, forgot/reset password
│   │   ├── (app)/                  # Protected: dashboard, trading, withdrawals, referral tree
│   │   ├── (public)/               # About, covenant
│   │   ├── (admin)/                # Admin: users, deposits, withdrawals, commissions, settings
│   │   └── api/                    # API route handlers
│   ├── lib/
│   │   ├── auth/                   # Session, CSRF, password hashing
│   │   ├── db/                     # Database query functions
│   │   ├── services/               # Plisio, Oracle, Email
│   │   ├── types/                  # TypeScript interfaces
│   │   └── utils/                  # Referral codes, formatting
│   └── components/
│       ├── layout/                 # Navbar, Footer
│       ├── auth/                   # Login, register, password reset forms
│       ├── dashboard/              # Dashboard content
│       ├── trading/                # AI trading panel
│       ├── referral/               # Referral tree view
│       ├── admin/                  # Admin sidebar
│       └── chatbot/                # Oracle AI chat widget
├── middleware.ts                   # Route protection + CSRF validation
├── tailwind.config.ts
├── vercel.json
└── package.json
```

## Features

| Feature | Description |
|---------|-------------|
| User System | Registration with bcrypt passwords, roles (admin/pastor/member) |
| Referrals | Unique 8-char codes, 5-level MLM commission tracking |
| Deposits | Plisio crypto payment integration with webhook confirmation |
| Withdrawals | 72-hour security hold, net deposit validation, Plisio mass payout |
| AI Trading | 1.5% daily profit applied to all active user balances |
| Admin Panel | User management, deposit confirmation, withdrawal override, settings |
| Security | CSRF tokens, Supabase RLS, bcryptjs hashing, session auth |
| Oracle Chat | OpenRouter AI chatbot (Ephod Oracle) |

## Disclaimer

KingdomTrade Exchange is a professional trading platform. All financial data displayed is processed in real time.
