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
      connectSrc: ["'self'"],
    },
  },
}))
app.use(compression())
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }))
app.use(express.json({ limit: '50kb' }))

app.use('/api', api)
app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }))

if (fs.existsSync(DIST)) {
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }))
  app.use(express.static(DIST, { maxAge: '1h', index: false }))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
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
