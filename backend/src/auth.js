// Password hashing (scrypt) and signed, expiring bearer tokens (HMAC-SHA256). No extra deps.
import crypto from 'node:crypto'

const SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') console.warn('[auth] JWT_SECRET is not set — using a random secret; sessions reset on restart.')
  return crypto.randomBytes(32).toString('hex')
})()
const TTL_MS = 1000 * 60 * 60 * 24 * 7

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64)
  const known = Buffer.from(hash, 'hex')
  return known.length === test.length && crypto.timingSafeEqual(known, test)
}

const b64 = (s) => Buffer.from(s).toString('base64url')
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url')

export function issueToken(userId) {
  const payload = b64(JSON.stringify({ sub: userId, exp: Date.now() + TTL_MS }))
  return `${payload}.${sign(payload)}`
}

export function readToken(token) {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = sign(payload)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Date.now() ? data : null
  } catch { return null }
}
