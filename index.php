<?php
/**
 * Router / Homepage
 * KingdomTrade Exchange - Professional Crypto Trading Platform
 *
 * When used as PHP built-in server router, return false for existing
 * static files and PHP scripts so they're served directly.
 */
if (php_sapi_name() === 'cli-server') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $file = __DIR__ . $uri;
    // Serve existing files and PHP scripts directly (bypass router)
    // Skip the root path (/) - we handle that ourselves.
    if ($uri !== '/' && $uri !== '' && file_exists($file) && !is_dir($file)) {
        return false;
    }
    // Serve directory index for subdirectories (not root)
    if ($uri !== '/' && $uri !== '' && is_dir($file) && file_exists($file . '/index.php')) {
        return false;
    }
}

require_once __DIR__ . '/includes/functions.php';
$currentUser = currentUser();

if ($currentUser) {
    header('Location: /dashboard.php');
    exit;
}

$title = 'KingdomTrade Exchange — Trade Crypto with Confidence';
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($title) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/assets/css/custom.css">
    <style>
        :root {
            --bg-primary: #08090d;
            --bg-secondary: #111318;
            --bg-card: #161920;
            --bg-card-hover: #1c1f2a;
            --accent: #0099ff;
            --accent-glow: rgba(0, 153, 255, 0.3);
            --accent-2: #00d4aa;
            --text-primary: #eef0f4;
            --text-secondary: #8b8fa6;
            --text-muted: #5c6078;
            --border: #1e2130;
            --border-light: #2a2d3a;
            --danger: #ff4467;
            --success: #00d4aa;
        }

        * { box-sizing: border-box; }

        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ── Navbar ── */
        .lp-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(8, 9, 13, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
            transition: background 0.3s;
        }
        .lp-nav.scrolled { background: rgba(8, 9, 13, 0.97); }
        .lp-nav-inner {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .lp-nav-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: var(--text-primary);
            font-weight: 700;
            font-size: 1.35rem;
            letter-spacing: -0.3px;
        }
        .lp-nav-brand .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--accent), #0066cc);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: #fff;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 8px; }
        .lp-nav-links a {
            text-decoration: none;
            font-weight: 500;
            font-size: 0.92rem;
            transition: all 0.2s;
        }
        .btn-nav-login {
            color: var(--text-primary);
            padding: 8px 18px;
            border-radius: 8px;
        }
        .btn-nav-login:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .btn-nav-register {
            background: var(--accent);
            color: #fff;
            padding: 9px 20px;
            border-radius: 8px;
            font-weight: 600;
        }
        .btn-nav-register:hover { background: #0080dd; color: #fff; }

        /* ── Hero ── */
        .lp-hero {
            padding: 140px 24px 80px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .lp-hero::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background:
                radial-gradient(ellipse at 30% 20%, rgba(0, 153, 255, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 50%, rgba(0, 212, 170, 0.05) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(0, 153, 255, 0.04) 0%, transparent 40%);
            pointer-events: none;
        }
        .lp-hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
        .lp-hero-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 100px;
            border: 1px solid var(--border-light);
            background: rgba(255,255,255,0.03);
            color: var(--accent-2);
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 28px;
            letter-spacing: 0.3px;
        }
        .lp-hero-badge .dot { display: inline-block; width: 7px; height: 7px; background: var(--accent-2); border-radius: 50%; margin-right: 8px; animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .lp-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4.2rem);
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -1.5px;
            margin-bottom: 20px;
            color: #fff;
        }
        .lp-hero h1 .highlight {
            background: linear-gradient(135deg, var(--accent), var(--accent-2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .lp-hero p.lead {
            font-size: 1.2rem;
            color: var(--text-secondary);
            max-width: 560px;
            margin: 0 auto 40px;
            line-height: 1.65;
        }
        .lp-hero-actions {
            display: flex;
            gap: 14px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-hero-primary {
            background: var(--accent);
            color: #fff;
            padding: 15px 36px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.05rem;
            text-decoration: none;
            transition: all 0.25s;
            box-shadow: 0 4px 24px var(--accent-glow);
        }
        .btn-hero-primary:hover { background: #0080dd; transform: translateY(-2px); box-shadow: 0 8px 32px var(--accent-glow); color: #fff; }
        .btn-hero-secondary {
            background: rgba(255,255,255,0.05);
            color: var(--text-primary);
            padding: 15px 36px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.05rem;
            text-decoration: none;
            border: 1px solid var(--border-light);
            transition: all 0.25s;
        }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.1); border-color: var(--text-muted); color: #fff; }

        /* ── Ticker ── */
        .lp-ticker {
            max-width: 100%;
            overflow: hidden;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            padding: 14px 0;
            position: relative;
        }
        .lp-ticker-track {
            display: flex;
            gap: 0;
            animation: ticker-scroll 40s linear infinite;
            width: max-content;
        }
        .lp-ticker:hover .lp-ticker-track { animation-play-state: paused; }
        @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .lp-ticker-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 28px;
            white-space: nowrap;
            border-right: 1px solid var(--border);
            min-width: 180px;
        }
        .lp-ticker-item .sym { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
        .lp-ticker-item .price { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
        .lp-ticker-item .change { font-size: 0.8rem; font-weight: 500; }
        .lp-ticker-item .change.up { color: var(--success); }
        .lp-ticker-item .change.down { color: var(--danger); }

        /* ── Section titles ── */
        .lp-section { padding: 80px 24px; max-width: 1280px; margin: 0 auto; }
        .lp-section-header { text-align: center; margin-bottom: 56px; }
        .lp-section-header h2 {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #fff;
            margin-bottom: 12px;
        }
        .lp-section-header p { color: var(--text-secondary); font-size: 1.05rem; max-width: 500px; margin: 0 auto; }

        /* ── Features ── */
        .lp-features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        .lp-feature-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 32px 28px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .lp-feature-card:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-light);
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .lp-feature-card .icon-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            margin-bottom: 18px;
        }
        .lp-feature-card .icon-box.blue { background: rgba(0, 153, 255, 0.12); color: var(--accent); }
        .lp-feature-card .icon-box.green { background: rgba(0, 212, 170, 0.12); color: var(--accent-2); }
        .lp-feature-card .icon-box.purple { background: rgba(120, 80, 255, 0.12); color: #8b5cf6; }
        .lp-feature-card h3 { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .lp-feature-card p { color: var(--text-secondary); font-size: 0.93rem; line-height: 1.6; margin: 0; }

        /* ── Stats ── */
        .lp-stats {
            background: var(--bg-secondary);
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 48px 24px;
        }
        .lp-stats-grid {
            max-width: 960px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 32px;
            text-align: center;
        }
        .lp-stat h3 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent), var(--accent-2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 4px;
        }
        .lp-stat p { color: var(--text-muted); font-size: 0.88rem; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── How It Works ── */
        .lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; counter-reset: step; }
        .lp-step {
            text-align: center;
            position: relative;
        }
        .lp-step-num {
            width: 56px; height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            font-weight: 700;
            margin: 0 auto 18px;
            color: #fff;
            background: linear-gradient(135deg, var(--accent), #0066cc);
            box-shadow: 0 4px 20px var(--accent-glow);
        }
        .lp-step h4 { font-size: 1.05rem; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .lp-step p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.55; margin: 0; }

        /* ── Trust / Testimonials ── */
        .lp-trust-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        .lp-testimonial {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 28px;
        }
        .lp-testimonial .stars { color: #f5a623; font-size: 0.9rem; margin-bottom: 12px; letter-spacing: 2px; }
        .lp-testimonial .quote { color: var(--text-secondary); font-size: 0.93rem; line-height: 1.65; margin-bottom: 16px; font-style: italic; }
        .lp-testimonial .author { display: flex; align-items: center; gap: 10px; }
        .lp-testimonial .author .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #0066cc); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 0.85rem; }
        .lp-testimonial .author .name { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); }
        .lp-testimonial .author .role { font-size: 0.78rem; color: var(--text-muted); }

        /* ── CTA Banner ── */
        .lp-cta-banner {
            background: linear-gradient(135deg, rgba(0, 153, 255, 0.08), rgba(0, 212, 170, 0.05));
            border: 1px solid var(--border-light);
            border-radius: 24px;
            padding: 64px 32px;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }
        .lp-cta-banner h2 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .lp-cta-banner p { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 32px; }
        .lp-cta-banner .btn-hero-primary { display: inline-block; }

        /* ── Footer ── */
        .lp-footer {
            border-top: 1px solid var(--border);
            background: var(--bg-secondary);
            padding: 48px 24px 32px;
        }
        .lp-footer-inner {
            max-width: 1280px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 32px;
        }
        .lp-footer-col h4 {
            color: var(--text-primary);
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 14px;
        }
        .lp-footer-col a {
            display: block;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.88rem;
            margin-bottom: 8px;
            transition: color 0.2s;
        }
        .lp-footer-col a:hover { color: var(--text-primary); }
        .lp-footer-bottom {
            max-width: 1280px;
            margin: 32px auto 0;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            color: var(--text-muted);
            font-size: 0.82rem;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            .lp-nav-links .btn-nav-login { display: none; }
            .lp-hero { padding: 110px 20px 56px; }
            .lp-hero h1 { font-size: 2rem; }
            .lp-section { padding: 56px 20px; }
            .lp-stats-grid { gap: 20px; }
            .lp-footer-bottom { flex-direction: column; text-align: center; }
            .lp-cta-banner { padding: 40px 20px; }
        }
    </style>
</head>
<body>

<!-- ── Navbar ── -->
<nav class="lp-nav" id="lpNav">
    <div class="lp-nav-inner">
        <a href="/" class="lp-nav-brand">
            <div class="logo-icon">&#x2663;</div>
            KingdomTrade
        </a>
        <div class="lp-nav-links">
            <a href="/about/" class="btn-nav-login">About</a>
            <a href="/login.php" class="btn-nav-login">Log In</a>
            <a href="/register.php" class="btn-nav-register">Register</a>
        </div>
    </div>
</nav>

<!-- ── Hero ── -->
<section class="lp-hero">
    <div class="lp-hero-content">
        <div class="lp-hero-badge"><span class="dot"></span>Trusted by thousands of traders worldwide</div>
        <h1>Trade Crypto with<br><span class="highlight">Speed & Confidence</span></h1>
        <p class="lead">KingdomTrade delivers institutional-grade trading tools, real-time market data, and industry-leading security — all in one powerful platform.</p>
        <div class="lp-hero-actions">
            <a href="/register.php" class="btn-hero-primary">Get Started Free</a>
            <a href="/login.php" class="btn-hero-secondary">Log In</a>
        </div>
    </div>
</section>

<!-- ── Live Ticker ── -->
<div class="lp-ticker">
    <div class="lp-ticker-track" id="tickerTrack"></div>
</div>

<!-- ── Features ── -->
<section class="lp-section" id="features">
    <div class="lp-section-header">
        <h2>Built for Serious Traders</h2>
        <p>Everything you need to trade crypto at the highest level.</p>
    </div>
    <div class="lp-features-grid">
        <div class="lp-feature-card">
            <div class="icon-box blue"><i class="bi bi-shield-check"></i></div>
            <h3>Bank-Grade Security</h3>
            <p>Multi-layer encryption, cold storage for assets, 72-hour withdrawal holds, and real-time threat monitoring keep your funds safe.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box green"><i class="bi bi-lightning-charge"></i></div>
            <h3>Lightning Execution</h3>
            <p>Sub-millisecond order matching engine processing thousands of trades per second. Never miss a market move.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box purple"><i class="bi bi-people-fill"></i></div>
            <h3>Earn While You Refer</h3>
            <p>Generous 5-level referral system. Earn up to 15% commission when your network trades. Build your legacy.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box blue"><i class="bi bi-graph-up-arrow"></i></div>
            <h3>Real-Time Charts</h3>
            <p>Professional-grade TradingView charts with live Binance data. Multiple timeframes, indicators, and drawing tools.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box green"><i class="bi bi-wallet2"></i></div>
            <h3>Multi-Currency Support</h3>
            <p>Deposit and withdraw BTC, ETH, and USDT. Seamless crypto management with Plisio payment integration.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box purple"><i class="bi bi-headset"></i></div>
            <h3>24/7 Support</h3>
            <p>Dedicated support team available around the clock. Plus our AI assistant answers your questions instantly.</p>
        </div>
    </div>
</section>

<!-- ── Stats ── -->
<div class="lp-stats">
    <div class="lp-stats-grid">
        <div class="lp-stat"><h3>10,000+</h3><p>Active Traders</p></div>
        <div class="lp-stat"><h3>$50M+</h3><p>Monthly Volume</p></div>
        <div class="lp-stat"><h3>99.9%</h3><p>Platform Uptime</p></div>
        <div class="lp-stat"><h3>0.5s</h3><p>Average Execution</p></div>
    </div>
</div>

<!-- ── How It Works ── -->
<section class="lp-section">
    <div class="lp-section-header">
        <h2>Start Trading in Minutes</h2>
        <p>Three simple steps to begin your crypto journey.</p>
    </div>
    <div class="lp-steps">
        <div class="lp-step">
            <div class="lp-step-num">1</div>
            <h4>Create Account</h4>
            <p>Register in under 60 seconds with just your email. No KYC required for basic trading.</p>
        </div>
        <div class="lp-step">
            <div class="lp-step-num">2</div>
            <h4>Deposit Funds</h4>
            <p>Fund your account with BTC, ETH, or USDT. Deposits are confirmed quickly by our team.</p>
        </div>
        <div class="lp-step">
            <div class="lp-step-num">3</div>
            <h4>Start Trading</h4>
            <p>Access real-time charts, place trades, earn daily profits, and build your referral network.</p>
        </div>
    </div>
</section>

<!-- ── Testimonials ── -->
<section class="lp-section">
    <div class="lp-section-header">
        <h2>What Our Traders Say</h2>
        <p>Join thousands of satisfied traders on KingdomTrade.</p>
    </div>
    <div class="lp-trust-grid">
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"I've used every major exchange. KingdomTrade's execution speed and charting tools are on par with the best. The referral rewards are unmatched."</p>
            <div class="author">
                <div class="avatar">M</div>
                <div><div class="name">Michael R.</div><div class="role">Professional Trader</div></div>
            </div>
        </div>
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"The security features give me peace of mind. I know my assets are protected with the 72-hour withdrawal hold and multi-layer encryption."</p>
            <div class="author">
                <div class="avatar">S</div>
                <div><div class="name">Sarah L.</div><div class="role">Crypto Investor</div></div>
            </div>
        </div>
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"Built my entire referral network on KingdomTrade. The 5-level commission system helped me generate passive income while I trade."</p>
            <div class="author">
                <div class="avatar">D</div>
                <div><div class="name">David K.</div><div class="role">Network Builder</div></div>
            </div>
        </div>
    </div>
</section>

<!-- ── CTA ── -->
<section class="lp-section">
    <div class="lp-cta-banner">
        <h2>Ready to Start Trading?</h2>
        <p>Join 10,000+ traders on the fastest-growing crypto exchange. Create your free account today.</p>
        <a href="/register.php" class="btn-hero-primary">Get Started Free</a>
    </div>
</section>

<!-- ── Footer ── -->
<footer class="lp-footer">
    <div class="lp-footer-inner">
        <div class="lp-footer-col">
            <h4>Platform</h4>
            <a href="/register.php">Register</a>
            <a href="/login.php">Log In</a>
            <a href="/trading.php">Trading</a>
        </div>
        <div class="lp-footer-col">
            <h4>Company</h4>
            <a href="/about/">About Us</a>
            <a href="/covenant/">Covenant</a>
            <a href="#">Careers</a>
        </div>
        <div class="lp-footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">API Docs</a>
        </div>
        <div class="lp-footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Risk Disclosure</a>
        </div>
    </div>
    <div class="lp-footer-bottom">
        <span>&copy; <?= date('Y') ?> KingdomTrade Exchange. All rights reserved.</span>
        <span>"The earth is the LORD's, and the fullness thereof." — Psalm 24:1</span>
    </div>
</footer>

<script>
// ── Navbar scroll effect ──
(function() {
    var nav = document.getElementById('lpNav');
    window.addEventListener('scroll', function() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    });
})();

// ── Live crypto ticker ──
(function() {
    var prices = [
        { sym: 'BTC/USDT', price: 67842.35, change: +2.14 },
        { sym: 'ETH/USDT', price: 3241.80, change: +1.87 },
        { sym: 'BNB/USDT', price: 598.42, change: -0.73 },
        { sym: 'SOL/USDT', price: 142.67, change: +5.32 },
        { sym: 'XRP/USDT', price: 0.6234, change: -1.25 },
        { sym: 'ADA/USDT', price: 0.4521, change: +0.89 },
        { sym: 'DOGE/USDT', price: 0.1287, change: +3.45 },
        { sym: 'AVAX/USDT', price: 35.82, change: -2.10 },
        { sym: 'DOT/USDT', price: 7.23, change: +1.56 },
        { sym: 'MATIC/USDT', price: 0.7234, change: -0.44 },
        { sym: 'LINK/USDT', price: 15.43, change: +4.21 },
        { sym: 'UNI/USDT', price: 8.92, change: +1.12 },
    ];

    // Duplicate for seamless infinite scroll
    var items = prices.concat(prices);
    var html = '';
    for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var cls = p.change >= 0 ? 'up' : 'down';
        var sign = p.change >= 0 ? '+' : '';
        html += '<div class="lp-ticker-item">'
            + '<span class="sym">' + p.sym + '</span>'
            + '<span class="price">$' + p.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</span>'
            + '<span class="change ' + cls + '">' + sign + p.change.toFixed(2) + '%</span>'
            + '</div>';
    }
    document.getElementById('tickerTrack').innerHTML = html;

    // Simulate live price updates
    setInterval(function() {
        var items = document.querySelectorAll('.lp-ticker-item');
        for (var i = 0; i < Math.min(prices.length, items.length); i++) {
            var p = prices[i];
            var jitter = (Math.random() - 0.5) * p.price * 0.0004;
            var newPrice = p.price + jitter;
            var priceEl = items[i].querySelector('.price');
            if (priceEl) priceEl.textContent = '$' + newPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            // Mirror in duplicated set
            var mirror = items[i + prices.length];
            if (mirror) {
                var mp = mirror.querySelector('.price');
                if (mp) mp.textContent = '$' + newPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }
    }, 2000);
})();
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
