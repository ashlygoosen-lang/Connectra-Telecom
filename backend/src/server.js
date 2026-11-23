import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { load } from './db.js'
import api, { seedDemo } from './api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 4000
const DIST = process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist')

load()
seedDemo()

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      manifestSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}))
app.use(compression())
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }))
app.use(express.json({ limit: '50kb' }))

app.use('/api', api)
app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }))

// Public site address, used for absolute URLs Google needs (logo, canonical, social image).
// Set SITE_URL in production (e.g. https://connectra.co.za); otherwise it is taken from the request.
const siteUrl = (req) => (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')

app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`))
app.get('/sitemap.xml', (req, res) => {
  const base = siteUrl(req)
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>\n`)
})

if (fs.existsSync(DIST)) {
  // Re-read index.html when it changes (e.g. after a rebuild) so asset hashes are never stale.
  const indexPath = path.join(DIST, 'index.html')
  let cached = { mtime: 0, html: '' }
  const template = () => {
    const mtime = fs.statSync(indexPath).mtimeMs
    if (mtime !== cached.mtime) cached = { mtime, html: fs.readFileSync(indexPath, 'utf8') }
    return cached.html
  }
  const escapeAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const renderIndex = (req, res) => {
    res.set('Cache-Control', 'no-cache')
    res.type('html').send(template().replaceAll('%SITE_URL%', escapeAttr(siteUrl(req))))
  }
  app.get(['/', '/index.html'], renderIndex)
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '30d' }))
  app.use(express.static(DIST, { maxAge: '1d', index: false }))
  // Missing files (e.g. an image not uploaded yet) get a real 404, not the app shell.
  app.get(/\.[a-z0-9]{2,5}$/i, (_req, res) => res.status(404).end())
  app.get(/.*/, renderIndex)
} else {
  app.get('/', (_req, res) => res.send('Connectra API is running. Build the frontend (npm run build) to serve the site.'))
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid JSON body' })
  console.error(err)
  res.status(500).json({ ok: false, error: 'Something went wrong on our side.' })
})

app.listen(PORT, () => console.log(`Connectra running on http://localhost:${PORT}`))
