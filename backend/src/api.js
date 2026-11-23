import { Router } from 'express'
import crypto from 'node:crypto'
import { db, save } from './db.js'
import { hashPassword, verifyPassword, issueToken, readToken } from './auth.js'
import { phones, internetPlans, deals, businessSolutions, faqs, supportTopics, supportArticles } from './catalog.js'

const api = Router()

// ---------- helpers ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const id = (prefix) => `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
const bad = (res, message, status = 400) => res.status(status).json({ ok: false, error: message })
// Once-off data bundles, ZAR (VAT incl.), added to the next bill.
const DATA_BUNDLES = { 1: 85, 5: 229, 10: 349, 20: 499 }
const publicUser = ({ passwordHash, ...u }) => u

// Simple fixed-window rate limiter for write endpoints.
const hits = new Map()
function limit(max = 20, windowMs = 60_000) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`
    const now = Date.now()
    const entry = hits.get(key) || { count: 0, reset: now + windowMs }
    if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs }
    entry.count += 1
    hits.set(key, entry)
    if (entry.count > max) return bad(res, 'Too many requests, please try again shortly.', 429)
    next()
  }
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now > v.reset) hits.delete(k) }, 60_000).unref()

function requireUser(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const session = readToken(token)
  const user = session && db().users.find(u => u.id === session.sub)
  if (!user) return bad(res, 'Please log in to continue.', 401)
  req.user = user
  next()
}

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_KEY
  if (!key) return bad(res, 'Admin access is not configured.', 503)
  const given = req.get('x-admin-key') || ''
  if (given.length !== key.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key))) return bad(res, 'Forbidden', 403)
  next()
}

// ---------- catalogue ----------
api.get('/health', (_req, res) => res.json({ ok: true, service: 'connectra-api', time: new Date().toISOString() }))

api.get('/phones', (req, res) => {
  let list = phones
  const brand = str(req.query.brand, 40)
  const max = Number(req.query.maxPrice)
  if (brand && brand !== 'All') list = list.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
  if (Number.isFinite(max) && max > 0) list = list.filter(p => p.price <= max)
  if (req.query.sort === 'price') list = [...list].sort((a, b) => a.price - b.price)
  res.json({ ok: true, count: list.length, phones: list })
})

api.get('/phones/:slug', (req, res) => {
  const phone = phones.find(p => p.slug === req.params.slug)
  if (!phone) return bad(res, 'Phone not found', 404)
  res.json({ ok: true, phone })
})

api.get('/plans/internet', (_req, res) => res.json({ ok: true, plans: internetPlans }))
api.get('/deals', (_req, res) => res.json({ ok: true, deals }))
api.get('/business/solutions', (_req, res) => res.json({ ok: true, solutions: businessSolutions }))
api.get('/faqs', (_req, res) => res.json({ ok: true, faqs }))

api.get('/stats', (_req, res) => {
  const d = db()
  res.json({ ok: true, currency: 'ZAR', customers: 500000 + d.users.length + d.orders.length, rating: 4.8, coverage: 98, maxSpeedMbps: 1000 })
})

// ---------- coverage ----------
// Deterministic availability per address until a real network-coverage API is connected.
api.post('/coverage/check', limit(30), (req, res) => {
  const address = str(req.body?.address, 200)
  if (address.length < 3) return bad(res, 'Please enter your address or postcode.')
  const h = crypto.createHash('sha256').update(address.toLowerCase()).digest()
  const fibre = h[0] % 10 < 7
  const fiveG = h[1] % 10 < 8
  const signal = 72 + (h[2] % 27)
  const result = {
    address,
    fibre,
    fiveG,
    lte: true,
    signal,
    maxSpeedMbps: fibre ? (h[3] % 2 ? 1000 : 500) : fiveG ? 300 : 50,
    plans: fibre ? internetPlans : internetPlans.filter(p => p.mbps <= (fiveG ? 200 : 50)),
  }
  db().coverageChecks.push({ address, fibre, fiveG, at: new Date().toISOString() })
  if (db().coverageChecks.length > 2000) db().coverageChecks.splice(0, 500)
  save()
  res.json({ ok: true, result })
})

// ---------- leads ----------
api.post('/newsletter', limit(10), (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase()
  if (!EMAIL.test(email)) return bad(res, 'Please enter a valid email address.')
  const list = db().subscribers
  if (!list.some(s => s.email === email)) { list.push({ email, at: new Date().toISOString() }); save() }
  res.json({ ok: true, message: "You're subscribed. Deals are on their way." })
})

api.post('/business/callback', limit(10), (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase()
  const companySize = str(req.body?.companySize, 40)
  const solution = str(req.body?.solution, 60)
  if (!EMAIL.test(email)) return bad(res, 'Please enter a valid work email.')
  const ref = id('CB')
  db().callbacks.push({ ref, email, companySize, solution, at: new Date().toISOString() })
  save()
  res.json({ ok: true, ref, message: 'Thanks! A business specialist will call you within one working day.' })
})

// ---------- orders ----------
api.post('/orders', limit(10), (req, res) => {
  const b = req.body || {}
  const c = b.customer || {}
  const customer = {
    firstName: str(c.firstName, 60), lastName: str(c.lastName, 60),
    email: str(c.email, 160).toLowerCase(), mobile: str(c.mobile, 30),
  }
  if (!customer.firstName || !customer.lastName) return bad(res, 'Please enter your first and last name.')
  if (!EMAIL.test(customer.email)) return bad(res, 'Please enter a valid email address.')
  if (customer.mobile.replace(/\D/g, '').length < 9) return bad(res, 'Please enter a valid mobile number.')

  // Card numbers are never accepted or stored here — only the last four digits, for display.
  const last4 = str(b.payment?.last4, 4)
  if (!/^\d{4}$/.test(last4)) return bad(res, 'Payment details are incomplete.')

  let item
  if (b.type === 'internet') {
    const plan = internetPlans.find(p => p.id === b.planId)
    if (!plan) return bad(res, 'Unknown internet plan.')
    item = { type: 'internet', planId: plan.id, name: plan.name, detail: `${plan.speed} · Unlimited · Month-to-month`, monthly: plan.price, upfront: 0 }
  } else {
    const phone = phones.find(p => p.slug === b.phoneSlug)
    if (!phone) return bad(res, 'Unknown phone.')
    const term = Number(b.term) === 24 ? 24 : 36
    const storage = phone.storage.find(s => s.size === b.storage) || phone.storage[0]
    const color = phone.colors.find(x => x.name === b.color) || phone.colors[0]
    const monthly = phone.price + storage.add + (term === 24 ? 200 : 0)
    item = { type: 'phone', phoneSlug: phone.slug, name: phone.name, brand: phone.brand, detail: `${color.name} · ${storage.size} · ${phone.data} 5G data · ${term} months`, color: color.name, storage: storage.size, term, monthly, upfront: phone.upfront }
  }

  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const session = readToken(token)
  const order = {
    ref: id('CN'), status: 'received', item, customer,
    payment: { method: 'card', last4, status: 'pending-gateway' },
    currency: 'ZAR',
    totals: { monthly: item.monthly, dueToday: item.upfront, delivery: 0, vatIncluded: true },
    userId: session?.sub || null,
    createdAt: new Date().toISOString(),
  }
  db().orders.push(order)
  save()
  res.status(201).json({ ok: true, order })
})

api.get('/orders/:ref', limit(30), (req, res) => {
  const ref = str(req.params.ref, 20).toUpperCase()
  const email = str(req.query.email, 160).toLowerCase()
  const order = db().orders.find(o => o.ref === ref && o.customer.email === email)
  if (!order) return bad(res, 'We could not find an order with those details.', 404)
  res.json({ ok: true, order: { ref: order.ref, status: order.status, item: order.item, createdAt: order.createdAt } })
})

// ---------- auth & account ----------
api.post('/auth/register', limit(10), (req, res) => {
  const name = str(req.body?.name, 80)
  const email = str(req.body?.email, 160).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (name.length < 2) return bad(res, 'Please enter your name.')
  if (!EMAIL.test(email)) return bad(res, 'Please enter a valid email address.')
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters.')
  if (db().users.some(u => u.email === email)) return bad(res, 'An account with this email already exists.', 409)
  const user = newUser({ name, email, password })
  db().users.push(user)
  save()
  res.status(201).json({ ok: true, token: issueToken(user.id), user: publicUser(user) })
})

api.post('/auth/login', limit(15), (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const user = db().users.find(u => u.email === email)
  if (!user || !verifyPassword(password, user.passwordHash)) return bad(res, 'Incorrect email or password.', 401)
  res.json({ ok: true, token: issueToken(user.id), user: publicUser(user) })
})

api.get('/account/me', requireUser, (req, res) => {
  const orders = db().orders.filter(o => o.userId === req.user.id || o.customer.email === req.user.email)
    .map(o => ({ ref: o.ref, status: o.status, item: o.item, createdAt: o.createdAt }))
  res.json({ ok: true, user: publicUser(req.user), orders })
})

api.post('/account/data-topup', requireUser, limit(10), (req, res) => {
  const gb = Number(req.body?.gb)
  const price = DATA_BUNDLES[gb]
  if (!price) return bad(res, 'Choose a bundle of 1, 5, 10 or 20 GB.')
  req.user.usage.totalGb += gb
  req.user.bill.amount += price
  save()
  res.json({ ok: true, usage: req.user.usage, bill: req.user.bill, charged: { amount: price, currency: 'ZAR' }, message: `${gb}GB added — R${price} will be on your next bill.` })
})

// ---------- support ----------
api.get('/support/topics', (_req, res) => res.json({ ok: true, topics: supportTopics }))

api.get('/support/articles', (req, res) => {
  const q = str(req.query.q, 100).toLowerCase()
  const topic = str(req.query.topic, 30)
  let list = supportArticles
  if (topic) list = list.filter(a => a.topic === topic)
  if (q) {
    const words = q.split(/\s+/).filter(w => w.length > 1)
    list = list.map(a => ({ a, score: words.reduce((s, w) => s + (a.title.toLowerCase().includes(w) ? 3 : 0) + (a.body.toLowerCase().includes(w) ? 1 : 0), 0) }))
      .filter(x => x.score > 0).sort((x, y) => y.score - x.score).map(x => x.a)
  }
  res.json({ ok: true, count: list.length, articles: list })
})

api.post('/support/tickets', limit(8), (req, res) => {
  const name = str(req.body?.name, 80)
  const email = str(req.body?.email, 160).toLowerCase()
  const topic = str(req.body?.topic, 40)
  const message = str(req.body?.message, 2000)
  if (!name) return bad(res, 'Please enter your name.')
  if (!EMAIL.test(email)) return bad(res, 'Please enter a valid email address.')
  if (message.length < 10) return bad(res, 'Please tell us a little more (at least 10 characters).')
  const ref = id('SR')
  db().tickets.push({ ref, name, email, topic, message, status: 'open', at: new Date().toISOString() })
  save()
  res.status(201).json({ ok: true, ref, message: `Ticket ${ref} created. We'll reply by email shortly.` })
})

