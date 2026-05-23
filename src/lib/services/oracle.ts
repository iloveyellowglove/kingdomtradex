export async function queryOracle(message: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
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

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'The Oracle is silent. Seek wisdom in prayer and patience.';
  } catch {
    return 'The Oracle is temporarily unavailable. Try again later.';
  }
}
