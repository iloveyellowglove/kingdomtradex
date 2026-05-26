# KingdomTradex Pre-Launch Security & Workflow Audit Report

**Date:** 2026-05-25
**Scope:** Full repository audit of 130+ source files
**Methodology:** Static analysis of all TypeScript source, SQL schemas, configuration files, and environment setup

---

## Resolution Status (2026-05-25)

Six pre-launch blocking findings resolved:

| ID | Severity | Status | Commit |
|----|----------|--------|--------|
| S11 | High | **RESOLVED** | `765d0c8` |
| S02 | Critical | **RESOLVED** | `1dfd742` |
| S01 | Critical | **RESOLVED** | `d3a2dda` |
| S03 | Critical | **RESOLVED** | `7874b51` |
| S04 | Critical | **RESOLVED** | `ab3934e` |
| S08 | High | **RESOLVED** | `2d95608` |
| S05 | High | **RESOLVED** | `59eda7f` |
| S06 | High | **RESOLVED** | `1d565ea` |
| S07 | High | **RESOLVED** | `e9e7588` |
| S09 | High | **RESOLVED** | `c5bd31f` |
| S10 | High | **RESOLVED** | `001d40b` |
| S12 | High | **RESOLVED** | `91b7377` |

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 4 → **0 resolved** | ~~Unauthenticated admin endpoint~~, ~~PII/token logging~~, ~~default credentials in SQL~~, ~~no DB transactions on any balance mutation~~ |
| High     | 8 → **0 resolved** | ~~No CSRF enforcement~~, ~~deposit duplicate risk~~, ~~incomplete bonus logic~~, ~~unimplemented referral commissions~~, ~~missing IDOR guard~~, ~~Plisio webhook auth gaps~~, ~~cron path mismatch~~, ~~withdrawal lock bypass~~ |
| Medium   | 12   | No rate limiting, float arithmetic, file upload content sniffing, email delivery issues, no security headers, Supabase filter injection potential, withdrawal lock bypass, minimum deposit not enforced, bonus never credited to spendable balance, cron double-credit risk, password reset token plaintext, session no sliding refresh |
| Low      | 6    | CSRF timing-safe comparison unused, guest CSRF cookie never set, emoji use, hardcoded marketing stats, cron uses different model name than oracle, no input max lengths |
| Info     | 5    | HMAC-SHA1 vs SHA256, DEPLOYMENT.md sparse, vercel.app from address, session expiry 24h hard, RLS policies are permissive |

---

## Findings Table

