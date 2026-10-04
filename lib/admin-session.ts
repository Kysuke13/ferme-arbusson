import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'admin_session'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function secret() {
  return process.env.ADMIN_SESSION_SECRET || ''
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function isAdmin() {
  if (!secret()) return false
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [version, exp, sig] = parts
  if (version !== 'v1') return false
  const payload = `${version}.${exp}`
  if (!safeEqual(sig, sign(payload))) return false
  return Number(exp) > Date.now()
}

export async function startAdminSession() {
  const exp = Date.now() + MAX_AGE_MS
  const payload = `v1.${exp}`
  const token = `${payload}.${sign(payload)}`
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_MS / 1000,
  })
}

export async function clearAdminSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export function usernameMatches(input: string) {
  const expected = (process.env.ADMIN_USERNAME || 'contact@ferme-arbusson.fr').trim().toLowerCase()
  const given = input.trim().toLowerCase()
  if (!expected || !given) return false
  return safeEqual(given, expected)
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD || ''
  if (expected.length < 8) return false
  return safeEqual(input, expected)
}
