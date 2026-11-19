import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SESSION_COOKIE_NAME = 'gc_admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

// Generate a random per-process secret if SESSION_SECRET is not explicitly provided
const RUNTIME_SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

export interface AdminSessionPayload {
  sub: string;
  username: string;
  displayName: string;
  exp: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', RUNTIME_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
}

export function createSessionToken(user: {
  id: string;
  username: string;
  displayName: string;
}): string {
  const payload: AdminSessionPayload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expectedSig = signPayload(encoded);

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as AdminSessionPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) result[key] = val;
  }
  return result;
}

export function getAdminSessionFromRequest(req: Request): AdminSessionPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const payload = verifySessionToken(bearerToken);
      if (payload) return payload;
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (!cookieToken) return null;
  return verifySessionToken(cookieToken);
}

function isHttpsRequest(req: Request): boolean {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const origin = String(req.headers.origin || '');
  return req.secure || forwardedProto === 'https' || origin.startsWith('https://');
}

export function setAdminSessionCookie(req: Request, res: Response, token: string): void {
  const https = isHttpsRequest(req);
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    https ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (https) {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export function clearAdminSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    https ? 'SameSite=None' : 'SameSite=Lax',
    'Max-Age=0',
  ];
  if (https) {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminSessionPayload;
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    res.status(401).json({
      error: 'Потрібна авторизація адміністратора.',
    });
    return;
  }
  req.adminUser = session;
  next();
}

// Simple in-memory rate limiter for login & booking creation
interface RateBucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const buckets = new Map<string, RateBucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const existing = buckets.get(ip);

    if (!existing || existing.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxAttempts) {
      res.status(429).json({
        error: 'Забагато запитів. Будь ласка, зачекайте кілька хвилин і спробуйте знову.',
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