| ID | Severity | Category | File:Line | Description | Recommendation |
|----|----------|----------|-----------|-------------|----------------|
| S01 | **Critical** ✅ | Authorization | `src/app/api/admin/settings/route.ts:4` | ~~PATCH handler has NO session check~~ | **RESOLVED** (`d3a2dda`): Added validateAdmin, CSRF via timingSafeEqual, ALLOWED_KEYS whitelist, per-key value validation, admin_logs audit trail. |
| S02 | **Critical** ✅ | Logging | `src/app/api/auth/login/route.ts:49,68` | ~~Full session token and PII logged~~ | **RESOLVED** (`1dfd742`): Removed all credential logging. Only structured `console.warn` on failed attempts (IP + timestamp). Middleware verbose logs gated behind NODE_ENV check. |
| S03 | **Critical** ✅ | Secrets | `sql/supabase_migration.sql:181-184`, `sql/database.sql:178-179` | ~~Default admin user with known password~~ | **RESOLVED** (`7874b51`): Removed admin INSERT from migrations. Created `scripts/create-admin.ts` (reads from env vars), `sql/create_admin.sql.example`, `.gitignore` entry. seed_demo_data.sql has DEV ONLY guard. |
| S04 | **Critical** ✅ | Data Integrity | `src/lib/services/plisio-deposit.ts:116-117`, `src/app/api/withdraw/route.ts:53-81`, `src/app/api/cron/daily-profit/route.ts:46-49` | ~~Zero database transactions - all balance mutations used read-modify-write~~ | **RESOLVED** (`ab3934e`): Created 7 PostgreSQL atomic functions in `sql/atomic_balance_functions.sql` and TypeScript helpers in `src/lib/db/atomic.ts`. Replaced all RMW patterns in plisio-deposit, withdraw, daily-profit, deposit-simulate, plisio-withdrawal. |
| S05 | **High** ✅ | CSRF | `src/middleware.ts:84-119` | ~~Middleware CSRF check uses `===` for string comparison, not `timingSafeEqual`. No CSRF for excluded routes. Guest CSRF cookie never set.~~ | **RESOLVED** (`59eda7f`): Replaced `===` with `timingSafeEqual()` for all CSRF comparisons. Generate and set `csrf_guest` cookie for unauthenticated visitors in all 4 middleware paths (public pass-through, missing token, invalid session, expired session). |
| S06 | **High** ✅ | Data Integrity | `sql/supabase_migration.sql:49` | ~~`deposits.txn_id` has NO UNIQUE constraint. Race condition allows duplicate deposits with double balance credits.~~ | **RESOLVED** (`1d565ea`): Added `UNIQUE (txn_id)` constraint via `sql/s06_unique_txn_id.sql` migration. Updated `supabase_migration.sql` for fresh installs. Both `handleCallback` and `handleInvoiceCallback` now INSERT before crediting balance with error/empty-row detection for duplicates. |
| S07 | **High** ✅ | Authorization | `src/app/api/deposit/status/[txnId]/route.ts:27-31` | ~~Deposit status query filters by `txn_id` only with no user_id check. Any authenticated user can enumerate all deposit records.~~ | **RESOLVED** (`e9e7588`): Added `.eq('user_id', userId)` filter scoped to the authenticated session's user. |
| S08 | **High** ✅ | Workflow | `src/lib/db/commissions.ts:38-55` | ~~createCommission() never called~~ | **RESOLVED** (`2d95608`): Implemented `distributeCommissions()` that walks up `referred_by` chain 5 levels, reads percentages from settings, inserts with idempotency (UNIQUE constraint + error code 23505 catch), credits upline atomically via `creditUserBalance`. Wired into Plisio callback and deposit-simulate. |
| S09 | **High** ✅ | Workflow | `src/lib/services/plisio-deposit.ts` | ~~Bonus unlock was non-atomic: credited bonus balance, set bonus_locked=false, and set first_deposit_time in separate DB calls. Crash between calls could credit bonus twice or leave state inconsistent.~~ | **RESOLVED** (`c5bd31f`): Created `process_deposit_atomic` PostgreSQL function that atomically credits deposit, updates total_deposited, unlocks bonus (credit + clear + set unlocked_at), and sets first_deposit_time in a single UPDATE. Both callback handlers use the new atomic function. |
| S10 | **High** ✅ | Authorization | `src/app/api/plisio-webhook/route.ts:6-23` | ~~No IP allowlisting, no rate limiting, HMAC-SHA1 only for webhook verification.~~ | **RESOLVED** (`001d40b`): Added IP allowlisting with configurable `plisio_webhook_ips` setting (defaults to known Plisio IPs). Added in-memory rate limiter (10 req/60s per IP). Added HMAC-SHA256 verification alongside SHA1 in `verifyCallback()`. |
| S11 | **High** ✅ | Deployment | `vercel.json:3-6` | ~~Cron path pointed to non-existent route~~ | **RESOLVED** (`765d0c8`): Changed vercel.json path to `/api/cron/daily-profit`. Both cron routes now match existing route files. |
| S12 | **High** ✅ | Data Integrity | `src/app/api/withdraw/route.ts:59` | ~~If `first_deposit_time` is null, the entire withdrawal lock period is skipped.~~ | **RESOLVED** (`91b7377`): Lock period now falls back to `user.created_at` when `first_deposit_time` is null, ensuring all users have a lock period baseline. |
| S13 | **Medium** | Rate Limiting | All API routes | No rate limiting on any endpoint. Critical targets: login (brute force), register (account bombing), forgot-password (email flooding), withdraw (balance drain attacks), waitlist signup (spam), chatbot (API cost drain). | Add `upstash-ratelimit` or Vercel WAF rate limiting. Minimum: login (5/min), register (3/hour), forgot-password (2/hour), withdraw (10/day), chat (20/hour). |
| S14 | **Medium** | Input Validation | Multiple route files | No max length on password (bcrypt DoS), no max on profile fields (DB bloat), no message length limit on chat (API cost), no crypto address format validation on withdrawal. | Add password max 128 chars. Add field max lengths. Add crypto address regex validation per currency. |
| S15 | **Medium** | Monetary | `src/lib/services/plisio-deposit.ts:116,170`, `src/app/api/cron/daily-profit/route.ts:27`, `src/app/api/withdraw/route.ts:72` | All monetary arithmetic uses JavaScript `Number` (IEEE 754 double). Fee calculation `amount * 0.005` uses non-exact float. Daily profit `balance * (percentage / 100)` accumulates rounding errors over 365 days. DB uses correct `NUMERIC(18,8)`. | Use integer arithmetic (cents/satoshis) or a decimal library like `decimal.js`. At minimum, round all monetary results to 8 decimal places after every operation. |
| S16 | **Medium** | File Upload | `src/app/api/profile/avatar/route.ts:46`, `src/app/api/profile/kyc/upload/route.ts:70` | MIME type validation trusts browser-provided `file.type`. No magic byte verification of actual file content. A malicious file can claim to be `image/jpeg` but contain executable code. | Verify file content magic bytes using `file-type` or manual header inspection. Reject files whose content does not match declared MIME type. |
| S17 | **Medium** | Email | `src/lib/services/email.ts:16` | From address uses `kingdomtradex.vercel.app` domain. Most email providers reject or spam-filter email from `*.vercel.app` because it lacks SPF/DKIM/DMARC authentication. Password reset emails, welcome emails, and confirmations will not be delivered. | Use a verified custom domain with Resend. Configure SPF, DKIM, and DMARC records. |
| S18 | **Medium** | Security Headers | `next.config.mjs` | No CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Strict-Transport-Security headers configured. | Add security headers in next.config.mjs via `headers()` config. Minimum: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff. |
| S19 | **Medium** | Data Integrity | `src/app/api/cron/daily-profit/route.ts:47-49` | If two cron invocations overlap, the UNIQUE constraint on `ai_trading_profits(user_id, date)` blocks duplicate INSERT, but the balance UPDATE at line 47 still executes on the second run, compounding the profit twice. | Move profit calculation into a PostgreSQL function with idempotency guarantees. Or check return value of INSERT before updating balance. |
| S20 | **Medium** | Session | `src/lib/auth/session.ts:7` | Sessions expire exactly 24 hours after creation with no sliding refresh. User is abruptly logged out mid-session. | Implement sliding expiration: on each authenticated request, extend `expires_at` if more than halfway through the session window. |
| S21 | **Medium** | Injection | `src/app/api/auth/register/route.ts:28`, `src/lib/db/users.ts:50` | User-controlled values interpolated into Supabase `.or()` filter string: `` or(`email.eq.${emailClean},username.eq.${usernameClean}`) ``. If the Supabase JS client version does not properly encode these, a crafted email containing `,` could alter filter logic. | Use Supabase's parameterized filter: `.or('email.eq.{e},username.eq.{u}', { e: emailClean, u: usernameClean })`. |
| S22 | **Medium** | Secrets | `sql/create_password_resets.sql:7` | Password reset tokens stored in plaintext in the `password_resets` table. DB access leaks all active reset tokens. | Hash tokens with SHA-256 before storing. Verify by hashing the incoming token. |
| S23 | **Low** | CSRF | `src/middleware.ts:104` | `csrf_guest` cookie is read but **never set** anywhere in the codebase. The guest CSRF fallback in middleware always fails. Deposit page sends an empty string CSRF token. | Set `csrf_guest` cookie on first visit (middleware or page). Or remove guest CSRF logic and handle deposit CSRF differently. |
| S24 | **Low** | Input Validation | `src/app/api/deposit/create-invoice/route.ts:33`, settings defaults `sql/supabase_migration.sql:170-172` | Schema defines `min_deposit_usdt = 10.00`, `min_deposit_btc = 0.001`, `min_deposit_eth = 0.01` but these are never enforced in the API route. Only `amount > 0` is checked. | Enforce minimum deposit amounts from settings in the create-invoice route. |
| S25 | **Low** | Content | `src/app/(public)/waitlist/page.tsx:8`, `src/app/(public)/waitlist/[referralCode]/page.tsx:7` | `VIP_LIMIT = 5000` is a hardcoded manufactured scarcity number. "Only X VIP spots remaining" subtracts real waitlist count from this arbitrary cap. | Either tie VIP limit to a configurable setting or remove the artificial scarcity messaging. |
| S26 | **Low** | UX | `src/components/layout/Footer.tsx:12-20` | Telegram CTA links to `t.me/yourgroup` and BonChat CTA links to `bonchat.io/yourlink` -- placeholder URLs not configured for production. | Set real community URLs or remove the CTAs if the platforms are not set up. |
| S27 | **Low** | Input Validation | `src/app/api/withdraw/route.ts:89` | Withdrawal destination `address` is not validated for format, length, or blockchain compatibility. Empty string or garbage passes through. | Add per-currency address validation: BTC address regex (26-35 alphanumeric starting 1/3/bc1), ETH regex (0x + 40 hex), etc. |
| S28 | **Info** | Crypto | `src/lib/services/plisio-client.ts:38` | Webhook signature uses HMAC-SHA1. While HMAC-SHA1 is not practically broken for HMAC, HMAC-SHA256 is the modern standard. | Upgrade to HMAC-SHA256. Check Plisio documentation for supported algorithms. |
| S29 | **Info** | RLS | `sql/supabase_migration.sql:191-204` | RLS enabled on 5 tables but the only policy (`users_self`) uses `auth.uid() IS NOT NULL OR id IS NOT NULL` which matches all rows. The app uses `service_role` key which bypasses RLS entirely. RLS provides zero effective protection. | Either remove RLS (unused) or implement proper per-user policies and use anon key for user-facing queries. |
| S30 | **Info** | Deps | `package.json:16` | `bcryptjs` version `^3.0.3` exists but the latest is `^2.4.3`. The `^3.0.3` may be a typo or a newer major version. | Verify `bcryptjs@3.0.3` is the intended version. Consider `bcrypt` (native bindings) for better performance. |
| S31 | **Info** | Logging | `src/middleware.ts:34-36` | Middleware logs pathname, cookie presence, and token prefix on every request. This is verbose and logs partial session tokens in production. | Remove or gate behind `process.env.NODE_ENV === 'development'` checks. |
| S32 | **Info** | Config | `DEPLOYMENT.md` | Deployment documentation has no environment variable list, no setup instructions, no cron configuration notes. | Document all required env vars, their purpose, and where to obtain them. Document Vercel cron setup matching vercel.json. |

