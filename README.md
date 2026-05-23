# KingdomTrade Exchange

**Professional cryptocurrency exchange platform.**

All balances, trades, and profits are processed in real time via Supabase PostgreSQL.

## Requirements

- PHP 8.0+
- Supabase PostgreSQL project
- Apache with mod_rewrite OR Nginx
- Composer (optional, no external dependencies required)

## Quick Setup

### 1. Database Setup

Run the Supabase migration SQL in your Supabase SQL Editor:

```bash
# Copy contents of sql/supabase_migration.sql into Supabase SQL Editor
```

This creates all tables with default settings and RLS policies.
Default admin: `admin@kingdomtradex.com` / `admin123` (CHANGE IMMEDIATELY in production).

### 2. Configure Database Connection

Edit `config/database.php` or set environment variables:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apache Virtual Host

```apache
<VirtualHost *:80>
    ServerName kingdomtradex.local
    DocumentRoot /path/to/Exchange
    <Directory /path/to/Exchange>
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog ${APACHE_LOG_DIR}/exchange-error.log
    CustomLog ${APACHE_LOG_DIR}/exchange-access.log combined
</VirtualHost>
```

Enable and restart:
```bash
sudo a2ensite exchange.conf
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

### 4. Nginx Setup

Copy `nginx.conf.example` to `/etc/nginx/sites-available/exchange`, edit it, then:

```bash
sudo ln -s /etc/nginx/sites-available/exchange /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. File Permissions

```bash
chmod 755 /path/to/Exchange
chmod 644 /path/to/Exchange/*.php
chmod -R 755 /path/to/Exchange/assets
```

### 6. Cron Jobs

```bash
crontab -e
```

Add:
```
# Process eligible withdrawals every hour
0 * * * * php /path/to/Exchange/cron/process_withdrawals.php >> /var/log/exchange-cron.log 2>&1

# Apply daily AI trading profits at 00:01
1 0 * * * php /path/to/Exchange/cron/apply_daily_profit.php >> /var/log/exchange-cron.log 2>&1

# Send reminder emails daily at 10:00 (optional)
0 10 * * * php /path/to/Exchange/cron/send_reminder_emails.php >> /var/log/exchange-cron.log 2>&1
```

## Vercel Deployment

### Fixing "Authentication Required" on Vercel

If your deployed site shows a login screen instead of the exchange:

1. Go to your Vercel project dashboard.
2. Click **Settings** → **Deployment Protection**.
3. Under **Vercel Authentication**, select **Unprotected Previews** or **Disable for All Environments**.
4. Click **Save**.

After this change, your site will be publicly accessible. No code changes are needed.

The included `vercel.json` configures PHP routing for all API endpoints, cron scripts, and the front-controller pattern (all non-file requests route through `index.php`).

## Project Structure

```
Exchange/
├── config/
│   └── database.php          # Supabase database configuration
├── includes/
│   ├── functions.php          # Core functions (DB, auth, CSRF, etc.)
│   ├── SupabaseClient.php     # Supabase REST API client
│   ├── PlisioClient.php       # Plisio API client
│   ├── PlisioDepositService.php
│   └── PlisioWithdrawalService.php
├── models/
│   ├── User.php              # User registration, login, balance
│   ├── Deposit.php           # Deposit creation & admin confirmation
│   ├── Withdrawal.php        # Withdrawal requests, 72h hold, processing
│   ├── Commission.php        # Referral commission tracking & payouts
│   └── Settings.php          # System settings CRUD
├── controllers/
│   ├── AuthController.php    # Login, register, logout handlers
│   ├── DashboardController.php # Member dashboard, withdrawals, referrals
│   └── AdminController.php  # All admin functions
├── api/
│   ├── login.php             # POST /api/auth/login
│   ├── register.php          # POST /api/auth/register
│   ├── dashboard.php         # GET /api/user/dashboard
│   ├── oracle.php            # AI oracle chatbot
│   ├── plisio_webhook.php    # Plisio payment webhook
│   ├── deposit_simulate.php  # POST /api/deposit/simulate (admin)
│   └── admin/
│       └── pay_pending_commissions.php
├── admin/
│   ├── dashboard.php         # Admin dashboard route
│   ├── users.php             # User management route
│   ├── deposits.php          # Deposit confirmation route
│   ├── withdrawals.php       # Withdrawal management route
│   ├── commissions.php       # Commission management route
│   ├── settings.php          # System settings route
│   └── views/                # Admin view templates
├── templates/
│   ├── header.php            # Common header with nav
│   ├── footer.php            # Common footer
│   ├── login.php
│   ├── register.php
│   ├── dashboard.php         # Member dashboard
│   ├── trading.php           # Trading interface with real-time charts
│   ├── withdraw_history.php
│   └── referral_tree.php
├── cron/
│   ├── process_withdrawals.php
│   ├── apply_daily_profit.php
│   └── send_reminder_emails.php
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── orderbook.js       # Live order book
│       ├── trading_chart.js   # TradingView candlestick charts
│       └── ephod_chatbot.js   # AI chatbot widget
├── sql/
│   ├── database.sql          # MySQL schema with default data
│   └── supabase_migration.sql # Supabase PostgreSQL schema
├── .htaccess                 # Apache config
├── nginx.conf.example        # Nginx config example
├── index.php                 # Homepage
├── login.php
├── register.php
├── logout.php
├── dashboard.php
├── withdrawals.php
├── referral.php
└── trading.php
```

## API Documentation

### POST /api/auth/login
```json
{"email": "user@example.com", "password": "pass1234"}
```

### POST /api/auth/register
```json
{"username": "trader", "email": "user@example.com", "password": "pass1234", "referral_code": "ABCD1234"}
```

### GET /api/user/dashboard
Returns balance, pending withdrawal info, downline counts.

### POST /api/withdraw/request
```json
{"currency": "USDT", "amount": 100, "address": "0xYourWalletAddress"}
```
### GET /api/withdraw/history?limit=20

### POST /api/deposit/simulate (admin only)
```json
{"user_id": 2, "currency": "USDT", "amount": 1000, "txid": "TX-001"}
```

### GET /api/referral/tree
Returns hierarchical downline tree.

## Features Summary

| Feature | Description |
|---------|-------------|
| User System | Registration with bcrypt passwords, roles (admin/pastor/member) |
| Referrals | Unique 8-char codes, 5-level MLM commission tracking |
| Deposits | Admin-confirmed deposits, balance updates |
| Withdrawals | 72-hour security hold, net deposit validation, cron processing |
| Daily Profit | Configurable percentage applied to all active user balances |
| Trading | Real-time Binance candlestick charts, live order book |
| Admin Panel | User management, deposit confirmation, withdrawal override, settings |
| Security | CSRF tokens, Supabase RLS, bcrypt hashing, session auth |
| Payments | Plisio API integration for deposits and mass withdrawals |

## Disclaimer

KingdomTrade Exchange is a professional trading platform. All financial data displayed is processed in real time.
