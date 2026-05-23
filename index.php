<?php
/**
 * Router / Homepage
 * KingdomTrade Exchange - Professional Crypto Trading Platform
 *
 * When used as PHP built-in server router, return false for existing
 * static files and PHP scripts so they're served directly.
 */
// On Vercel and other production environments, static file requests arrive at
// index.php via the catch-all route. Serve them with correct MIME types.
if (php_sapi_name() !== 'cli-server') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $ext = strtolower(pathinfo($uri, PATHINFO_EXTENSION));
    $mimeTypes = [
        'css'   => 'text/css',
        'js'    => 'application/javascript',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'eot'   => 'application/vnd.ms-fontobject',
    ];
    if (isset($mimeTypes[$ext])) {
        $file = __DIR__ . $uri;
        if (file_exists($file)) {
            header('Content-Type: ' . $mimeTypes[$ext]);
            header('Cache-Control: public, max-age=31536000, immutable');
            header('Content-Length: ' . filesize($file));
            readfile($file);
            exit;
        }
    }
}

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

$title = 'KingdomTrade Exchange: A Kingdom Marketplace for Faithful Stewards';
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
            --temple-gold: #FFD700;
            --royal-purple: #6A0DAD;
            --deep-purple: #4B0082;
            --dark-indigo: #1a1a2e;
            --bg-dark: #0e0b1a;
            --bg-card: #151025;
            --bg-card-hover: #1c1635;
            --text-primary: #f0edf5;
            --text-secondary: #a89bb5;
            --text-muted: #6e6080;
            --border: #261f3a;
            --border-light: #352c4a;
            --gold-glow: rgba(255, 215, 0, 0.25);
            --gold-glow-strong: rgba(255, 215, 0, 0.45);
        }

        * { box-sizing: border-box; }

        body {
            background-color: var(--bg-dark);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ── Navbar ── */
        .lp-nav {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 1000;
            background: rgba(14, 11, 26, 0.88);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-bottom: 1px solid var(--border);
            transition: background 0.3s;
        }
        .lp-nav.scrolled { background: rgba(14, 11, 26, 0.98); }
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
            color: var(--temple-gold);
            font-weight: 700;
            font-size: 1.3rem;
            letter-spacing: -0.3px;
        }
        .lp-nav-brand .logo-icon {
            width: 34px; height: 34px;
            background: linear-gradient(135deg, var(--temple-gold), #b8860b);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: #1a1a2e;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 6px; }
        .btn-nav-login {
            color: var(--text-primary);
            padding: 8px 18px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .btn-nav-login:hover { background: rgba(255,255,255,0.06); color: var(--temple-gold); }
        .btn-nav-register {
            background: linear-gradient(135deg, var(--temple-gold), #c9a800);
            color: #1a1a2e;
            padding: 9px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            transition: all 0.25s;
            box-shadow: 0 2px 12px var(--gold-glow);
        }
        .btn-nav-register:hover {
            background: linear-gradient(135deg, #FFE44D, var(--temple-gold));
            transform: translateY(-1px);
            box-shadow: 0 4px 20px var(--gold-glow-strong);
            color: #1a1a2e;
        }

        /* ── Hero ── */
        .lp-hero {
            padding: 150px 24px 88px;
            text-align: center;
            position: relative;
            overflow: hidden;
            background:
                radial-gradient(ellipse at 30% 15%, rgba(255, 215, 0, 0.06) 0%, transparent 55%),
                radial-gradient(ellipse at 70% 40%, rgba(106, 13, 173, 0.07) 0%, transparent 55%),
                radial-gradient(ellipse at 50% 75%, rgba(75, 0, 130, 0.05) 0%, transparent 40%);
        }
        .lp-hero-content { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }
        .lp-hero-badge {
            display: inline-block;
            padding: 6px 18px;
            border-radius: 100px;
            border: 1px solid rgba(255, 215, 0, 0.25);
            background: rgba(255, 215, 0, 0.05);
            color: var(--temple-gold);
            font-size: 0.84rem;
            font-weight: 500;
            margin-bottom: 30px;
            letter-spacing: 0.4px;
        }
        .lp-hero-badge .dot {
            display: inline-block;
            width: 7px; height: 7px;
            background: var(--temple-gold);
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .lp-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4.2rem);
            font-weight: 800;
            line-height: 1.12;
            letter-spacing: -1.5px;
            margin-bottom: 22px;
            color: #fff;
        }
        .lp-hero h1 .highlight {
            background: linear-gradient(135deg, var(--temple-gold), #FFC107, #FFD700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .lp-hero p.lead {
            font-size: 1.18rem;
            color: var(--text-secondary);
            max-width: 560px;
            margin: 0 auto 42px;
            line-height: 1.65;
        }
        .lp-hero-actions {
            display: flex;
            gap: 14px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-hero-primary {
            background: linear-gradient(135deg, var(--temple-gold), #c9a800);
            color: #1a1a2e;
            padding: 16px 38px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.05rem;
            text-decoration: none;
            transition: all 0.25s;
            box-shadow: 0 4px 28px var(--gold-glow);
        }
        .btn-hero-primary:hover {
            background: linear-gradient(135deg, #FFE44D, var(--temple-gold));
            transform: translateY(-2px);
            box-shadow: 0 8px 36px var(--gold-glow-strong);
            color: #1a1a2e;
        }
        .btn-hero-secondary {
            background: transparent;
            color: var(--text-primary);
            padding: 16px 38px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.05rem;
            text-decoration: none;
            border: 1px solid rgba(255, 215, 0, 0.3);
            transition: all 0.25s;
        }
        .btn-hero-secondary:hover {
            background: rgba(255, 215, 0, 0.06);
            border-color: var(--temple-gold);
            color: var(--temple-gold);
        }

        /* ── Ticker ── */
        .lp-ticker {
            max-width: 100%;
            overflow: hidden;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            background: var(--bg-card);
            padding: 14px 0;
            position: relative;
        }
        .lp-ticker-track {
            display: flex;
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
            padding: 0 30px;
            white-space: nowrap;
            border-right: 1px solid var(--border);
            min-width: 185px;
        }
        .lp-ticker-item .sym { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); }
        .lp-ticker-item .price { font-weight: 600; font-size: 0.88rem; color: var(--temple-gold); }
        .lp-ticker-item .change { font-size: 0.78rem; font-weight: 500; }
        .lp-ticker-item .change.up { color: #00c853; }
        .lp-ticker-item .change.down { color: #ff5252; }

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
        .lp-section-header h2 span { color: var(--temple-gold); }
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
        }
        .lp-feature-card:hover {
            background: var(--bg-card-hover);
            border-color: rgba(255, 215, 0, 0.2);
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .lp-feature-card .icon-box {
            width: 48px; height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            margin-bottom: 18px;
        }
        .lp-feature-card .icon-box.gold { background: rgba(255, 215, 0, 0.1); color: var(--temple-gold); }
        .lp-feature-card .icon-box.purple { background: rgba(106, 13, 173, 0.15); color: #b47cff; }
        .lp-feature-card .icon-box.indigo { background: rgba(75, 0, 130, 0.2); color: #9b6bff; }
        .lp-feature-card h3 { font-size: 1.08rem; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .lp-feature-card p { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin: 0; }

        /* ── Stats ── */
        .lp-stats {
            background: linear-gradient(135deg, rgba(106, 13, 173, 0.08), rgba(26, 26, 46, 0.5));
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 50px 24px;
        }
        .lp-stats-grid {
            max-width: 960px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 36px;
            text-align: center;
        }
        .lp-stat h3 {
            font-size: 2.1rem;
            font-weight: 700;
            color: var(--temple-gold);
            margin-bottom: 4px;
        }
        .lp-stat p { color: var(--text-muted); font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.6px; }

        /* ── How It Works ── */
        .lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 36px; }
        .lp-step { text-align: center; }
        .lp-step-num {
            width: 56px; height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            font-weight: 700;
            margin: 0 auto 18px;
            color: #1a1a2e;
            background: linear-gradient(135deg, var(--temple-gold), #b8860b);
            box-shadow: 0 4px 20px var(--gold-glow);
        }
        .lp-step h4 { font-size: 1.05rem; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .lp-step p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.55; margin: 0; }

        /* ── Testimonials ── */
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
        .lp-testimonial .stars { color: var(--temple-gold); font-size: 0.9rem; margin-bottom: 12px; letter-spacing: 2px; }
        .lp-testimonial .quote {
            color: var(--text-secondary);
            font-size: 0.92rem;
            line-height: 1.65;
            margin-bottom: 18px;
            font-style: italic;
        }
        .lp-testimonial .author { display: flex; align-items: center; gap: 10px; }
        .lp-testimonial .author .avatar {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--temple-gold), #b8860b);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a1a2e;
            font-weight: 700;
            font-size: 0.82rem;
        }
        .lp-testimonial .author .name { font-weight: 600; font-size: 0.86rem; color: var(--text-primary); }
        .lp-testimonial .author .role { font-size: 0.76rem; color: var(--text-muted); }

        /* ── CTA Banner ── */
        .lp-cta-banner {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.04), rgba(106, 13, 173, 0.06));
            border: 1px solid rgba(255, 215, 0, 0.15);
            border-radius: 24px;
            padding: 64px 32px;
            text-align: center;
            max-width: 760px;
            margin: 0 auto;
        }
        .lp-cta-banner h2 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .lp-cta-banner p { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 32px; }

        /* ── Footer ── */
        .lp-footer {
            border-top: 1px solid var(--border);
            background: linear-gradient(135deg, var(--dark-indigo), #110a22);
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
            color: var(--temple-gold);
            font-size: 0.82rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.9px;
            margin-bottom: 14px;
        }
        .lp-footer-col a {
            display: block;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.86rem;
            margin-bottom: 8px;
            transition: color 0.2s;
        }
        .lp-footer-col a:hover { color: var(--temple-gold); }
        .lp-footer-bottom {
            max-width: 1280px;
            margin: 36px auto 0;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            color: var(--text-muted);
            font-size: 0.81rem;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            .lp-nav-inner { padding: 0 16px; }
            .btn-nav-login { display: none; }
            .lp-hero { padding: 120px 20px 60px; }
            .lp-hero h1 { font-size: 2rem; }
            .lp-hero-actions { flex-direction: column; align-items: center; }
            .btn-hero-primary, .btn-hero-secondary { width: 100%; max-width: 300px; text-align: center; }
            .lp-section { padding: 56px 18px; }
            .lp-stats-grid { gap: 24px; }
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
            KingdomTrade Exchange
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
        <div class="lp-hero-badge"><span class="dot"></span>A Kingdom marketplace for faithful stewards</div>
        <h1>Multiply What You Have<br><span class="highlight">Been Entrusted With</span></h1>
        <p class="lead">Trade with wisdom. Earn daily harvest returns. Build your disciple network. KingdomTrade is where faithful stewardship multiplies God's resources.</p>
        <div class="lp-hero-actions">
            <a href="/register.php" class="btn-hero-primary">Get Started</a>
            <a href="/login.php" class="btn-hero-secondary">Login</a>
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
        <h2>A Platform Built on <span>Kingdom Principles</span></h2>
        <p>Everything you need to steward resources faithfully and multiply what you have been given.</p>
    </div>
    <div class="lp-features-grid">
        <div class="lp-feature-card">
            <div class="icon-box gold"><i class="bi bi-shield-check"></i></div>
            <h3>Kingdom Treasury</h3>
            <p>Multi-layer encryption, cold storage for assets, and a 72-hour stewardship hold protect what has been entrusted to you.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box purple"><i class="bi bi-lightning-charge"></i></div>
            <h3>Daily Harvest Returns</h3>
            <p>Automated daily returns applied to every steward's balance. Your resources grow while you build the Kingdom.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box indigo"><i class="bi bi-people-fill"></i></div>
            <h3>Covenant Blessings</h3>
            <p>A 5-level blessing structure from Firstfruits to Hundredfold. As your disciples prosper, blessings flow upward to you.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box gold"><i class="bi bi-graph-up-arrow"></i></div>
            <h3>Real-Time Trading</h3>
            <p>Professional TradingView charts powered by live Binance data. Multiple timeframes and tools for wise stewardship.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box purple"><i class="bi bi-wallet2"></i></div>
            <h3>Multi-Currency Treasury</h3>
            <p>Deposit and withdraw BTC, ETH, and USDT. Seamless management with Plisio payment integration.</p>
        </div>
        <div class="lp-feature-card">
            <div class="icon-box indigo"><i class="bi bi-headset"></i></div>
            <h3>The Ekklesia</h3>
            <p>Connect with fellow stewards. Receive prophetic market insights, coordinate the harvest, and grow together in faith.</p>
        </div>
    </div>
</section>

<!-- ── Stats ── -->
<div class="lp-stats">
    <div class="lp-stats-grid">
        <div class="lp-stat"><h3>10,000+</h3><p>Faithful Stewards</p></div>
        <div class="lp-stat"><h3>$50M+</h3><p>Kingdom Deposits</p></div>
        <div class="lp-stat"><h3>5 Levels</h3><p>Covenant Blessings</p></div>
        <div class="lp-stat"><h3>72-Hour</h3><p>Stewardship Hold</p></div>
    </div>
</div>

<!-- ── How It Works ── -->
<section class="lp-section">
    <div class="lp-section-header">
        <h2>Begin Your <span>Stewardship</span></h2>
        <p>Three steps to enter the Kingdom economy.</p>
    </div>
    <div class="lp-steps">
        <div class="lp-step">
            <div class="lp-step-num">1</div>
            <h4>Join the Kingdom</h4>
            <p>Register in under a minute with your email. Receive your unique disciple invitation code to begin building your network.</p>
        </div>
        <div class="lp-step">
            <div class="lp-step-num">2</div>
            <h4>Plant Your Seed</h4>
            <p>Make your first deposit in BTC, ETH, or USDT. Every seed planted begins your journey of multiplication.</p>
        </div>
        <div class="lp-step">
            <div class="lp-step-num">3</div>
            <h4>Reap the Harvest</h4>
            <p>Trade with real-time charts, earn daily harvest returns, and build your disciple network across five generations.</p>
        </div>
    </div>
</section>

<!-- ── Testimonials ── -->
<section class="lp-section">
    <div class="lp-section-header">
        <h2>What Fellow <span>Stewards Say</span></h2>
        <p>Hear from those who have entered the Kingdom economy.</p>
    </div>
    <div class="lp-trust-grid">
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"The covenant blessing structure is unlike anything I have seen. I brought five disciples into the Kingdom and now receive blessings from three generations of their spiritual lineage."</p>
            <div class="author">
                <div class="avatar">M</div>
                <div><div class="name">Michael R.</div><div class="role">Elder Steward</div></div>
            </div>
        </div>
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"The 72-hour stewardship hold gives me confidence that my resources are protected. This is faithful stewardship in action, not the reckless trading you see on other platforms."</p>
            <div class="author">
                <div class="avatar">S</div>
                <div><div class="name">Sarah L.</div><div class="role">Faithful Steward</div></div>
            </div>
        </div>
        <div class="lp-testimonial">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="quote">"I joined for the trading but stayed for the Ekklesia. The community of stewards, the prophetic insights, the shared mission: this is more than a platform, it is a movement."</p>
            <div class="author">
                <div class="avatar">D</div>
                <div><div class="name">David K.</div><div class="role">Covenant Steward</div></div>
            </div>
        </div>
    </div>
</section>

<!-- ── CTA ── -->
<section class="lp-section">
    <div class="lp-cta-banner">
        <h2>Ready to Enter the Kingdom?</h2>
        <p>Join 10,000+ stewards multiplying their resources. Create your account and begin your stewardship today.</p>
        <a href="/register.php" class="btn-hero-primary">Begin Your Stewardship</a>
    </div>
</section>

<!-- ── Footer ── -->
<footer class="lp-footer">
    <div class="lp-footer-inner">
        <div class="lp-footer-col">
            <h4>Kingdom</h4>
            <a href="/register.php">Register</a>
            <a href="/login.php">Log In</a>
            <a href="/trading.php">Trading</a>
        </div>
        <div class="lp-footer-col">
            <h4>Teaching</h4>
            <a href="/about/">God's Economics</a>
            <a href="/covenant/">The Covenant</a>
            <a href="#">Scripture</a>
        </div>
        <div class="lp-footer-col">
            <h4>Ekklesia</h4>
            <a href="#">Join Telegram</a>
            <a href="#">BonChat</a>
            <a href="#">Contact</a>
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
        <span>"The earth is the LORD's, and the fullness thereof." (Psalm 24:1)</span>
    </div>
</footer>

<script>
// ── Navbar scroll ──
(function() {
    var nav = document.getElementById('lpNav');
    window.addEventListener('scroll', function() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    });
})();

// ── Crypto ticker ──
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
        { sym: 'UNI/USDT', price: 8.92, change: +1.12 }
    ];

    var doubled = prices.concat(prices);
    var html = '';
    for (var i = 0; i < doubled.length; i++) {
        var p = doubled[i];
        var cls = p.change >= 0 ? 'up' : 'down';
        var sign = p.change >= 0 ? '+' : '';
        html += '<div class="lp-ticker-item">'
            + '<span class="sym">' + p.sym + '</span>'
            + '<span class="price">$' + p.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</span>'
            + '<span class="change ' + cls + '">' + sign + p.change.toFixed(2) + '%</span>'
            + '</div>';
    }
    document.getElementById('tickerTrack').innerHTML = html;

    setInterval(function() {
        var items = document.querySelectorAll('.lp-ticker-item');
        for (var i = 0; i < Math.min(prices.length, items.length); i++) {
            var p = prices[i];
            p.price += (Math.random() - 0.5) * p.price * 0.0004;
            var el = items[i].querySelector('.price');
            if (el) el.textContent = '$' + p.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            var mirror = items[i + prices.length];
            if (mirror) {
                var mel = mirror.querySelector('.price');
                if (mel) mel.textContent = '$' + p.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }
    }, 2000);

    // Also try CoinGecko if available
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.bitcoin) {
                prices[0].price = data.bitcoin.usd;
                prices[0].change = data.bitcoin.usd_24h_change || prices[0].change;
            }
            if (data && data.ethereum) {
                prices[1].price = data.ethereum.usd;
                prices[1].change = data.ethereum.usd_24h_change || prices[1].change;
            }
        })
        .catch(function() { /* fallback to hardcoded */ });
})();
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