---

## Detailed Findings

### S01 - Unauthenticated Admin Settings Endpoint [CRITICAL]

**File:** `src/app/api/admin/settings/route.ts`, lines 1-23

The entire PATCH handler has zero authentication:

```typescript
export async function PATCH(request: NextRequest) {
  const { key, value } = await request.json();
  // NO session check, NO role check, NO CSRF check
  if (!key || value === undefined || value === null) {
    return NextResponse.json({ success: false, error: 'Missing key or value.' }, { status: 400 });
  }
  // Directly writes to settings table
  await supabase.from('settings').update({ setting_value: value }).eq('setting_key', key);
}
```

**Impact:** An attacker can set `daily_profit_percentage` to `999`, set `withdrawal_lock_hours` to `0`, or replace `plisio_api_key` and `openrouter_api_key` with their own keys to intercept payments.

**Remediation:**
1. Add admin session validation (reuse pattern from `admin/kyc/route.ts` lines 7-27)
2. Whitelist allowed setting keys that can be modified via API
3. Validate value types and ranges per setting key
4. Log all setting changes to `admin_logs`

---

### S02 - Session Token and PII Logged in Plaintext [CRITICAL]

**File:** `src/app/api/auth/login/route.ts`

The login route logs sensitive data to console:

| Line | Content |
|------|---------|
| 22 | `console.log('[login] email:', emailClean)` - Email in clear text |
| 24 | `console.log('[login] hash prefix (first 10):', user?.password_hash?.substring(0, 10) ?? 'none')` - Hash prefix |
| 38 | `console.log('[login] bcrypt.compare result:', pwOk)` - Auth result |
| 49 | `console.log('[login] session token:', token)` - **Full session token** |
| 67 | `console.log('[login] cookie value on response:', setCookie?.value?.substring(0, 16) + '...')` - Partial token |
| 68 | `console.log('[login] response headers Set-Cookie:', response.headers.get('Set-Cookie'))` - **Full Set-Cookie header** |

