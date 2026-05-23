# QuantumTrade Exchange - Demo Platform

**DEMO MODE — Educational cryptocurrency exchange simulation.**

No real blockchain transactions. All balances, trades, and profits are simulated in MySQL. No payment gateways connected.

## Requirements

- PHP 8.0+
- MySQL 8.0+ / MariaDB 10.5+
- Apache with mod_rewrite OR Nginx
- Composer (optional, no external dependencies required)

## Quick Setup

### 1. Database Setup

```bash
mysql -u root -p < sql/database.sql
```

This creates the database `exchange_demo` with all tables and default settings.
Default admin: `admin@demo.local` / `admin123` (CHANGE IMMEDIATELY in production).

### 2. Configure Database Connection

Edit `config/database.php` or set environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=exchange_demo
export DB_USER=root
export DB_PASS=yourpassword
```

### 3. Apache Virtual Host

```apache
<VirtualHost *:80>
    ServerName exchange-demo.local
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
sudo a2ensite exchange-demo.conf
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

### 4. Nginx Setup

Copy `nginx.conf.example` to `/etc/nginx/sites-available/exchange-demo`, edit it, then:

```bash
sudo ln -s /etc/nginx/sites-available/exchange-demo /etc/nginx/sites-enabled/
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

## Project Structure

```
Exchange/
├── config/
│   └── database.php          # PDO database configuration
├── includes/
│   ├── functions.php          # Core functions (DB, auth, CSRF, etc.)
│   └── auth.php              # (reserved for custom auth logic)
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
│   ├── withdraw.php          # POST/GET /api/withdraw
│   ├── deposit_simulate.php  # POST /api/deposit/simulate (admin)
│   └── referral_tree.php     # GET /api/referral/tree
├── admin/
│   ├── index.php
│   ├── dashboard.php         # Admin dashboard route
│   ├── users.php             # User management route
│   ├── deposits.php          # Deposit confirmation route
│   ├── withdrawals.php       # Withdrawal management route
│   ├── commissions.php       # Commission management route
│   ├── settings.php          # System settings route
│   └── views/                # Admin view templates
│       ├── sidebar.php
│       ├── dashboard.php
│       ├── users.php
│       ├── deposits.php
│       ├── withdrawals.php
│       ├── commissions.php
│       └── settings.php
├── templates/
│   ├── header.php            # Common header with nav
│   ├── footer.php            # Common footer
│   ├── login.php
│   ├── register.php
│   ├── dashboard.php         # Member dashboard
│   ├── withdraw_history.php
│   ├── referral_tree.php
│   └── trading.php           # Simulated trading interface
├── cron/
│   ├── process_withdrawals.php
│   ├── apply_daily_profit.php
│   └── send_reminder_emails.php
├── assets/
│   ├── css/style.css
│   └── js/orderbook.js       # Simulated order book (client-side)
├── sql/
│   └── database.sql          # Full schema with default data
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
{"email": "user@demo.com", "password": "pass1234"}
```

### POST /api/auth/register
```json
{"username": "demo", "email": "user@demo.com", "password": "pass1234", "referral_code": "ABCD1234"}
```

### GET /api/user/dashboard
Returns balance, pending withdrawal info, downline counts.

### POST /api/withdraw/request
```json
{"currency": "USDT", "amount": 100, "address": "0xDemoWalletAddress"}
```
### GET /api/withdraw/history?limit=20

### POST /api/deposit/simulate (admin only)
```json
{"user_id": 2, "currency": "USDT", "amount": 1000, "txid": "MOCK-TX-001"}
```

### GET /api/referral/tree
Returns hierarchical downline tree.

## Features Summary

| Feature | Description |
|---------|-------------|
| User System | Registration with bcrypt passwords, roles (admin/pastor/member) |
| Referrals | Unique 8-char codes, 5-level MLM commission tracking |
| Deposits | Admin-confirmed simulated deposits, balance updates |
| Withdrawals | 72-hour security hold, net deposit validation, cron processing |
| Daily Profit | Configurable percentage applied to all active user balances |
| Trading | Client-side simulated order book with random walk prices |
| Admin Panel | User management, deposit confirmation, withdrawal override, settings |
| Security | CSRF tokens, prepared statements, bcrypt hashing, session auth |

## Disclaimer

This is a DEMONSTRATION / EDUCATIONAL platform. It does NOT:
- Connect to any blockchain or cryptocurrency network
- Send or receive real cryptocurrency
- Use real payment gateways
- Execute real trades
- Store real funds

All financial data displayed is simulated and has no real-world value.