// ---------- admin ----------
api.get('/admin/summary', requireAdmin, (_req, res) => {
  const d = db()
  res.json({
    ok: true,
    counts: { users: d.users.length, orders: d.orders.length, subscribers: d.subscribers.length, callbacks: d.callbacks.length, tickets: d.tickets.length, coverageChecks: d.coverageChecks.length },
    recentOrders: d.orders.slice(-20).reverse(),
    recentCallbacks: d.callbacks.slice(-20).reverse(),
    openTickets: d.tickets.filter(t => t.status === 'open').slice(-20).reverse(),
  })
})

// ---------- seed ----------
export function newUser({ name, email, password }) {
  const first = name.split(' ')[0]
  return {
    id: crypto.randomUUID(), name, firstName: first, email,
    initials: name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase(),
    passwordHash: hashPassword(password),
    plan: { name: 'iPhone 16 Pro · 50GB', monthly: 1099, renewsDay: 30 },
    usage: { usedGb: 17.6, totalGb: 50 },
    bill: { amount: 1099, dueDay: 26, cardLast4: '4821', autopay: true, currency: 'ZAR' },
    createdAt: new Date().toISOString(),
  }
}

export function seedDemo() {
  if (process.env.SEED_DEMO === 'false') return
  const email = 'demo@connectra.africa'
  if (!db().users.some(u => u.email === email)) {
    db().users.push(newUser({ name: 'Ama Mensah', email, password: process.env.DEMO_PASSWORD || 'Connectra2026!' }))
    save()
  }
}

export default api