**Impact:** Any person or system with access to server logs (Vercel Logs, log drains, error tracking) can extract session tokens and impersonate any user who logged in. This applies to admin accounts as well.

**Remediation:** Remove all credential-logging console statements. If login debugging is needed, log only: `{ event: 'login_attempt', success: true/false, userId: id }` with no secrets.

---

### S03 - Default Admin Credentials in SQL Migrations [CRITICAL]

**Files:** `sql/supabase_migration.sql:181-184`, `sql/database.sql:178-179`, `sql/seed_demo_data.sql:140`

The migration inserts an admin user with a well-known password:

```sql
-- Default admin user (password: admin123) - CHANGE AFTER INSTALL
INSERT INTO users (username, email, password_hash, role, referral_code, plisio_uid, status)
VALUES ('admin', 'admin@demo.local',
    '$2y$12$LJ3m4ys3YOkTREhvH6MxO.Qs1wR0HBhKgBkKmPjHkKANDJd4HGmKe',
    'admin', 'ADMIN001', 'user_1_a1b2c3d4', 'active')
ON CONFLICT (email) DO NOTHING;
```

Additionally, all 50 seed demo users share a single password hash in `sql/seed_demo_data.sql:140`.

**Impact:** If the admin password is not changed after installation, anyone who reads the SQL files or this audit report can log in as admin to the production system. The seed demo users share one password, so compromising one demo account compromises all 50.

**Remediation:**
1. Remove the default admin INSERT from the main migration file
2. Create a separate `create-admin.sql` script that is NOT committed to the repository
3. Require admin password to be set via environment variable or one-time setup endpoint
4. Generate unique random passwords for each seed demo user

---

### S04 - No Database Transactions on Balance Mutations [CRITICAL]

**Affected files:** All of `plisio-deposit.ts`, `withdraw/route.ts`, `daily-profit/route.ts`, `process-withdrawals.ts`, `deposit-simulate/route.ts`

Every balance mutation in the codebase follows this pattern:

```typescript
// Read current balance
const user = await getUserById(userId);
const currentBalance = Number(user.display_balance || 0);

// Compute new balance in JavaScript
const newBalance = currentBalance + amount;

// Write back (separate operation, no lock)
await updateUser(userId, { display_balance: newBalance.toFixed(8) });
```

