# Deployment

Next.js 14 migration deployed 2026-05-23.

## Vercel

Framework: Next.js
Build Command: next build
Output Directory: .next

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `CRON_SECRET` | Shared secret for Vercel cron job auth |
| `OPENROUTER_API_KEY` | OpenRouter API key for Ephod Oracle chatbot |
| `OPENROUTER_MODEL` | Model name for Oracle (default: openai/gpt-4o-mini) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app |
| `NOWPAYMENTS_API_KEY` | NOWPayments API key for crypto deposit processing |
| `NOWPAYMENTS_IPN_SECRET` | NOWPayments IPN secret for webhook signature verification |
| `PLISIO_API_KEY` | Plisio API key (fallback payment gateway) |

## One-Time Setup

### 1. Run Database Migration

Execute `sql/supabase_migration.sql` in the Supabase SQL Editor.

### 2. Create Admin User

```bash
ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="your-secure-password" npx ts-node scripts/create-admin.ts
```

The script generates a random bcrypt hash at runtime. Never commit real credentials.

### 3. Configure Vercel Cron Jobs

Ensure `vercel.json` cron paths match the deployed routes:

- `/api/cron/daily-profit` -- runs daily at 00:01 UTC
- `/api/cron/process-withdrawals` -- runs daily at 02:00 UTC

The `CRON_SECRET` environment variable must be set in Vercel and match the value used by the cron routes.

### 4. Atomic Balance Functions

Run `sql/atomic_balance_functions.sql` in the Supabase SQL Editor to install the PostgreSQL functions for safe atomic balance operations. These replace all read-modify-write patterns in application code.

### 5. Commissions Unique Constraint

Run `sql/commissions_unique_constraint.sql` in the Supabase SQL Editor to add idempotency protection on referral commissions.

### 6. Manual Trading Setup

Run the SQL migration to add dummy balance columns and the manual_trades table:

Execute `sql/manual_trading.sql` in the Supabase SQL Editor.

Then run the one-time migration to initialize dummy balances for existing users:

```bash
npm run migrate:dummy
```

This sets `dummy_balance = 10000` and `dummy_initialized_at = NOW()` for all users where it is NULL.

### 7. NOWPayments Integration

Run `sql/nowpayments_integration.sql` in the Supabase SQL Editor to add `payment_provider` and `provider_payment_id` columns to the deposits table.

Set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` in Vercel environment variables. The IPN webhook URL is `https://yourdomain.com/api/webhooks/nowpayments`.

## Demo Data (Development Only)

`sql/seed_demo_data.sql` contains sample data for local development. **Do not run in production.** All demo users share a single password hash.
