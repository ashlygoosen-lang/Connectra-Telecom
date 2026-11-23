// Tiny JSON-file data store. Writes are atomic (temp file + rename) and serialised.
// On Railway, mount a volume and set DATA_DIR to keep data across deploys.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const FILE = path.join(DATA_DIR, 'db.json')

const empty = () => ({ users: [], orders: [], subscribers: [], callbacks: [], tickets: [], coverageChecks: [] })

let state = empty()
let writing = Promise.resolve()

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(FILE)) {
    try { state = { ...empty(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) } }
    catch (err) { console.error('[db] could not parse db.json, starting fresh:', err.message) }
  }
  return state
}

export function db() { return state }

export function save() {
  writing = writing.then(async () => {
    const tmp = `${FILE}.${process.pid}.tmp`
    await fs.promises.writeFile(tmp, JSON.stringify(state, null, 2))
    await fs.promises.rename(tmp, FILE)
  }).catch(err => console.error('[db] write failed:', err.message))
  return writing
}