This is a classic read-modify-write anti-pattern with zero concurrency control. There are no PostgreSQL functions, no `SELECT ... FOR UPDATE`, no transactions, and no atomic increments.

**Impact scenarios:**
- Two Plisio webhooks arrive simultaneously for the same user: both read balance=100, both write balance=150, one deposit is lost
- Two withdrawal requests submitted simultaneously: both read balance=1000, both pass the `amount > balance` check, both write the deducted balance, user withdraws 2000 from 1000 balance
- Cron runs while a user's deposit is processing: balance corruption

**Remediation:** Use atomic PostgreSQL operations. Example:

```sql
-- Safe atomic credit (no race condition)
UPDATE users SET display_balance = display_balance + $1 WHERE id = $2;

-- Safe atomic debit with balance check (no race condition)
UPDATE users SET display_balance = display_balance - $1
WHERE id = $2 AND display_balance >= $1
RETURNING id; -- Returns NULL if insufficient balance
```

Call these via `.rpc('atomic_credit', { user_id, amount })`.

---

### S05 - CSRF Validation Gaps [HIGH]

**File:** `src/middleware.ts:84-119`, `src/lib/auth/csrf.ts:22-29`

The middleware CSRF check has multiple issues:

1. **Non-timing-safe comparison** (line 100): `csrfToken === session.csrf_token` uses standard string equality, making the token length discoverable via timing side-channel.

2. **Timing-safe function exists but unused**: `timingSafeEqual()` in `src/lib/auth/csrf.ts:22` is well-implemented but never called by the middleware.

3. **8 route prefixes excluded from CSRF entirely** (lines 10-27): auth, waitlist, plisio-webhook, seed-demo, cron. These state-changing endpoints have zero CSRF protection:
   - `POST /api/auth/logout` - attacker can log out victim
   - `POST /api/auth/forgot-password` - attacker can spam password resets
   - `POST /api/plisio-webhook` - excluded by necessity but needs alternative auth (see S10)
   - `POST /api/waitlist/signup` - attacker can spam signups

4. **Guest CSRF cookie never set** (line 104): Middleware reads `csrf_guest` cookie but it is never written anywhere, so the fallback path always fails.

**Remediation:**
1. Use `timingSafeEqual()` from csrf.ts in middleware
2. Set `csrf_guest` cookie on first unauthenticated page load
3. Add explicit CSRF checks inside excluded auth routes (except plisio-webhook which needs separate auth)

---

### S06 - Duplicate Deposit Risk from Missing Unique Constraint [HIGH]

**File:** `sql/supabase_migration.sql:49`, `src/lib/services/plisio-deposit.ts:93-101`

The deposit deduplication check is a non-atomic SELECT-then-INSERT:

```typescript
const { data: existing } = await supabase
  .from('deposits').select('id').eq('txn_id', txnId).limit(1);
if (existing && existing.length > 0) {
  return { success: true, message: 'Duplicate transaction.' };
}
// ... INSERT deposit and credit balance ...
```

The `deposits.txn_id` column has no UNIQUE constraint in the schema. Two simultaneous webhook calls both pass the SELECT check, both INSERT, and both credit the balance. The user receives double the deposit amount.

**Remediation:** Add `UNIQUE (txn_id)` to the deposits table and use `ON CONFLICT (txn_id) DO NOTHING` in the INSERT statement.

---

### S08 - Referral Commission System Unimplemented [HIGH]

**File:** `src/lib/db/commissions.ts:38-55`

`createCommission()` is fully implemented with correct percentage fields and status tracking, but a grep of the entire `src/` tree reveals **zero callers**. No code walks the referral tree upward from a depositor, calculates tiered commission amounts (15/5/3/2/1%), and inserts commission records.

The `getDownlineTree()` function in `users.ts:161` walks DOWN the tree (children), not UP (ancestors). Commission distribution requires walking UP from the depositor through their `referred_by` chain, which no function does.

**Impact:** The 5-level MLM referral system advertised on the landing page (total up to 26% across 5 levels) does not function. Users who refer others receive no commissions when their referrals deposit.

**Remediation:**
1. Implement `distributeCommissions(depositorUserId, depositAmount, depositId)` that walks up the `referred_by` chain 5 levels
2. For each upline level, calculate: `amount * percentage[level] / 100` using settings values
3. Insert into `referral_commissions` with `status: 'pending'`
4. Add UNIQUE constraint on `(user_id, source_deposit_id, level)` for idempotency
5. Call this from `PlisioDepositService.handleCallback()` after successful deposit credit

---

### S11 - Vercel Cron Path Mismatch [HIGH]

**File:** `vercel.json:3-6`

```json
{
  "crons": [
    { "path": "/api/cron/apply-profit", "schedule": "1 0 * * *" },
    { "path": "/api/cron/process-withdrawals", "schedule": "0 2 * * *" }
  ]
}
```

