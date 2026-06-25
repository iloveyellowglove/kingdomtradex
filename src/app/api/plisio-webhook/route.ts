import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/db/settings';
import { PlisioClient } from '@/lib/services/plisio-client';
import { PlisioDepositService } from '@/lib/services/plisio-deposit';

// In-memory rate limiter: max 10 requests per IP per 60s window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Plisio publishes their webhook IPs; this setting allows operators to keep the list current.
// Default CIDR ranges documented by Plisio as of 2025.
const DEFAULT_PLISIO_IPS = [
  '18.185.93.213',
  '18.192.87.143',
  '3.76.242.65',
  '3.124.252.224',
];

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '127.0.0.1';
}

function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true; // not configured - allow all (backwards compatible)
  return allowedIps.some((allowed) => {
    if (allowed.includes('/')) {
      // Basic CIDR check
      const [range, bits] = allowed.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
      const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
      return (ipNum & mask) === (rangeNum & mask);
    }
    return allowed === ip;
  });
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // IP allowlisting
  const rawIps = await getSetting('plisio_webhook_ips', '');
  const allowedIps = rawIps
    ? rawIps.split(',').map((s: string) => s.trim()).filter(Boolean)
    : DEFAULT_PLISIO_IPS;

  if (!isIpAllowed(clientIp, allowedIps)) {
    return NextResponse.json(
      { success: false, error: 'IP not allowed.' },
      { status: 403 }
    );
  }

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests.' },
      { status: 429 }
    );
  }

  const postData: Record<string, string> = {};
  const formData = await request.formData();
  formData.forEach((value, key) => {
    postData[key] = value.toString();
  });

  const plisioApiKey = await getSetting('plisio_api_key', '');
  if (!plisioApiKey) {
    return NextResponse.json({ success: false, error: 'Plisio not configured.' }, { status: 500 });
  }

  const client = new PlisioClient(plisioApiKey);
  const service = new PlisioDepositService(client);
  const result = await service.handleCallback(postData);

  return NextResponse.json(result);
}
