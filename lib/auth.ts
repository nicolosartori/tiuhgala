import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'tg_admin_session';

function getSecret() {
  return process.env.SESSION_SECRET || 'sviluppo-locale-cambia';
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function createSessionToken() {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function shouldUseSecureCookie(request?: Request) {
  if (process.env.ADMIN_COOKIE_SECURE === 'true') return true;
  if (process.env.ADMIN_COOKIE_SECURE === 'false') return false;

  const forwardedProto = request?.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https';
  }

  return request?.url?.startsWith('https:') ?? process.env.NODE_ENV === 'production';
}

export function isValidSessionToken(token: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function setAdminSession(request?: Request) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? isValidSessionToken(token) : false;
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  return password === configured;
}