The actual profit cron route file is `src/app/api/cron/daily-profit/route.ts`, which serves at `/api/cron/daily-profit`. The Vercel cron hits `/api/cron/apply-profit` which does not exist, returning 404.

**Impact:** **No daily profits have been distributed.** The 1.5% daily yield advertised on the landing page is not being applied to any user balances.

**Remediation:** Change `vercel.json` line 4 to `"path": "/api/cron/daily-profit"`.

---

### S18 - Missing Security Headers [Medium]

**File:** `next.config.mjs`

The Next.js configuration has no security headers:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
  },
};
```

**Remediation:** Add a `headers()` function:

```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
    ],
  }];
}
```

---

## Workflow Status Table

| Flow | Status | Notes |
|------|--------|-------|
| Waitlist signup | **Working** | Referral attribution and tier calculation function correctly. No email confirmation sent. `Math.random()` for code generation (crypto-grade CSPRNG preferred). |
| User registration | **Working** | Password hashed (bcrypt cost 12). Session created. $50 starter grant set in `bonus_balance` but never credited to spendable `display_balance`. Referral attribution works. No welcome email sent. |
| Login | **Working** | Credential verification correct. Session creation correct. Cookie flags correct. **PII and session token logged to console - see S02.** |
| Password reset | **Working** | Token generated via `crypto.randomBytes(32)`. 1-hour expiry enforced in app code. Token invalidated on use. All sessions preserved (not revoked on reset). Tokens stored plaintext. No email delivery confirmation. |
| Deposit (Plisio) | **Working with risks** | Invoice creation and webhook receipt function. Signature verification implemented (HMAC-SHA1). **Replay risk from missing UNIQUE constraint (S06). Race condition on balance credit (S04). Minimum deposit not enforced (S24).** |
| Withdrawal | **Working with risks** | Balance check, lock period, fee calculation all present. **TOCTOU race on balance (S04). Lock bypassed if first_deposit_time null (S12). Address not validated (S27). No admin approval flow.** |
| Daily profit cron | **Broken** | Cron path in vercel.json points to non-existent endpoint (S11). Code itself works but has double-credit risk (S19) and no transaction wrapping (S04). |
| Referral commissions | **Broken** | `createCommission()` has zero callers (S08). No tree-walking code for upward traversal. Database table and UI exist but data is never populated. |
| Bonus unlock ($50 starter) | **Broken** | `bonus_balance` set at registration, `bonus_locked` toggled at $100 deposited, but bonus never added to `display_balance` (S09). |
| KYC verification | **Working** | Document and selfie uploads function. MIME type checked (trusts browser). Admin review endpoint works with approve/reject. No notification to user on status change. |
| Profile update | **Working** | Field whitelist enforced. Session validation correct. No field length limits. Avatar upload to Supabase Storage works. |
| Admin: user management | **Working** | Search, status changes, and KYC review function. |
| Admin: settings | **Broken** | No auth check (S01). Any setting key accepted. |
| Admin: seed demo | **Working** | Protected by `X-Seed-Token` header vs `CRON_SECRET`. |
| Ephod Oracle chatbot | **Working** | OpenRouter integration functional. No rate limiting (API cost risk). No session auth (publicly accessible). No input length limit. |
| Referral tree view | **Working** | UI renders correctly. Data fetched from working `getDownlineTree()`. |
| Waitlist leaderboard | **Working** | Names masked. Real-time count correct. |
| Social proof toast | **Working** | Data from real deposits. Names masked. 60s cache. |

---

## Route-by-Route Auth Matrix

| Route | Method | Auth | Role Check | CSRF | Input Validation | Rate Limit |
|-------|--------|------|------------|------|------------------|------------|
| `/api/auth/login` | POST | N/A | N/A | None | Email regex only | None |
| `/api/auth/register` | POST | N/A | N/A | None | Username 3-50, email regex, password 8+ | None |
| `/api/auth/logout` | POST | Cookie | N/A | None | N/A | None |
| `/api/auth/forgot-password` | POST | None | N/A | None | Email regex | None |
| `/api/auth/reset-password` | POST | None | N/A | None | Token+password truthy | None |
| `/api/admin/kyc` | GET/POST | Cookie | Admin | None | Body typed, action whitelisted | None |
| `/api/admin/settings` | **PATCH** | **NONE** | **NONE** | None | None | None |
| `/api/admin/seed-demo` | POST | X-Seed-Token | N/A | N/A | None | None |
| `/api/chat` | POST | None | N/A | Middleware | None | None |
| `/api/cron/daily-profit` | GET | Bearer CRON_SECRET | N/A | N/A | N/A | N/A |
| `/api/cron/process-withdrawals` | GET | Bearer CRON_SECRET | N/A | N/A | N/A | N/A |
| `/api/deposit/create-invoice` | POST | Cookie | N/A | Middleware | Currency whitelist, amount>0 | None |
| `/api/deposit/status/[txnId]` | GET | Cookie | N/A | N/A | **None (IDOR)** | None |
| `/api/deposit-simulate` | POST | Cookie | N/A | Middleware | Amount>0 | None |
| `/api/market` | GET | None | N/A | N/A | N/A | None |
| `/api/plisio-webhook` | POST | **None** | N/A | None | **None** | None |
| `/api/profile/me` | GET | Cookie | N/A | N/A | N/A | None |
| `/api/profile/update` | POST | Cookie | N/A | Middleware | Field whitelist, string check | None |
| `/api/profile/kyc` | GET/POST | Cookie | N/A | Middleware | Doc type whitelisted | None |
| `/api/profile/kyc/upload` | POST | Cookie | N/A | Middleware | Upload type, MIME whitelist, 5MB | None |
| `/api/profile/avatar` | POST | Cookie | N/A | Middleware | MIME whitelist, 2MB | None |
| `/api/profile/migrate` | POST | Cookie | Admin | Middleware | N/A (hardcoded SQL) | None |
| `/api/social-proof` | GET | None | N/A | N/A | N/A | None |
| `/api/waitlist/signup` | POST | None | N/A | None | Email regex, role whitelist | None |
| `/api/waitlist/stats` | GET | None | N/A | N/A | N/A | None |
| `/api/waitlist/leaderboard` | GET | None | N/A | N/A | N/A | None |
| `/api/waitlist/dashboard/[code]` | GET | None | N/A | N/A | Code truthy | None |
| `/api/withdraw` | POST | Cookie | N/A | Middleware | Amount>0, currency whitelist, **no address validation** | None |

---

## RLS Coverage Table

| Table | RLS Enabled | Policy Count | Effective Protection | Notes |
|-------|-------------|--------------|---------------------|-------|
| `users` | Yes | 1 | **None** | Policy `auth.uid() IS NOT NULL OR id IS NOT NULL` matches all rows |
| `deposits` | Yes | 0 | **None** | No policies defined |
| `withdrawals` | Yes | 0 | **None** | No policies defined |
| `referral_commissions` | Yes | 0 | **None** | No policies defined |
| `ai_trading_profits` | Yes | 0 | **None** | No policies defined |
| `sessions` | No | N/A | N/A | No RLS |
| `password_resets` | No | N/A | N/A | No RLS |
| `settings` | No | N/A | N/A | No RLS |
| `admin_logs` | No | N/A | N/A | No RLS |
| `waitlist` | No | N/A | N/A | No RLS |
| `withdrawal_locks` | No | N/A | N/A | No RLS |

**Note:** The application uses `SUPABASE_SERVICE_ROLE_KEY` for all database access, which bypasses RLS entirely. RLS policies only matter if the application switches to using the anon key for user-facing queries.

---

## Environment Variable Cross-Reference

### Required (referenced in code)

| Variable | Referenced In | Documented? | Safe for NEXT_PUBLIC? |
|----------|---------------|-------------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 26+ files | No | Yes (intentional public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1 file (`server.ts`) | No | Yes (intentional public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service.ts`, `migrate/route.ts` | No | **NO** - must remain server-only |
| `CRON_SECRET` | `daily-profit/route.ts`, `process-withdrawals/route.ts`, `seed-demo/route.ts` | No | **NO** - must remain server-only |
| `PLISIO_API_KEY` | Not referenced directly in TS (accessed via `plisio_api_key` DB setting) | No | **NO** |
| `OPENROUTER_API_KEY` | `oracle.ts:2` | No | **NO** - must remain server-only |
| `OPENROUTER_MODEL` | `oracle.ts:3` | No | Yes (non-secret model name) |
| `RESEND_API_KEY` | `email.ts:27` | No | **NO** - must remain server-only |
| `NEXT_PUBLIC_APP_URL` | `waitlist/signup/route.ts:32`, `DashboardContent.tsx:35` | No | Yes (URL is public) |

