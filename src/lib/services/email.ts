export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[EMAIL] RESEND_API_KEY not set. Would send to ' + to + ': ' + subject);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KingdomTrade Exchange <noreply@kingdomtradex.vercel.app>',
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const success = res.ok;
    console.log('[EMAIL] Resend send to ' + to + ': HTTP ' + res.status + ' ' + (success ? 'OK' : 'FAILED'));
    return success;
  } catch (e) {
    console.error('[EMAIL] Send failed:', e);
    return false;
  }
}
