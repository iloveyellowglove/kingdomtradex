export async function queryOracle(message: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    console.error('[oracle] OPENROUTER_API_KEY is not set');
    return 'The Oracle is not available. Please configure the OPENROUTER_API_KEY.';
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are Ephod, the AI Oracle of KingdomTrade Exchange. You provide wise, biblically-informed guidance about stewardship, trading, and financial wisdom. Keep responses concise (2-4 sentences max). Speak with prophetic authority but never predict exact prices. Use KJV scripture references sparingly and naturally.',
          },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[oracle] OpenRouter HTTP ${res.status}: ${errBody}`);
      return `The Oracle is temporarily unavailable (HTTP ${res.status}). Try again later.`;
    }

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      console.error('[oracle] Unexpected response shape:', JSON.stringify(data).slice(0, 200));
      return 'The Oracle is silent. Seek wisdom in prayer and patience.';
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error('[oracle] fetch error:', err instanceof Error ? err.message : String(err));
    return 'The Oracle is temporarily unavailable. Try again later.';
  }
}