### Defined in DB settings (not env vars)

| Setting Key | Default | Used In |
|-------------|---------|---------|
| `commission_l1` - `commission_l5` | 15, 5, 3, 2, 1 | Only read by settings page UI, never used in commission calculation |
| `daily_profit_percentage` | 1.50 | `daily-profit/route.ts:11` |
| `withdrawal_lock_hours` | 72 | `withdraw/route.ts:58` |
| `min_deposit_usdt/btc/eth` | 10.00 / 0.001 / 0.01 | **Never enforced in API routes** |
| `min_withdrawal_usdt` | 10.00 | Never enforced in code |
| `plisio_api_key` | (empty) | `plisio-client.ts` (via `getSetting()`) |
| `openrouter_api_key` | (empty) | Not used (oracle.ts uses env var) |
| `openrouter_model` | mistralai/mistral-7b-instruct | Not used (oracle.ts uses env var) |

### Undocumented but referenced

All 9 env vars listed above lack documentation. `DEPLOYMENT.md` contains only build instructions.

### Defined in DB settings but unused

`openrouter_api_key`, `openrouter_model` - these exist in the settings table but the oracle service reads from environment variables instead.

---

## Em Dash Scan

**Zero em dashes found in any user-facing string.** All occurrences are in JSX comments only:

