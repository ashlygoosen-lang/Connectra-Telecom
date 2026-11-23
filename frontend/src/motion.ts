// Connectra motion system — one lightweight, dependency-free controller.
// Everything here only adds data-attributes / CSS variables; the visual motion lives in motion.css
// and uses transform/opacity so it stays on the GPU. Reduced-motion users get none of it.

const REVEAL = [
  '.section-head', '.chips', '.deal-card', '.service-card', '.phone-card', '.plan-card',
  '.benefit-grid article', '.testimonial-grid article', '.faq > div:first-child', '.faq > div > article',
  '.coverage-copy', '.map-art', '.switch-banner', '.app-strip .shell > div', '.trust-strip .shell > span',
  '.business-grid article', '.business-quote .shell > *', '.topic-grid article', '.contact-strip',
  '.cta-band .shell > *', '.speed-guide .shell > div:first-child', '.speed-bars article',
  '.availability .shell > *', '.filters', '.listing-top', '.dashboard-grid > article', '.account-welcome',
  '.ft-news', '.ft-main > *', '.ft-trust > div', '.ft-bottom', '.legal-summary', '.legal-section', '.detail-info > *', '.gallery', '.order-list',
  '.page-hero .shell > *', '.support-hero .shell > *', '.article-results', '.auth-card',
  '.sf-controls > *', '.sf-result', '.footer-wordmark', '.voip-perks article', '.voip-how li', '.voip-rates > *',
  '.vb-copy > *', '.vb-form', '.voip-band', '.footer-division',
].join(',')

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth > 900

let started = false

export function startMotion() {
  if (started || typeof window === 'undefined') return
  started = true
  const root = document.documentElement
  if (reducedMotion()) { root.classList.add('motion-reduce', 'is-loaded'); return }
  root.classList.add('motion-ok')
  if (finePointer()) root.classList.add('motion-fine')

  // ---------- scroll reveals ----------
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.reveal = 'in'; revealIO.unobserve(e.target) }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })

  // ---------- counters ----------
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { runCounter(e.target as HTMLElement); countIO.unobserve(e.target) }
  }, { threshold: 0.6 })

  const scan = () => {
    const els = document.querySelectorAll<HTMLElement>(REVEAL)
    els.forEach((el) => {
      if (el.dataset.reveal !== undefined) return
      // Stagger siblings that are revealed together.
      const parent = el.parentElement
      const sibs = parent ? Array.from(parent.children).filter(c => c.matches(REVEAL)) : [el]
      const i = Math.max(0, sibs.indexOf(el))
      el.style.setProperty('--rd', `${Math.min(i, 6) * 85}ms`)
      el.dataset.reveal = ''
      revealIO.observe(el)
    })
    document.querySelectorAll<HTMLElement>('[data-count]:not([data-counted])').forEach((el) => {
      el.dataset.counted = 'pending'
      el.textContent = format(0, el)
      countIO.observe(el)
    })
  }
  scan()
  // MutationObserver callbacks run before paint, so new content never flashes before being hidden.
  new MutationObserver(scan).observe(document.getElementById('root')!, { childList: true, subtree: true })

  // ---------- scroll: progress bar, header state, hero parallax ----------
  let lastY = scrollY, ticking = false
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const y = scrollY
      const max = document.documentElement.scrollHeight - innerHeight
      root.style.setProperty('--scroll', String(max > 0 ? y / max : 0))
      const header = document.querySelector<HTMLElement>('.header')
      if (header) {
        header.dataset.scrolled = y > 12 ? 'true' : 'false'
        const menuOpen = !!document.querySelector('.nav-links.open')
        header.dataset.hidden = !menuOpen && y > 420 && y > lastY + 4 ? 'true' : y < lastY - 4 || y < 420 ? 'false' : header.dataset.hidden || 'false'
      }
      if (root.classList.contains('motion-fine')) root.style.setProperty('--hero-scroll', `${Math.min(y, innerHeight * 1.2)}px`)
      lastY = y
      ticking = false
    })
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  if (!root.classList.contains('motion-fine')) return

  // ---------- desktop-only pointer effects ----------
  const cursor = document.createElement('div')
  cursor.className = 'cursor-ring'
  cursor.setAttribute('aria-hidden', 'true')
  document.body.appendChild(cursor)
  let cx = -100, cy = -100, tx = -100, ty = -100
  const loop = () => {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  let magnet: HTMLElement | null = null
  let tilt: HTMLElement | null = null

  document.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY
    const target = e.target as Element
    cursor.dataset.active = target.closest('a, button, input, select, textarea, label, [role="button"], .phone-card') ? 'true' : 'false'

    // Magnetic buttons
    const m = target.closest<HTMLElement>('.btn-primary, .btn-dark, [data-magnetic]')
    if (magnet && magnet !== m) { magnet.style.setProperty('--mx', '0px'); magnet.style.setProperty('--my', '0px') }
    magnet = m
    if (m) {
      const r = m.getBoundingClientRect()
      m.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 12}px`)
      m.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 10}px`)
    }

    // 3D tilt + spotlight cards
    const t = target.closest<HTMLElement>('.deal-card, .phone-card, .plan-card, .service-card, .business-grid article, .topic-grid article, .testimonial-grid article')
    if (tilt && tilt !== t) { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg') }
    tilt = t
    if (t) {
      const r = t.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      t.style.setProperty('--rx', `${(0.5 - py) * 6}deg`)
      t.style.setProperty('--ry', `${(px - 0.5) * 8}deg`)
      t.style.setProperty('--sx', `${px * 100}%`)
      t.style.setProperty('--sy', `${py * 100}%`)
    }

    // Hero depth (layers drift against the pointer)
    const hero = target.closest<HTMLElement>('.hero')
    if (hero) {
      const r = hero.getBoundingClientRect()
      hero.style.setProperty('--hx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3))
      hero.style.setProperty('--hy', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3))
    }
  }, { passive: true })

  document.addEventListener('pointerleave', () => { tx = -100; ty = -100 })
}

function format(n: number, el: HTMLElement) {
  const decimals = Number(el.dataset.decimals || 0)
  const value = n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return `${el.dataset.prefix || ''}${value}${el.dataset.suffix || ''}`
}

function runCounter(el: HTMLElement) {
  const target = Number(el.dataset.count)
  const start = performance.now(), duration = 1600
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(2, -10 * p)
    el.textContent = format(p === 1 ? target : target * eased, el)
    if (p < 1) requestAnimationFrame(step)
    else el.dataset.counted = 'done'
  }
  requestAnimationFrame(step)
}

// Cinematic page change: uses the View Transitions API where the browser has it.
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!reducedMotion() && doc.startViewTransition) doc.startViewTransition(update)
  else update()
}
