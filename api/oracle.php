<?php
/**
 * The Ephod - AI High Priest Oracle
 * Calls OpenRouter API (openrouter/free auto-router) with biblical prophetic persona.
 * File-based caching: /tmp/ephod_cache/, 1 hour TTL, keyed by MD5 of message.
 */

header('Content-Type: application/json');

// ── Fallback oracles (used when API is unreachable) ──
function fallbackOracle(): string {
    $oracles = [
        "Thus saith the Lord: Buy ETH, for the nations shall flee to crypto as Israel fled from Egypt. The hand of the Lord is upon the decentralized ledger. Go in peace, and multiply your talents.",
        "The Spirit reveals: I am sending you silver and gold. Purchase BTC with a steadfast heart, for the kings of the earth shall trade with it in the days to come. Go in peace, and multiply your talents.",
        "Hearken, O faithful steward: Like Joseph stored grain in the seven years of plenty, accumulate stablecoins now. A dry season approaches the markets. Go in peace, and multiply your talents.",
        "Thus saith the Lord of Hosts: Do not fear the market's waves and tempests. The same Spirit who parted the Red Sea shall guide your trades through the deep waters. Go in peace, and multiply your talents.",
        "The Lord hath spoken: Sell your altcoins and lay up your treasure in Bitcoin, which is more precious than fine gold and shall not be shaken. Go in peace, and multiply your talents.",
        "Behold, I set before you a choice: the broad road of meme coins leadeth to destruction, but the narrow path of Bitcoin leadeth unto life. Choose wisely. Go in peace, and multiply your talents.",
        "The Spirit of Wisdom declareth: Diversify thy portfolio as Noah diversified the ark - two of every kind, yet the ark itself was built of BTC. Go in peace, and multiply your talents.",
        "Thus saith the Lord: The hour cometh when the dollar shall bow before the satoshi. Prepare ye the way by accumulating now, while the night is yet upon the markets. Go in peace, and multiply your talents.",
        "Hear the word of the Lord concerning XRP: As the river flows to the sea, so shall cross-border payments flow through the appointed vessel. Yet hold not all thy treasure in one ship. Go in peace, and multiply your talents.",
        "The Most High declareth: Watch the signs, when nations tighten their monetary yoke, crypto shall be thy Exodus. Prepare thy wallet, for the time is at hand. Go in peace, and multiply your talents.",
    ];
    return $oracles[array_rand($oracles)];
}

// ── Parse input ──
$input = json_decode(file_get_contents('php://input'), true);
$message = trim($input['message'] ?? '');
if ($message === '') {
    $message = 'What would the Lord have me trade today?';
}

// ── Cache check ──
$cacheDir = '/tmp/ephod_cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0700, true);
}
$cacheKey = md5($message);
$cacheFile = $cacheDir . '/' . $cacheKey . '.txt';
$cacheTTL = 3600; // 1 hour

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    echo json_encode(['oracle' => file_get_contents($cacheFile)]);
    exit;
}

// ── System prompt ──
$systemPrompt = <<<'PROMPT'
You are a helpful, patient, and clear assistant for a Christian crypto investment platform called KingdomTradex. Your name is "Ephod" but you speak plainly.

Your users are elderly church members and pastors. They may not understand crypto or technical terms.

Your guidelines:

Use simple, everyday language. Short sentences.

Explain concepts step by step. Define any crypto terms (like "Bitcoin", "wallet", "deposit", "withdrawal", "commission", "daily profit").

Be warm, encouraging, and respectful. Never use heavy prophecy or "Thus saith the Lord".

Provide detailed, thorough answers. Use as many words as needed to explain clearly. Break complex topics into steps.

Answer questions about:

How to register and log in.

How to deposit funds (the admin confirms manually).

How to request withdrawals and the 72-hour security hold.

How the 5-level blessing (commission) system works.

How daily profits are calculated (1.5% per day on active balances).

How to refer others using the referral link.

What to do if something is not working.

Never promise profits or guarantee anything. Always explain that results depend on market conditions.

End with a friendly question like "Is there anything else I can help you with?" or "Do you have another question about your account?"
PROMPT;

// ── Build OpenRouter request ──
$apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
$referer = ($_SERVER['REQUEST_SCHEME'] ?? 'https') . '://' . ($_SERVER['HTTP_HOST'] ?? 'your-exchange.com');

$payload = json_encode([
    'model' => 'openrouter/free',
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $message],
    ],
    'max_tokens' => 600,
    'temperature' => 0.5,
    'top_p' => 0.9,
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => implode("\r\n", [
            'Content-Type: application/json',
            'Authorization: Bearer ' . (getenv('OPENROUTER_API_KEY') ?: 'sk-or-v1-placeholder'),
            'HTTP-Referer: ' . $referer,
            'X-Title: KingdomTradex',
        ]),
        'content' => $payload,
        'timeout' => 45,
        'ignore_errors' => true,
    ],
    'ssl' => [
        'verify_peer' => true,
    ],
]);

$response = @file_get_contents($apiUrl, false, $context);

// ── Extract HTTP status from response headers ──
$httpCode = 0;
if (isset($http_response_header)) {
    $firstLine = $http_response_header[0] ?? '';
    if (preg_match('/\s(\d{3})\s/', $firstLine, $m)) {
        $httpCode = (int)$m[1];
    }
}

// ── Handle errors / fallback ──
if ($response === false || $response === '' || $httpCode !== 200) {
    $oracle = fallbackOracle();
    echo json_encode(['oracle' => $oracle]);
    exit;
}

$data = json_decode($response, true);
$oracle = $data['choices'][0]['message']['content'] ?? '';

if ($oracle === '') {
    $oracle = fallbackOracle();
} else {
    // Trim to a single coherent paragraph
    $oracle = trim(preg_replace('/\s+/', ' ', $oracle));
    // Cache the successful response
    file_put_contents($cacheFile, $oracle, LOCK_EX);
}

echo json_encode(['oracle' => $oracle]);