- `src/components/landing/CryptoMarquee.tsx:22,43` - Comments: `{/* Top row -- scroll left */}`
- `src/app/(app)/profile/page.tsx:410,620` - Comments: `{/* LEFT COLUMN -- ... */}`

None of these are rendered to the user.

---

## Telegram / BonChat CTA Audit

**Found in `src/components/layout/Footer.tsx`:**

- Line 12-13: Telegram CTA linking to `https://t.me/yourgroup` (placeholder URL)
- Line 18-20: BonChat CTA linking to `https://bonchat.io/yourlink` (placeholder URL)

Both appear inside a `{user && ...}` conditional (logged-in users only). Both use placeholder URLs that need to be updated before launch or the links should be removed.

Telegram is also mentioned in marketing copy in `src/components/landing/Testimonials.tsx:27`: "The community support through Telegram is incredible."

**No Telegram or BonChat CTA cards were found on the profile page.**

---

## Fake Stats Audit

| Location | Stat | Assessment |
|----------|------|------------|
| `HeroSection.tsx:162` | 1.6% daily yield | Hardcoded marketing claim |
| `HeroSection.tsx:168` | Waitlist count | **Real** (fetched from DB) |
| `HeroSection.tsx:174` | 5 levels | **Real** (platform feature count) |
| `HeroSection.tsx:180-181` | June 7, 2026 launch date | Hardcoded date |
| `waitlist/page.tsx:8` | VIP_LIMIT = 5000 | Manufactured scarcity |
| `waitlist/[referralCode]/page.tsx:7` | VIP_LIMIT = 5000 | Same manufactured scarcity |
| `FaqAccordion.tsx:12` | 1.5% daily rate | Hardcoded |
| `FaqAccordion.tsx:15` | $50 minimum deposit | Hardcoded |
| `DashboardContent.tsx:103` | $50.00 bonus | Hardcoded |
| `LiveMarkets.tsx:15-21` | Coin prices | Labeled as FALLBACK (used when API fails) |
| `YieldCalculator.tsx:22` | 1.5% rate | Client-side calculator using hardcoded rate |
| `page.tsx:58` | $50 USDT minimum deposit | Hardcoded in marketing copy |

---

## Appendix A: File Inventory

Total source files audited: **131 files** (excludes node_modules, .next, .git, .claude, memory)

| Directory | File Count | Notes |
|-----------|------------|-------|
| `src/app/api/` | 25 route files | All audited |
| `src/lib/` | 17 library files | All audited |
| `src/components/` | 28 component files | All audited |
| `src/app/(app)/` | 8 pages | All audited |
| `src/app/(admin)/` | 8 pages | All audited |
| `src/app/(auth)/` | 4 pages | All audited |
| `src/app/(public)/` | 5 pages | All audited |
| `sql/` | 6 SQL files | All audited |
| Config root | 8 files | All audited |

---

## Appendix B: Remediation Priority

### Must fix before launch (blocking):

1. ~~**S01** - Add auth to admin settings endpoint~~ ✅ `d3a2dda`
2. ~~**S02** - Remove PII/token logging from login route~~ ✅ `1dfd742`
3. ~~**S03** - Remove default admin credentials from SQL migrations~~ ✅ `7874b51`
4. ~~**S04** - Implement atomic balance mutations (PostgreSQL functions)~~ ✅ `ab3934e`
5. ~~**S08** - Implement referral commission distribution~~ ✅ `2d95608`
6. ~~**S11** - Fix vercel.json cron path~~ ✅ `765d0c8`

### Should fix before launch (high risk):

7. ~~**S05** - Implement proper CSRF validation~~ ✅ `59eda7f`
8. ~~**S06** - Add UNIQUE constraint on deposits.txn_id~~ ✅ `1d565ea`
9. ~~**S09** - Fix bonus balance credit on unlock~~ ✅ `c5bd31f`
10. ~~**S10** - Add webhook auth defense-in-depth~~ ✅ `001d40b`
11. ~~**S12** - Fix withdrawal lock bypass for users with no deposits~~ ✅ `91b7377`
12. ~~**S07** - Fix IDOR in deposit status endpoint~~ ✅ `e9e7588`

### Fix within first week post-launch:

13. **S13** - Add rate limiting
14. **S17** - Fix email from domain for deliverability
15. **S18** - Add security headers
16. **S19** - Fix cron double-credit risk
17. **S04 ongoing** - Convert all balance mutations to atomic operations

---

*Audit performed by automated static analysis. No code was modified during the audit.*
