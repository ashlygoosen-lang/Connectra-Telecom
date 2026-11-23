import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode, PointerEvent as RPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { api, tokenStore } from './api'
import type { Article, CoverageResult, InternetPlan, OrderSummary, Phone, User, VoipPlan } from './api'
import { fallbackPhones, fallbackPlans, fallbackVoip, voipAreaCodes, faqs as faqData, supportTopics } from './data'
import { reducedMotion, startMotion, transition } from './motion'
import { CoverageMap, SpeedFinder, MegaMenu } from './showcase'
import { VoipPage } from './voip'

// All prices are South African Rand, VAT inclusive (en-ZA formatting: R1 099 / R1 099,00).
const zar = (n: number, cents = false) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`
const DATA_BUNDLES: [number, number][] = [[1, 85], [5, 229], [10, 349], [20, 499]]

type Page = 'home' | 'phones' | 'product' | 'internet' | 'voip' | 'voice' | 'checkout' | 'account' | 'support'
type Route = { page: Page; slug?: string }
type GoOptions = { slug?: string; anchor?: string }
export type CartItem = { type: 'phone'; slug: string; color: string; storage: string; term: number } | { type: 'internet'; planId: string }
  | { type: 'voip'; planId: string; users: number; number: { type: 'new'; areaCode: string } | { type: 'port'; portNumber: string } }
type Toast = { id: number; text: string; kind: 'ok' | 'error' }

// VINK Group parent site: injected by the server (VINK_GROUP_URL); falls back for local dev.
const VINK_GROUP_URL = (() => {
  const v = typeof document !== 'undefined' ? document.querySelector('meta[name="vink-group-url"]')?.getAttribute('content') : ''
  return v && v.startsWith('http') ? v : 'https://vink-holding-frontend-production.up.railway.app'
})()
const megaFor = (p: string) => (p === 'phones' || p === 'internet' || p === 'voip' ? p : null) as 'phones' | 'internet' | 'voip' | null
const PAGES: Page[] = ['home', 'phones', 'product', 'internet', 'voip', 'voice', 'checkout', 'account', 'support']

const navItems: [string, Page, string?][] = [
  ['Mobile Contracts', 'phones'],
  ['Home Internet', 'internet'],
  ['VoIP', 'voip'],
  ['Business', 'voice'],
  ['Deals', 'home', 'deals'],
  ['Support', 'support'],
]

// ---------- app context ----------
type Ctx = {
  route: Route
  go: (p: Page, o?: GoOptions) => void
  phones: Phone[]
  plans: InternetPlan[]
  voip: VoipPlan[]
  cart: CartItem | null
  setCart: (c: CartItem) => void
  toast: (text: string, kind?: 'ok' | 'error') => void
  openModal: (m: 'ticket' | 'track' | null) => void
}
const AppCtx = createContext<Ctx>(null!)
export const useApp = () => useContext(AppCtx)
type Go = Ctx['go']

const monthlyFor = (phone: Phone, storage: string, term: number) => phone.price + (phone.storage.find(s => s.size === storage)?.add ?? 0) + (term === 24 ? 200 : 0)

function parseRoute(): Route {
  const [, page, slug] = location.hash.replace(/^#/, '').split('/')
  return PAGES.includes(page as Page) ? { page: page as Page, slug: slug || undefined } : { page: 'home' }
}

// ---------- primitives ----------
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    signal: <><path d="M4 20h.01M8 16a6 6 0 0 1 8 0M4 12a12 12 0 0 1 16 0"/><path d="M12 20h.01"/></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 19h2"/></>,
    wifi: <><path d="M4 9a12 12 0 0 1 16 0M7 13a7.5 7.5 0 0 1 10 0M10 17a3 3 0 0 1 4 0"/><path d="M12 21h.01"/></>,
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M6 18H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h1zM18 13h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1zM18 18c0 2-2 3-4 3"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-5"/></>,
    wallet: <><path d="M3 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h12v4M16 12h5v4h-5a2 2 0 0 1 0-4z"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7z"/>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    star: <path d="m12 2 3 6 7 .9-5 4.8 1.3 7-6.3-3.3-6.3 3.3 1.3-7-5-4.8L9 8z"/>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    cart: <><path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    building: <><path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M2 21h20"/></>,
    play: <path d="m9 7 8 5-8 5z"/>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 3.4 2.5c-.9.4-.9 1.2-.9 2M12 17h.01"/></>,
    bill: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h3"/></>,
    logout: <><path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3"/></>,
    call: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Logo({ onClick }: { onClick?: () => void }) {
  return <button className="logo" onClick={onClick} aria-label="Connectra home"><span className="logo-mark"><Icon name="signal" size={25}/></span><span>Connectra</span></button>
}

type ButtonProps = { children: ReactNode; variant?: 'primary' | 'outline' | 'dark' | 'ghost'; onClick?: () => void; className?: string; type?: 'button' | 'submit'; loading?: boolean; disabled?: boolean }
export function Button({ children, variant = 'primary', onClick, className = '', type = 'button', loading, disabled }: ButtonProps) {
  return <button type={type} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} className={`btn btn-${variant} ${className}`}>{loading ? <><span className="spin" aria-hidden="true"/> Please wait</> : children}</button>
}

function SplitLine({ text, start }: { text: string; start: number }) {
  const words = text.split(' ')
  return <span className="line">{words.map((w, i) => <Fragment key={i}><span className="w"><span style={{ '--wi': start + i } as CSSProperties}>{w}</span></span>{i < words.length - 1 ? ' ' : ''}</Fragment>)}</span>
}

export function Modal({ title, text, onClose, children }: { title: string; text?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    addEventListener('keydown', onKey)
    const previous = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    return () => { removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}><h3>{title}</h3>{text && <p>{text}</p>}{children}</div>
  </div>
}

// ---------- layout ----------
function Header({ go }: { go: Go }) {
  const { route, phones, plans, voip } = useApp()
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const active = navItems.find(([, p, a]) => p === route.page && !a)?.[0] ?? (route.page === 'product' ? 'Mobile Contracts' : null)

  const place = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    const label = hover ?? active
    const btn = label ? nav.querySelector<HTMLElement>(`[data-label="${label}"]`) : null
    nav.style.setProperty('--o', btn ? '1' : '0')
    if (btn) { nav.style.setProperty('--x', `${btn.offsetLeft}px`); nav.style.setProperty('--w', `${btn.offsetWidth}px`) }
  }, [hover, active])
  useLayoutEffect(() => { place(); addEventListener('resize', place); return () => removeEventListener('resize', place) }, [place])

  const nav = (page: Page, anchor?: string) => { go(page, { anchor }); setOpen(false); setMega(null) }
  const [mega, setMega] = useState<'phones' | 'internet' | 'voip' | null>(null)
  const megaTimer = useRef<number>(0)
  const openMega = (m: 'phones' | 'internet' | 'voip' | null) => { clearTimeout(megaTimer.current); setMega(m) }
  const closeMega = () => { clearTimeout(megaTimer.current); megaTimer.current = window.setTimeout(() => setMega(null), 160) }
  useEffect(() => { setMega(null) }, [route.page, route.slug])
  return <header className="header" onMouseLeave={closeMega} onKeyDown={e => e.key === 'Escape' && setMega(null)}>
    <div className="nav shell">
      <Logo onClick={() => nav('home')}/>
      <nav ref={navRef} className={open ? 'nav-links open' : 'nav-links'} onMouseLeave={() => setHover(null)} aria-label="Main">
        {navItems.map(([label, page, anchor]) => <button key={label} data-label={label} className={label === active ? 'current' : ''} aria-current={label === active ? 'page' : undefined} onMouseEnter={() => { setHover(label); openMega(megaFor(page)) }} onFocus={() => openMega(megaFor(page))} aria-haspopup={megaFor(page) ? 'true' : undefined} aria-expanded={megaFor(page) ? mega === megaFor(page) : undefined} onClick={() => nav(page, anchor)}>{label}</button>)}
        <button data-label="Coverage" onMouseEnter={() => { setHover('Coverage'); openMega(null) }} onClick={() => nav('home', 'coverage')}>Coverage</button>
        <div className="mobile-actions"><Button variant="outline" onClick={() => nav('account')}>Log in</Button><Button onClick={() => nav('phones')}>Get connected</Button></div>
        <span className="nav-indicator" aria-hidden="true"/>
      </nav>
      <div className="nav-actions"><Button variant="ghost" onClick={() => go('account')}><Icon name="user" size={18}/> Log in</Button><Button onClick={() => go('phones')}>Get connected</Button></div>
      <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><Icon name={open ? 'close' : 'menu'}/></button>
    </div>
    <MegaMenu phones={phones} plans={plans} voip={voip} open={mega} onEnter={() => openMega(mega)} onLeave={closeMega} go={(p, slug) => { go(p as Page, { slug }); setMega(null) }}/>
  </header>
}

function Footer({ go }: { go: Go }) {
  const { toast, openModal } = useApp()
  const [vinkLogo, setVinkLogo] = useState(true)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const subscribe = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { const r = await api.subscribe(email); toast(r.message); setEmail('') }
    catch (err) { toast((err as Error).message, 'error') }
    finally { setLoading(false) }
  }
  return <footer className="footer">
    <div className="shell newsletter">
      <div><span className="eyebrow light">Stay in the loop</span><h3>Deals worth connecting for.</h3></div>
      <form className="newsletter-form" onSubmit={subscribe}><input type="email" required aria-label="Email address" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)}/><Button type="submit" loading={loading}>Subscribe</Button></form>
    </div>
    <div className="shell footer-grid">
      <div className="footer-brand"><Logo onClick={() => go('home')}/><p>Bringing people closer with reliable, affordable connections.</p><div className="socials"><span>in</span><span>f</span><span>ig</span><span>𝕏</span></div></div>
      <div><h4>Services</h4><button onClick={() => go('phones')}>Mobile contracts</button><button onClick={() => go('internet')}>Home internet</button><button onClick={() => go('voip')}>VoIP calling</button><button onClick={() => go('voice')}>Voice & business</button><button onClick={() => go('home', { anchor: 'deals' })}>SIM-only plans</button></div>
      <div><h4>Help</h4><button onClick={() => go('support')}>Support centre</button><button onClick={() => go('home', { anchor: 'coverage' })}>Check coverage</button><button onClick={() => openModal('track')}>Track my order</button><button onClick={() => openModal('ticket')}>Contact us</button></div>
      <div><h4>Connectra</h4><button>About us</button><button>Careers</button><button>Our network</button><button>Newsroom</button></div>
    </div>
    <div className="shell footer-division">
      <a className="fd-logo" href={VINK_GROUP_URL} target="_blank" rel="noopener" aria-label="Visit the VINK Group website">
        {vinkLogo ? <img src="/assets/vink-group-logo.png" alt="VINK Group" width={120} height={44} onError={() => setVinkLogo(false)}/> : <span className="fd-mark" aria-hidden="true">V</span>}
      </a>
      <p>Connectra Telecom is a division of <a href={VINK_GROUP_URL} target="_blank" rel="noopener"><b>VINK Group (Pty) Ltd</b></a>, registration number 2018/079316/07. Head office: Cape Town, South Africa.</p>
      <a className="fd-visit" href={VINK_GROUP_URL} target="_blank" rel="noopener">Visit VINK Group <Icon name="arrow" size={15}/></a>
    </div>
    <div className="shell footer-bottom"><span>© 2026 Connectra Telecom, a VINK Group company. All rights reserved. Prices in ZAR, VAT included.</span><span>Privacy · Terms · Accessibility · PAIA</span></div>
    <div className="footer-wordmark" aria-hidden="true"><span>Connectra</span></div>
  </footer>
}

export function PhoneMock({ color = '#b8c8d9', small = false, back = false }: { color?: string; small?: boolean; back?: boolean }) {
  return <div className={`phone-mock ${small ? 'small' : ''}`} style={{ '--body': color } as CSSProperties} aria-hidden="true">
    <i className="pm-key pm-key-a"/><i className="pm-key pm-key-b"/><i className="pm-key pm-key-c"/>
    <div className="camera"/>
    <div className="phone-screen"><span className="pm-time">12:42</span>{!small && <span className="pm-date">Tuesday 25 November</span>}<div className="screen-orb"/><div className="pm-dock"><i/><i/><i/><i/></div><div className="pm-glare"/></div>
    {back && <div className="pm-back"><div className="pm-lens"><i/><i/><i/></div><span className="pm-logo"/></div>}
  </div>
}

function SearchBar({ placeholder = 'Enter your address or postcode', button = 'Check coverage' }: { placeholder?: string; button?: string }) {
  const { go } = useApp()
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<CoverageResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const check = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { setResult(await api.checkCoverage(address)) }
    catch (err) { setResult(null); setError((err as Error).message) }
    finally { setLoading(false) }
  }
  return <div className="search-wrap">
    <form className="search-bar" onSubmit={check} role="search"><Icon name="map" size={20}/><input aria-label="Address or postcode" placeholder={placeholder} value={address} onChange={e => setAddress(e.target.value)}/><Button type="submit" loading={loading}>{button}</Button></form>
    {error && <p className="form-error" role="alert">{error}</p>}
    {result && <div className="coverage-result" role="status" key={result.address}>
      <header><span>{result.fibre ? 'Great news — fibre is available!' : 'Mobile coverage available'}</span><small>Up to {result.maxSpeedMbps >= 1000 ? '1 Gbps' : `${result.maxSpeedMbps} Mbps`}</small></header>
      <div className="coverage-badges">
        <span className={result.fibre ? 'yes' : ''}><Icon name={result.fibre ? 'check' : 'close'} size={13}/> Fibre</span>
        <span className={result.fiveG ? 'yes' : ''}><Icon name={result.fiveG ? 'check' : 'close'} size={13}/> 5G</span>
        <span className="yes"><Icon name="check" size={13}/> LTE</span>
        <span>{result.signal}% signal strength</span>
      </div>
      <div className="signal-meter"><i style={{ '--w': `${result.signal}%` } as CSSProperties}/></div>
      <p style={{ marginTop: 12 }}><button className="text-link" onClick={() => go('internet')} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#0b5fff', fontWeight: 700 }}>See {result.plans.length} available plan{result.plans.length === 1 ? '' : 's'} <Icon name="arrow" size={16}/></button></p>
    </div>}
  </div>
}

export function SectionHead({ eyebrow, title, text, action, onAction }: { eyebrow: string; title: string; text?: string; action?: string; onAction?: () => void }) {
  return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{action && <button className="text-link" onClick={onAction}>{action} <Icon name="arrow" size={18}/></button>}</div>
}

// ---------- home ----------
function Home({ go }: { go: Go }) {
  const { phones, plans, setCart } = useApp()
  const [chip, setChip] = useState('All phones')
  const row = phones.filter(p => chip === 'All phones' || (chip === 'Under R700/mo' ? p.price < 700 : p.brand === chip)).slice(0, 4)
  const featured = phones.find(p => p.slug === 'iphone-16-pro') ?? phones[0]
  return <>
    <section className="hero">
      <div className="hero-aurora" aria-hidden="true"><i/><i/><i/></div>
      <div className="signal-wave wave-one"/><div className="signal-wave wave-two"/>
      <div className="shell hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot"/> Built for how you live</span>
          <h1 aria-label="Stay Connected. Stay Ahead."><SplitLine text="Stay Connected." start={0}/><SplitLine text="Stay Ahead." start={2}/></h1>
          <p>Fast, reliable mobile and home internet that keeps up with every moment. Simple plans. No surprises.</p>
          <div className="hero-actions"><Button onClick={() => go('phones')}>Explore plans <Icon name="arrow" size={18}/></Button><Button variant="outline" onClick={() => go('home', { anchor: 'coverage' })}>Check coverage</Button></div>
          <div className="hero-search"><span>See what's available near you</span><SearchBar/></div>
        </div>
        <div className="hero-visual">
          <div className="hero-glow" data-depth style={{ '--depth': -14 } as CSSProperties}/>
          <div className="speed-pill" data-depth style={{ '--depth': 34 } as CSSProperties}><Icon name="bolt" size={18}/><div><b>Lightning fast</b><span>Up to 1 Gbps</span></div></div>
          <div className="coverage-pill" data-depth style={{ '--depth': 26 } as CSSProperties}><span><Icon name="signal" size={18}/></span><div><b><span data-count="98" data-suffix="%">98%</span> coverage</b><small>Nationwide network</small></div></div>
          <picture>
            <source type="image/webp" srcSet="/assets/connectra-hero-560.webp 560w, /assets/connectra-hero-1024.webp 1024w" sizes="(max-width: 760px) 340px, 465px"/>
            <img src="/assets/connectra-hero-1024.jpg" srcSet="/assets/connectra-hero-560.jpg 560w, /assets/connectra-hero-1024.jpg 1024w" sizes="(max-width: 760px) 340px, 465px" width={465} height={580} alt="Smiling Connectra customer using a smartphone" fetchPriority="high" decoding="async" data-depth style={{ '--depth': 12 } as CSSProperties}/>
          </picture>
        </div>
      </div>
    </section>

    <section className="trust-strip"><div className="shell"><span>Trusted by <b data-count="500000" data-suffix="+">500,000+</b> customers</span><span><Icon name="star" size={18}/> <b data-count="4.8" data-decimals="1">4.8</b> on Trustpilot</span><span><Icon name="shield" size={18}/> No hidden fees</span><span><Icon name="bolt" size={18}/> Same-day activation</span></div></section>

    <section className="section shell" id="deals">
      <SectionHead eyebrow="Limited-time offers" title="Deals that go further" text="More data, more speed, more value. Pick what works for you." action="View all deals" onAction={() => go('phones')}/>
      <div className="deal-grid">
        <article className="deal-card dark"><span className="badge cyan">SIM ONLY</span><h3>Unlimited everything.</h3><p>Calls, texts and 5G data. No limits, no slowdowns.</p><div className="deal-price"><sup>R</sup><b>599</b><span>/mo</span></div><Button onClick={() => go('phones')}>Get this deal</Button><div className="deal-orbits"/></article>
        <article className="deal-card featured"><span className="badge orange">MOST POPULAR</span><div className="mini-device"><PhoneMock color="#d9d6ce" small/></div><div><span className="muted-label">iPhone 16 Pro</span><h3>50GB 5G data</h3><div className="deal-price"><sup>R</sup><b>1 099</b><span>/mo</span></div><small>R999 upfront · 36 months</small><Button onClick={() => go('product', { slug: featured.slug })}>See deal <Icon name="arrow" size={17}/></Button></div></article>
        <article className="deal-card fibre"><span className="badge blue">HOME FIBRE</span><Icon name="wifi" size={46}/><h3>200 Mbps Fibre</h3><p>Stream, work and play without buffering.</p><div className="deal-price"><sup>R</sup><b>899</b><span>/mo</span></div><Button variant="outline" onClick={() => go('internet')}>Check availability</Button></article>
      </div>
    </section>

    <section className="section services-bg">
      <div className="shell"><SectionHead eyebrow="One network. Every connection." title="Everything you need to connect" text="Simple, dependable services for home, work and everywhere between."/>
        <div className="service-grid">
          {[['phone', 'Phone contracts', 'The latest smartphones with flexible data and zero surprises.', 'phones', 'blue'], ['wifi', 'Home internet', 'Fibre, 5G and LTE plans with a free premium router.', 'internet', 'cyan'], ['building', 'Voice & business', 'Clear calls and smart tools that help your business grow.', 'voice', 'orange']].map(([icon, title, text, page, color]) =>
            <article className={`service-card ${color}`} key={title}><div className="service-icon"><Icon name={icon}/></div><div><h3>{title}</h3><p>{text}</p><button onClick={() => go(page as Page)}>Explore plans <Icon name="arrow" size={17}/></button></div><div className="service-art"><Icon name={icon} size={70}/></div></article>
          )}
        </div>
      </div>
    </section>

    <section className="section shell">
      <SectionHead eyebrow="Latest phones" title="Find your next phone" text="Top technology, flexible contracts and plans built around you." action="Shop all phones" onAction={() => go('phones')}/>
      <div className="chips" role="tablist">{['All phones', 'Apple', 'Samsung', 'Google', 'Under R700/mo'].map(c => <button key={c} role="tab" aria-selected={chip === c} className={chip === c ? 'active' : ''} onClick={() => setChip(c)}>{c}</button>)}</div>
      <div className="phone-row">{row.map(phone => <PhoneCard phone={phone} key={phone.slug} go={go} badge={phone.badge}/>)}</div>
    </section>

    <section className="section internet-compare">
      <div className="shell"><SectionHead eyebrow="Home internet" title="Speed that fits your life" text="Every plan comes with unlimited usage, free installation and a Wi-Fi 6 router."/>
        <div className="plan-grid">{plans.map(p => <article className={`plan-card ${p.popular ? 'recommended' : ''}`} key={p.name}>{p.popular && <span className="recommend-label">RECOMMENDED</span>}<div className="plan-icon"><Icon name="wifi"/></div><span className="muted-label">{p.name}</span><h3>{p.speed}</h3><p>{p.note}</p><div className="plan-price"><b>{zar(p.price)}</b><span>/month</span></div><ul><li><Icon name="check" size={17}/> Unlimited data</li><li><Icon name="check" size={17}/> Free Wi-Fi 6 router</li><li><Icon name="check" size={17}/> Free installation</li></ul><Button variant={p.popular ? 'primary' : 'outline'} onClick={() => { setCart({ type: 'internet', planId: p.id }); go('checkout') }}>Choose plan</Button></article>)}</div>
      </div>
    </section>

    <section className="shell voip-band">
      <div className="vband-copy"><span className="eyebrow light">New · Connectra Voice</span><h2>Your landline, reinvented over the internet.</h2><p>Keep your number, call in HD from any device and pay from R29 a month. For homes and businesses of every size.</p>
        <div className="vband-actions"><Button onClick={() => go('voip')}>Explore VoIP plans <Icon name="arrow" size={18}/></Button><Button variant="ghost" className="vband-ghost" onClick={() => go('voice')}>Business phone systems</Button></div></div>
      <div className="vband-visual" aria-hidden="true">
        <div className="vcall"><span className="vcall-avatar">TK</span><div><b>Thabo · 021 555 0194</b><small>HD Voice · 04:12</small></div><span className="vcall-end"><Icon name="call" size={16}/></span></div>
        <div className="vwave">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--h': `${20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%`, '--i': i } as CSSProperties}/>)}</div>
        <div className="vstat"><b>R0,35</b><small>per min to landlines</small></div>
      </div>
    </section>

    <section className="section shell why">
      <SectionHead eyebrow="The Connectra difference" title="Connection without compromise" text="We sweat the details so you can simply stay connected."/>
      <div className="benefit-grid">{[['signal', 'Coverage that goes further', 'A powerful network reaching 98% of the population.'], ['wallet', 'No hidden surprises', 'Clear pricing, no bill shock and no unexpected fees.'], ['headset', 'Here when you need us', 'Real, friendly support from real people, 24/7.'], ['bolt', 'Up and running fast', 'Switch or activate in minutes, not days.']].map(([i, t, d]) => <article key={t}><span><Icon name={i}/></span><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>

    <section className="section shell coverage" id="coverage">
      <div className="coverage-copy"><span className="eyebrow light">Nationwide coverage</span><h2>See where Connectra<br/>can take you.</h2><p>From busy city streets to weekends away, our network keeps you close to what matters.</p><SearchBar/><small><span className="live-dot"/> Live coverage data updated daily</small></div>
      <div className="map-art"><CoverageMap/></div>
    </section>

    <section className="section shell">
      <SectionHead eyebrow="Loved by customers" title="Real people. Real connections."/>
      <div className="testimonial-grid">{[
        ['“Switching was incredibly easy. My number moved over in minutes and the coverage has been brilliant.”', 'AM', 'Ama Mensah', 'Accra'],
        ['“The fibre is genuinely fast, even with the whole family streaming. Support has been excellent too.”', 'TK', 'Thabo Khumalo', 'Johannesburg'],
        ['“Simple pricing and no weird charges. It is exactly what a mobile provider should be.”', 'NO', 'Nneka Okafor', 'Lagos'],
      ].map(([quote, initials, name, city]) => <article key={name}><div className="stars">★★★★★</div><p>{quote}</p><div className="person"><span>{initials}</span><div><b>{name}</b><small>{city}</small></div></div></article>)}</div>
    </section>

    <section className="shell switch-banner"><div><span className="eyebrow light">It only takes 10 minutes</span><h2>Switch today. Keep your number.</h2><p>We handle the move, so you never miss a call, message or moment.</p><Button onClick={() => go('phones')}>Make the switch <Icon name="arrow" size={18}/></Button></div><div className="switch-number"><span>Your number</span><b>082 555 0194</b><i/><div><Icon name="check"/> Number transferred</div></div></section>

    <Faq/>
    <section className="app-strip"><div className="shell"><div className="app-phone"><div><span>Good morning, Ama</span><b>32.4 <small>GB left</small></b><i/></div></div><div><span className="eyebrow">Connectra app</span><h2>Your connection,<br/>in your hands.</h2><p>Track usage, pay bills, manage plans and get support from one beautifully simple app.</p><div className="store-row"><button>● <span>Download on the<br/><b>App Store</b></span></button><button>▶ <span>GET IT ON<br/><b>Google Play</b></span></button></div></div></div></section>
  </>
}

function PhoneCard({ phone, go, badge }: { phone: Phone; go: Go; badge?: string }) {
  const open = () => go('product', { slug: phone.slug })
  return <article className="phone-card" onClick={open}><div className="phone-visual" style={{ background: phone.accent }}>{badge && <span className="badge blue">{badge}</span>}<PhoneMock color={phone.color}/></div><div className="phone-info"><span className="muted-label">{phone.brand}</span><h3>{phone.name}</h3><div className="phone-data"><Icon name="signal" size={17}/>{phone.data} 5G data</div><div className="phone-bottom"><div><small>From</small><b>{zar(phone.price)}<span>/mo</span></b></div><button aria-label={`View ${phone.name}`} onClick={e => { e.stopPropagation(); open() }}><Icon name="arrow" size={18}/></button></div></div></article>
}

function Faq() {
  const { go } = useApp()
  const [open, setOpen] = useState(0)
  return <section className="section shell faq"><div><span className="eyebrow">Good to know</span><h2>Questions, answered.</h2><p>Can't find what you need?</p><a href="#/support" onClick={e => { e.preventDefault(); go('support') }}>Visit our support centre <Icon name="arrow" size={16}/></a></div><div>{faqData.map(([q, a], i) => <article className={open === i ? 'open' : ''} key={q}><button aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}><b>{q}</b><span className="faq-icon" aria-hidden="true"/></button><div className="faq-a" id={`faq-${i}`} role="region"><div><p>{a}</p></div></div></article>)}</div></section>
}

// ---------- phones ----------
const FILTERS: [string, string[]][] = [['Brand', ['Apple', 'Samsung', 'Google', 'Xiaomi']], ['Monthly cost', ['Under R500', 'R500 – R900', 'R900+']], ['Data allowance', ['25GB', '50GB', '100GB', 'Unlimited']], ['Features', ['5G ready', 'eSIM', 'Dual SIM']]]
function matches(p: Phone, group: string, value: string) {
  if (group === 'Brand') return p.brand === value
  if (group === 'Monthly cost') return value === 'Under R500' ? p.price < 500 : value === 'R900+' ? p.price >= 900 : p.price >= 500 && p.price < 900
  if (group === 'Data allowance') return p.data === value
  return p.features.includes(value)
}

function PhonesPage({ go }: { go: Go }) {
  const { phones, route } = useApp()
  const [selected, setSelected] = useState<string[]>(() => route.slug ? [`Brand:${decodeURIComponent(route.slug)}`] : [])
  const [sort, setSort] = useState('Recommended')
  const [showFilters, setShowFilters] = useState(false)
  const toggle = (key: string) => setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key])
  const list = useMemo(() => {
    let l = phones.filter(p => FILTERS.every(([group]) => {
      const picks = selected.filter(k => k.startsWith(`${group}:`)).map(k => k.split(':')[1])
      return picks.length === 0 || picks.some(v => matches(p, group, v))
    }))
    if (sort === 'Price: low to high') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'Newest first') l = [...l].sort((a, b) => (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0))
    return l
  }, [phones, selected, sort])
  const sortSelect = (label: string) => <select aria-label={label} value={sort} onChange={e => setSort(e.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Newest first</option></select>
  return <><PageHero eyebrow="Mobile contracts" title="Your next phone is here." text="The latest devices, generous data and flexible contracts. All on a network built to move." icon="phone"/>
    <main className="section shell listing"><aside className={`filters ${showFilters ? 'show' : ''}`}><div><h3>Filter phones</h3><button className="clear" onClick={() => setSelected([])}>Clear all</button></div>{FILTERS.map(([group, values]) => <section key={group}><h4>{group}<span>⌃</span></h4>{values.map(v => <label key={v}><input type="checkbox" checked={selected.includes(`${group}:${v}`)} onChange={() => toggle(`${group}:${v}`)}/><span/>{v}</label>)}</section>)}</aside>
      <div className="products"><div className="listing-top"><div><b>{list.length} phone{list.length === 1 ? '' : 's'}</b><span> found</span></div>{sortSelect('Sort products')}</div><div className="mobile-filter"><Button variant="outline" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Hide filters' : `Filters${selected.length ? ` (${selected.length})` : ''}`}</Button>{sortSelect('Sort products (mobile)')}</div>
        {list.length ? <div className="product-grid">{list.map(p => <PhoneCard key={p.slug} phone={p} go={go} badge={p.badge}/>)}</div> : <div className="empty-state"><h3>No phones match those filters</h3><p>Try removing a filter to see more options.</p><Button variant="outline" onClick={() => setSelected([])}>Clear filters</Button></div>}
      </div>
    </main><CtaBand title="Not sure which phone is right?" text="Answer a few quick questions and we'll help you find your perfect match." button="Find my phone" onClick={() => go('home', { anchor: 'deals' })}/></>
}

export function PageHero({ eyebrow, title, text, icon }: { eyebrow: string; title: string; text: string; icon: string }) {
  return <section className="page-hero"><div className="shell"><div><span className="eyebrow light">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div><span className="page-hero-icon"><Icon name={icon} size={80}/></span></div></section>
}

function ProductPage({ go }: { go: Go }) {
  const { phones, route, setCart } = useApp()
  const phone = phones.find(p => p.slug === route.slug) ?? phones[0]
  return <ProductDetail key={phone.slug} phone={phone} go={go} onAdd={(c) => { setCart(c); go('checkout') }}/>
}

function ProductDetail({ phone, go, onAdd }: { phone: Phone; go: Go; onAdd: (c: CartItem) => void }) {
  const [term, setTerm] = useState(36)
  const [storage, setStorage] = useState(phone.storage.find(s => s.add === 0)?.size ?? phone.storage[0].size)
  const [color, setColor] = useState(phone.colors[0].name)
  const hex = phone.colors.find(c => c.name === color)?.hex ?? phone.color
  const monthly = monthlyFor(phone, storage, term)
  return <main className="product-detail shell"><button className="back" onClick={() => go('phones')}>‹ Back to all phones</button><div className="detail-grid">
    <div className="gallery"><div className="thumbs">{phone.colors.slice(0, 2).map(c => <button key={c.name} className={color === c.name ? 'active' : ''} onClick={() => setColor(c.name)} aria-label={c.name}><PhoneMock color={c.hex} small/></button>)}<button aria-label="Play video"><Icon name="play"/></button></div><Device360 key={color} color={hex} badge={phone.badge}/></div>
    <div className="detail-info"><span className="muted-label">{phone.brand.toUpperCase()}</span><h1>{phone.name}</h1><div className="rating"><span>★★★★★</span> {phone.rating} ({phone.reviews} reviews)</div><p className="detail-lead">{phone.lead}</p>
      <Selector label="Colour" value={color}><div className="color-options">{phone.colors.map(c => <button key={c.name} aria-label={c.name} aria-pressed={color === c.name} className={color === c.name ? 'active' : ''} onClick={() => setColor(c.name)} style={{ background: c.hex }}/>)}</div></Selector>
      <Selector label="Storage" value={storage}><div className="option-row">{phone.storage.map(s => <button className={storage === s.size ? 'active' : ''} onClick={() => setStorage(s.size)} key={s.size}>{s.size}</button>)}</div></Selector>
      <Selector label="Contract term" value=""><div className="option-row">{[24, 36].map(t => <button className={term === t ? 'active' : ''} onClick={() => setTerm(t)} key={t}>{t} months{t === 36 && <small>Lowest monthly</small>}</button>)}</div></Selector>
      <div className="included"><b>Your plan includes</b><div><span><Icon name="signal"/> {phone.data} 5G data</span><span><Icon name="phone"/> Unlimited calls & texts</span></div></div>
      <div className="summary"><div><span>Monthly payment</span><b key={monthly} className="price-tick">{zar(monthly)}<small>/mo</small></b><small>{phone.upfront ? `${zar(phone.upfront)} upfront` : 'No upfront cost'} · Includes device + plan</small></div><Button onClick={() => onAdd({ type: 'phone', slug: phone.slug, color, storage, term })}><Icon name="cart" size={18}/> Add to cart</Button></div>
    </div>
  </div></main>
}

function Device360({ color, badge }: { color: string; badge?: string }) {
  const [angle, setAngle] = useState(0)
  const [spin, setSpin] = useState(false)
  const drag = useRef<{ x: number; a: number } | null>(null)
  const down = (e: RPointerEvent) => { if (spin) return; drag.current = { x: e.clientX, a: angle }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
  const move = (e: RPointerEvent) => { if (drag.current) setAngle(drag.current.a + (e.clientX - drag.current.x) * 0.9) }
  const up = () => { if (!drag.current) return; drag.current = null; setAngle(a => Math.round(a / 180) * 180) }
  const play = () => { if (reducedMotion()) { setAngle(a => a + 180); return } setSpin(true); setTimeout(() => setSpin(false), 1900) }
  return <div className="main-device" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} data-dragging={drag.current ? 'true' : undefined}>
    {badge && <span className="badge blue">{badge.toUpperCase()}</span>}
    <div className="device-floor" aria-hidden="true"/>
    <div className={`device-swap ${spin ? 'spinning' : ''}`} style={{ '--ry': `${angle}deg` } as CSSProperties}><PhoneMock color={color} back/></div>
    <button type="button" className="device-360" onClick={play}><Icon name="play" size={14}/> View in 360° <small>or drag to rotate</small></button>
  </div>
}

function Selector({ label, value, children }: { label: string; value: string; children: ReactNode }) { return <div className="selector"><div><b>{label}</b><span>{value}</span></div>{children}</div> }

// ---------- internet & voice ----------
function InternetPage({ go }: { go: Go }) {
  const { plans, setCart } = useApp()
  return <><PageHero eyebrow="Home internet" title="Fast feels different." text="Reliable fibre, 5G and LTE internet for every home, every stream and every big idea." icon="wifi"/><section className="availability" id="availability"><div className="shell"><div><span className="eyebrow">Find your connection</span><h2>What's available at your address?</h2></div><SearchBar button="Check availability"/></div></section><SpeedFinder plans={plans} onChoose={(id) => { setCart({ type: 'internet', planId: id }); go('checkout') }}/><section className="section shell"><SectionHead eyebrow="Choose your speed" title="Plans made for real life" text="Unlimited data, clear monthly pricing and everything you need to get online."/><div className="plan-grid">{plans.map(p => <article className={`plan-card ${p.popular ? 'recommended' : ''}`} key={p.name}>{p.popular && <span className="recommend-label">BEST VALUE</span>}<div className="plan-icon"><Icon name="wifi"/></div><span className="muted-label">{p.name}</span><h3>{p.speed}</h3><p>{p.note}</p><div className="plan-price"><b>{zar(p.price)}</b><span>/month</span></div><ul><li><Icon name="check" size={17}/> Unlimited usage</li><li><Icon name="check" size={17}/> Wi-Fi 6 router included</li><li><Icon name="check" size={17}/> Free setup</li></ul><Button variant={p.popular ? 'primary' : 'outline'} onClick={() => { setCart({ type: 'internet', planId: p.id }); go('checkout') }}>Choose this plan</Button></article>)}</div></section><section className="section speed-guide"><div className="shell"><div><span className="eyebrow">Speed, explained</span><h2>How fast is fast enough?</h2><p>Your ideal speed depends on how many people and devices share your connection.</p></div><div className="speed-bars">{[['50 Mbps', 'Browsing & HD streaming', '45%'], ['200 Mbps', 'Families & 4K streaming', '72%'], ['500 Mbps', 'Gaming & connected homes', '100%']].map(([s, t, w]) => <article key={s}><div><b>{s}</b><span>{t}</span></div><i><em style={{ width: w }}/></i></article>)}</div></div></section><CtaBand title="A better Wi-Fi experience, included." text="Every fibre plan comes with a powerful Wi-Fi 6 router to cover more of your home." button="Check my address" onClick={() => go('internet', { anchor: 'availability' })}/></>
}

function VoicePage() {
  const { toast, go } = useApp()
  const [email, setEmail] = useState('')
  const [size, setSize] = useState('1–10 employees')
  const [solution, setSolution] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const pick = (s: string) => { setSolution(s); formRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }); setTimeout(() => formRef.current?.querySelector('input')?.focus({ preventScroll: true }), 500) }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { const r = await api.requestCallback({ email, companySize: size, solution }); toast(`${r.message} (Ref ${r.ref})`); setEmail(''); setSolution('') }
    catch (err) { toast((err as Error).message, 'error') }
    finally { setLoading(false) }
  }
  return <><PageHero eyebrow="Voice & business" title="Clearer conversations. Smarter business." text="Flexible voice solutions and connected tools that help your team work better, wherever business takes you." icon="building"/><section className="section shell"><SectionHead eyebrow="Solutions that scale" title="Built around your business"/><div className="business-grid">{[['phone', 'Business mobile', 'Flexible team plans with shared data, simple admin and the latest devices.'], ['call', 'Cloud voice (VoIP)', 'A professional phone system in the cloud. Keep every team member connected.'], ['wifi', 'Business internet', 'Priority support and resilient fibre with speeds up to 1 Gbps.']].map(([i, t, d]) => <article key={t}><span><Icon name={i} size={30}/></span><h3>{t}</h3><p>{d}</p><ul><li><Icon name="check" size={16}/> Simple monthly billing</li><li><Icon name="check" size={16}/> Dedicated support</li><li><Icon name="check" size={16}/> Scale anytime</li></ul><Button variant="outline" onClick={() => t.startsWith('Cloud voice') ? go('voip') : pick(t)}>Learn more</Button></article>)}</div></section><section className="business-quote"><div className="shell"><div><span className="eyebrow light">Let's talk business</span><h2>Tell us where you're going.<br/>We'll help you connect the way.</h2><p>Our connectivity specialists will build a plan around your team.</p></div><form ref={formRef} onSubmit={submit}>{solution && <span className="badge blue" style={{ justifySelf: 'start' }}>{solution}</span>}<label>Work email<input type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}/></label><label>Company size<select value={size} onChange={e => setSize(e.target.value)}><option>1–10 employees</option><option>11–50 employees</option><option>51+ employees</option></select></label><Button type="submit" loading={loading}>Request a callback</Button></form></div></section></>
}

// ---------- checkout ----------
function Checkout({ go }: { go: Go }) {
  const { cart, phones, plans, voip, toast } = useApp()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [details, setDetails] = useState({ firstName: '', lastName: '', email: '', mobile: '' })
  const [verify, setVerify] = useState<'idle' | 'checking' | 'done'>('idle')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [placed, setPlaced] = useState<{ ref: string } | null>(null)

  const item = useMemo(() => {
    const c: CartItem = cart ?? { type: 'phone', slug: 'iphone-16-pro', color: 'Natural Titanium', storage: '256GB', term: 36 }
    if (c.type === 'voip') {
      const plan = voip.find(p => p.id === c.planId) ?? voip[0]
      const num = c.number.type === 'port' ? `Keeping ${c.number.portNumber}` : `New ${c.number.areaCode} number (${voipAreaCodes.find(a => a.code === (c.number as { areaCode: string }).areaCode)?.area ?? ''})`
      return { cart: c, brand: 'CONNECTRA VOICE · VoIP', name: plan.name, detail: <>{plan.perUser ? `${c.users} user${c.users > 1 ? 's' : ''} · ` : ''}{num}<br/>Month-to-month · Billed per second</>, monthly: plan.price * (plan.perUser ? c.users : 1), upfront: 0, color: '', icon: 'call', back: () => go('voip') }
    }
    if (c.type === 'internet') {
      const plan = plans.find(p => p.id === c.planId) ?? plans[1]
      return { cart: c, brand: 'HOME INTERNET', name: plan.name, detail: <>{plan.speed} · Unlimited usage<br/>Wi-Fi 6 router · Free installation</>, monthly: plan.price, upfront: 0, color: '', icon: 'wifi', back: () => go('internet') }
    }
    const phone = phones.find(p => p.slug === c.slug) ?? phones[0]
    return { cart: c, brand: phone.brand.toUpperCase(), name: phone.name, detail: <>{c.color} · {c.storage}<br/>{phone.data} 5G data · {c.term} months</>, monthly: monthlyFor(phone, c.storage, c.term), upfront: phone.upfront, color: phone.colors.find(x => x.name === c.color)?.hex ?? phone.color, icon: 'phone', back: () => go('product', { slug: phone.slug }) }
  }, [cart, phones, plans, voip, go])

  const move = (to: number) => { setError(''); setDir(to > step ? 'fwd' : 'back'); setStep(to) }
  const next = async () => {
    if (step === 2) {
      if (!details.firstName.trim() || !details.lastName.trim()) return setError('Please enter your first and last name.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email)) return setError('Please enter a valid email address.')
      if (details.mobile.replace(/\D/g, '').length < 9) return setError('Please enter a valid mobile number.')
    }
    if (step === 3 && verify !== 'done') return setError('Please complete the ID check to continue.')
    if (step < 4) return move(step + 1)
    const digits = card.number.replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) return setError('Please enter a valid card number.')
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(card.expiry)) return setError('Expiry should look like MM / YY.')
    if (!/^\d{3,4}$/.test(card.cvc)) return setError('Please enter the 3 or 4 digit security code.')
    setLoading(true); setError('')
    try {
      const c = item.cart
      // Only the last four card digits leave the browser; payment is completed by the gateway.
      const body = c.type === 'voip'
        ? { type: 'voip', planId: c.planId, users: c.users, number: c.number, customer: details, payment: { last4: digits.slice(-4) } }
        : c.type === 'internet'
        ? { type: 'internet', planId: c.planId, customer: details, payment: { last4: digits.slice(-4) } }
        : { type: 'phone', phoneSlug: c.slug, color: c.color, storage: c.storage, term: c.term, customer: details, payment: { last4: digits.slice(-4) } }
      const r = await api.placeOrder(body)
      setCard({ number: '', expiry: '', cvc: '' })
      setPlaced({ ref: r.order.ref })
      toast(`Order ${r.order.ref} placed — confirmation sent to ${details.email}`)
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }
  const runCheck = () => { setVerify('checking'); setTimeout(() => setVerify('done'), 1400) }
  const field = (key: keyof typeof details, label: string, props: Record<string, string> = {}, full = false) =>
    <label className={full ? 'full' : ''}>{label}<input {...props} value={details[key]} onChange={e => setDetails({ ...details, [key]: e.target.value })}/></label>

  return <main className="checkout-page"><div className="checkout-top shell"><Logo onClick={() => go('home')}/><span>Secure checkout <Icon name="shield" size={17}/></span></div>
    <div className="steps shell" style={{ '--fill': placed ? 1 : (step - 1) / 3 } as CSSProperties}>{['Plan', 'Details', 'ID verification', 'Payment'].map((s, i) => <div className={step >= i + 1 || placed ? 'active' : ''} key={s}><i>{step > i + 1 || placed ? <Icon name="check" size={14}/> : i + 1}</i><span>{s}</span></div>)}</div>
    <div className="checkout-content shell"><section className="checkout-form">
      {placed ? <div className="step-panel"><div className="success-check"><Icon name="check" size={38}/></div><span className="eyebrow">Order confirmed</span><h1>You're connected, {details.firstName}!</h1><p>Your order reference is <b>{placed.ref}</b>. We've emailed the details to {details.email}. {item.cart.type === 'voip' ? (item.cart.number.type === 'port' ? 'We\'ve started moving your number — it usually takes 3 to 5 working days. Your setup details are on their way.' : 'Your new number and setup details are on their way. Your line will be live within minutes.') : 'Delivery is free and usually takes 1–2 working days.'}</p><div className="checkout-nav"><Button variant="ghost" onClick={() => go('home')}>Back to home</Button><Button onClick={() => go('account')}>Go to my account <Icon name="arrow" size={17}/></Button></div></div>
      : <div className={`step-panel ${dir === 'back' ? 'back' : ''}`} key={step}>
        <span className="eyebrow">Step {step} of 4</span><h1>{['Review your plan', 'Your details', 'Verify your identity', 'Payment details'][step - 1]}</h1><p>{step === 1 ? 'Make sure everything looks right before you continue.' : 'Your information is protected and only used to set up your service.'}</p>
        {step === 1 ? <div className="cart-item"><div className="cart-phone">{item.color ? <PhoneMock color={item.color} small/> : <Icon name={item.icon} size={40}/>}</div><div><span className="muted-label">{item.brand}</span><h3>{item.name}</h3><p>{item.detail}</p><button onClick={item.back}>Edit plan</button></div><b>{zar(item.monthly)}<small>/mo</small></b></div>
        : step === 2 ? <div className="form-grid">{field('firstName', 'First name', { placeholder: 'First name', autoComplete: 'given-name' })}{field('lastName', 'Last name', { placeholder: 'Last name', autoComplete: 'family-name' })}{field('email', 'Email address', { type: 'email', placeholder: 'you@example.com', autoComplete: 'email' }, true)}{field('mobile', 'Mobile number', { type: 'tel', placeholder: '+27 00 000 0000', autoComplete: 'tel' }, true)}</div>
        : step === 3 ? <div className="verify-box"><Icon name={verify === 'done' ? 'check' : 'shield'} size={42}/><h3>{verify === 'done' ? 'Identity verified' : 'Quick and secure verification'}</h3><p>{verify === 'done' ? 'Thanks — you can continue to payment.' : 'Have your ID document ready. This usually takes under two minutes.'}</p>{verify !== 'done' && <Button variant="outline" loading={verify === 'checking'} onClick={runCheck}>Start ID check</Button>}</div>
        : <div className="form-grid"><label className="full">Card number<input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.number} onChange={e => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 23) })}/></label><label>Expiry<input autoComplete="cc-exp" placeholder="MM / YY" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value.slice(0, 7) })}/></label><label>Security code<input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}/></label></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="checkout-nav"><Button variant="ghost" onClick={() => step > 1 ? move(step - 1) : item.back()}>Back</Button><Button onClick={next} loading={loading}>{step === 4 ? 'Place order' : 'Continue'} <Icon name="arrow" size={17}/></Button></div>
      </div>}
    </section><aside className="order-summary"><h3>Order summary</h3><div><span>Monthly total</span><b>{zar(item.monthly, true)}</b></div><div><span>Upfront today</span><b>{zar(item.upfront, true)}</b></div><div><span>{item.cart.type === 'voip' ? 'Activation' : 'Delivery'}</span><b className="success">Free</b></div><hr/><div><span>Due today</span><b>{zar(item.upfront, true)}</b></div><p><Icon name="shield" size={17}/> 14-day return promise</p><p style={{ marginTop: 8 }}>All prices in ZAR, VAT included.</p></aside></div></main>
}

// ---------- account ----------
function Account({ go }: { go: Go }) {
  const { toast } = useApp()
  const [data, setData] = useState<{ user: User; orders: OrderSummary[] } | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())
  const [topUp, setTopUp] = useState(false)
  const load = useCallback(() => {
    if (!tokenStore.get()) { setLoading(false); return }
    api.me().then(setData).catch(() => { tokenStore.set(null); setData(null) }).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])
  const logout = () => { tokenStore.set(null); setData(null); toast('You have been logged out.') }

  const bar = <div className="account-bar"><div className="shell"><Logo onClick={() => go('home')}/><div><button onClick={() => go('support')}><Icon name="help"/> Help</button>{data && <button onClick={logout}><Icon name="logout" size={18}/> Log out</button>}{data && <span>{data.user.initials}</span>}</div></div></div>
  if (loading) return <main className="account-page">{bar}<div className="shell auth-card" style={{ textAlign: 'center' }}><span className="spin" style={{ display: 'inline-block', color: '#0b5fff' }}/></div></main>
  if (!data) return <main className="account-page">{bar}<div className="shell"><AuthCard onDone={load}/></div></main>

  const { user, orders } = data
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const left = Math.max(0, user.usage.totalGb - user.usage.usedGb)
  const leftPct = Math.round((left / user.usage.totalGb) * 100)
  const month = now.toLocaleDateString('en-US', { month: 'long' })
  const short = now.toLocaleDateString('en-GB', { month: 'short' })
  const daysLeft = Math.max(1, user.plan.renewsDay - now.getDate())
  const buy = async (gb: number) => {
    try { const r = await api.topUp(gb); setData({ ...data, user: { ...user, usage: r.usage, bill: r.bill ?? user.bill } }); toast(r.message); setTopUp(false) }
    catch (err) { toast((err as Error).message, 'error') }
  }
  return <main className="account-page">{bar}
    <div className="shell account-welcome"><div><span>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</span><h1>{greeting}, {user.firstName}.</h1><p>Here's how your Connectra account is looking.</p></div><Button variant="outline" onClick={() => go('phones')}>Manage plan</Button></div>
    <div className="shell dashboard-grid">
      <article className="usage-card"><div className="card-head"><div><span className="eyebrow">Mobile data</span><h3>{month} usage</h3></div><span>{daysLeft} days left</span></div><div className="usage-content"><div className="ring" style={{ '--target': leftPct } as CSSProperties}><div><b>{left.toFixed(1)}</b><span>GB left</span></div></div><div><p>Used <b>{user.usage.usedGb} GB</b> of {user.usage.totalGb} GB</p><i><em style={{ width: `${100 - leftPct}%` }}/></i><small>Renews {user.plan.renewsDay} {short}</small></div></div><button onClick={() => setTopUp(true)}>Buy more data <Icon name="chevron" size={16}/></button></article>
      <article className="bill-card"><div className="card-head"><div><span className="eyebrow">Current bill</span><h3>Due {user.bill.dueDay} {short}</h3></div><Icon name="bill" size={26}/></div><b className="big-price">{zar(user.bill.amount, true)}</b><span>{user.bill.autopay ? `Paid automatically with •••• ${user.bill.cardLast4}` : 'Not yet paid'}</span><Button onClick={() => toast('Your bill is set to autopay — nothing to do this month.')}>View & pay bill</Button></article>
      <article className="quick-card"><span className="eyebrow">Quick actions</span><div>{[['signal', 'Buy data'], ['phone', 'Manage SIM'], ['bill', 'View bills'], ['headset', 'Get help']].map(([i, t]) => <button key={t} onClick={() => t === 'Get help' ? go('support') : t === 'Buy data' ? setTopUp(true) : toast(`${t} is available in the Connectra app.`)}><span><Icon name={i}/></span>{t}</button>)}</div></article>
      <article className="upgrade-card"><div><span className="badge cyan">JUST FOR YOU</span><h3>More data. Same great plan.</h3><p>Upgrade to 100GB for just R99 more a month.</p><Button onClick={() => buy(20)}>See my offer</Button></div><PhoneMock color="#b8c8d9" small/></article>
    </div>
    <div className="shell"><div className="order-list"><h3>Your orders</h3>{orders.length ? <ul>{orders.slice().reverse().map(o => <li key={o.ref}><div><b>{o.item.name}</b><br/><small>{o.item.detail}</small></div><div style={{ textAlign: 'right' }}><b>{o.ref}</b><br/><small>{o.status} · {zar(o.item.monthly)}/mo</small></div></li>)}</ul> : <p style={{ fontSize: 12 }}>No orders yet. <button className="text-link" style={{ color: '#0b5fff', fontWeight: 700 }} onClick={() => go('phones')}>Browse phones</button></p>}</div></div>
    {topUp && <Modal title="Buy more data" text="Bundles are added instantly and last until your plan renews." onClose={() => setTopUp(false)}><div className="option-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>{DATA_BUNDLES.map(([gb, price]) => <Button key={gb} variant="outline" onClick={() => buy(gb)}>{gb}GB · {zar(price)}</Button>)}</div></Modal>}
  </main>
}

function AuthCard({ onDone }: { onDone: () => void }) {
  const { toast } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const r = mode === 'login' ? await api.login(form.email, form.password) : await api.register(form.name, form.email, form.password)
      tokenStore.set(r.token)
      toast(mode === 'login' ? `Welcome back, ${r.user.firstName}.` : `Welcome to Connectra, ${r.user.firstName}!`)
      onDone()
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }
  return <div className="auth-card"><span className="eyebrow">My Connectra</span><h1>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</h1><p>{mode === 'login' ? 'Track usage, pay bills and manage your plans.' : 'It takes less than a minute.'}</p>
    <form onSubmit={submit}>
      {mode === 'register' && <label>Full name<input required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>}
      <label>Email address<input type="email" required autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
      <label>Password<input type="password" required minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" loading={loading}>{mode === 'login' ? 'Log in' : 'Create account'} <Icon name="arrow" size={17}/></Button>
    </form>
    <p className="auth-switch">{mode === 'login' ? <>New to Connectra? <button onClick={() => setMode('register')}>Create an account</button></> : <>Already a customer? <button onClick={() => setMode('login')}>Log in</button></>}</p>
    {mode === 'login' && <p className="auth-hint">Demo account: demo@connectra.africa</p>}
  </div>
}

// ---------- support ----------
function Support() {
  const { openModal } = useApp()
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const [results, setResults] = useState<Article[] | null>(null)
  const [loading, setLoading] = useState(false)
  const search = async (query: string, t = '') => {
    setLoading(true)
    try { setResults(await api.searchArticles(query, t)) } catch { setResults([]) } finally { setLoading(false) }
  }
  const pickTopic = (id: string) => { setTopic(id); setQ(''); search('', id); scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }) }
  return <><section className="support-hero"><div className="shell"><span className="eyebrow light">Connectra support</span><h1>How can we help?</h1><p>Search our guides or choose a topic below.</p><form className="support-search" role="search" onSubmit={e => { e.preventDefault(); setTopic(''); search(q) }}><Icon name="search"/><input aria-label="Search help articles" placeholder="Search for help, e.g. “activate my SIM”" value={q} onChange={e => setQ(e.target.value)}/><Button type="submit" loading={loading}>Search</Button></form>
    {results && <div className="article-results" role="region" aria-live="polite">{results.length ? results.map(a => <article key={a.id}><h4>{a.title}</h4><p>{a.body}</p></article>) : <article><h4>No articles found</h4><p>Try different words, or start a chat with our team below.</p></article>}</div>}
  </div></section><section className="section shell"><SectionHead eyebrow="Browse by topic" title="Help starts here"/><div className="topic-grid">{supportTopics.map(({ id, icon, title, text }) => <article key={id} className={topic === id ? 'active' : ''} role="button" tabIndex={0} onClick={() => pickTopic(id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pickTopic(id))}><span><Icon name={icon}/></span><div><h3>{title}</h3><p>{text}</p></div><Icon name="chevron"/></article>)}</div></section><section className="shell contact-strip"><div><span><Icon name="headset"/></span><div><h3>Still need a hand?</h3><p>Our friendly support team is here 24/7.</p></div></div><div><Button variant="outline" onClick={() => openModal('ticket')}>Start a live chat</Button><Button onClick={() => { location.href = 'tel:+27800266328' }}>Call us</Button></div></section><Faq/></>
}

function TicketModal({ onClose }: { onClose: () => void }) {
  const { toast } = useApp()
  const [f, setF] = useState({ name: '', email: '', topic: 'Mobile & SIM', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { const r = await api.createTicket(f); toast(r.message); onClose() } catch (err) { setError((err as Error).message) } finally { setLoading(false) }
  }
  return <Modal title="Talk to our team" text="Send us a message and a real person will get back to you, usually within the hour." onClose={onClose}>
    <form onSubmit={submit}>
      <label>Your name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })}/></label>
      <label>Email<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/></label>
      <label>Topic<select value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })}>{supportTopics.map(t => <option key={t.id}>{t.title}</option>)}</select></label>
      <label>How can we help?<textarea required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })}/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={loading}>Send message</Button></div>
    </form>
  </Modal>
}

function TrackModal({ onClose }: { onClose: () => void }) {
  const [ref, setRef] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setStatus('')
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(ref.trim())}?email=${encodeURIComponent(email.trim())}`)
      const d = await res.json()
      setStatus(d.ok ? `${d.order.item.name}: ${d.order.status} (placed ${new Date(d.order.createdAt).toLocaleDateString()})` : d.error)
    } catch { setStatus('We could not reach Connectra right now.') } finally { setLoading(false) }
  }
  return <Modal title="Track my order" text="Enter the reference from your confirmation email." onClose={onClose}>
    <form onSubmit={submit}>
      <label>Order reference<input required placeholder="CN-AB12CD" value={ref} onChange={e => setRef(e.target.value)}/></label>
      <label>Email used at checkout<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
      {status && <p className="auth-hint" role="status">{status}</p>}
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Close</Button><Button type="submit" loading={loading}>Track</Button></div>
    </form>
  </Modal>
}

function CtaBand({ title, text, button, onClick }: { title: string; text: string; button: string; onClick?: () => void }) { return <section className="cta-band"><div className="shell"><div><h2>{title}</h2><p>{text}</p></div><Button onClick={onClick}>{button} <Icon name="arrow" size={17}/></Button></div></section> }

// ---------- intro loader ----------
function Loader() {
  const [state, setState] = useState<'show' | 'done' | 'gone'>(() => {
    let seen = false
    try { seen = sessionStorage.getItem('connectra.intro') === '1' } catch { /* ignore */ }
    return reducedMotion() || seen ? 'gone' : 'show'
  })
  useEffect(() => {
    const root = document.documentElement
    if (state === 'gone') { root.classList.add('is-loaded'); return }
    if (state === 'show') {
      const t = setTimeout(() => { setState('done'); root.classList.add('is-loaded'); try { sessionStorage.setItem('connectra.intro', '1') } catch { /* ignore */ } }, 1300)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setState('gone'), 1000)
    return () => clearTimeout(t)
  }, [state])
  if (state === 'gone') return null
  return <div className={`loader ${state === 'done' ? 'done' : ''}`} aria-hidden="true"><div className="loader-inner"><span className="loader-mark"><Icon name="signal" size={34}/></span><span className="loader-word"><span>Connectra</span></span><span className="loader-bar"><i/></span></div></div>
}

// ---------- app ----------
export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute)
  const routeRef = useRef(route)
  routeRef.current = route
  const [phones, setPhones] = useState<Phone[]>(fallbackPhones)
  const [plans, setPlans] = useState<InternetPlan[]>(fallbackPlans)
  const [voip, setVoip] = useState<VoipPlan[]>(fallbackVoip)
  const [cart, setCartState] = useState<CartItem | null>(() => { try { return JSON.parse(sessionStorage.getItem('connectra.cart') || 'null') } catch { return null } })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<'ticket' | 'track' | null>(null)

  useLayoutEffect(() => { startMotion() }, [])
  useEffect(() => {
    api.phones().then(p => p.length && setPhones(p)).catch(() => {})
    api.internetPlans().then(p => p.length && setPlans(p)).catch(() => {})
    api.voipPlans().then(p => p.length && setVoip(p)).catch(() => {})
  }, [])

  const scrollToAnchor = (anchor: string) => document.getElementById(anchor)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })

  const go = useCallback<Go>((page, opts = {}) => {
    const cur = routeRef.current
    const same = cur.page === page && cur.slug === opts.slug
    const hash = `#/${page}${opts.slug ? `/${opts.slug}` : ''}`
    if (same) {
      if (opts.anchor) scrollToAnchor(opts.anchor)
      else scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
      return
    }
    const next = { page, slug: opts.slug }
    routeRef.current = next
    history.pushState(null, '', hash)
    transition(() => {
      flushSync(() => setRoute(next))
      scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    })
    if (opts.anchor) setTimeout(() => scrollToAnchor(opts.anchor!), 450)
  }, [])

  useEffect(() => {
    const onPop = () => {
      const next = parseRoute()
      const cur = routeRef.current
      if (cur.page === next.page && cur.slug === next.slug) return
      routeRef.current = next
      transition(() => { flushSync(() => setRoute(next)); scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) })
    }
    addEventListener('popstate', onPop)
    addEventListener('hashchange', onPop)
    return () => { removeEventListener('popstate', onPop); removeEventListener('hashchange', onPop) }
  }, [])

  useEffect(() => {
    const titles: Record<Page, string> = { home: 'Mobile, Home Internet & Business Voice', phones: 'Mobile Contracts', product: 'Phone details', internet: 'Home Internet', voip: 'VoIP — Voice over Internet', voice: 'Voice & Business', checkout: 'Secure Checkout', account: 'My Account', support: 'Support' }
    const phone = route.page === 'product' ? phones.find(p => p.slug === route.slug) : undefined
    document.title = `Connectra Telecom — ${phone ? phone.name : titles[route.page]}`
  }, [route, phones])

  const toast = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t.slice(-2), { id, text, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000)
  }, [])
  const setCart = useCallback((c: CartItem) => { setCartState(c); try { sessionStorage.setItem('connectra.cart', JSON.stringify(c)) } catch { /* ignore */ } }, [])

  const ctx: Ctx = { route, go, phones, plans, voip, cart, setCart, toast, openModal: setModal }
  const { page } = route
  const standalone = page === 'checkout' || page === 'account'
  return <AppCtx.Provider value={ctx}>
    <Loader/>
    <div className="scroll-progress" aria-hidden="true"/>
    {!standalone && <Header go={go}/>}
    <div className="page-wrap" id="main" tabIndex={-1} key={`${page}/${route.slug ?? ''}`}>
      {page === 'home' ? <Home go={go}/> : page === 'phones' ? <PhonesPage go={go}/> : page === 'product' ? <ProductPage go={go}/> : page === 'internet' ? <InternetPage go={go}/> : page === 'voip' ? <VoipPage/> : page === 'voice' ? <VoicePage/> : page === 'checkout' ? <Checkout go={go}/> : page === 'account' ? <Account go={go}/> : <Support/>}
    </div>
    {!standalone && <Footer go={go}/>}
    {modal === 'ticket' && <TicketModal onClose={() => setModal(null)}/>}
    {modal === 'track' && <TrackModal onClose={() => setModal(null)}/>}
    <div className="toast-stack" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`} role={t.kind === 'error' ? 'alert' : 'status'}><Icon name={t.kind === 'error' ? 'help' : 'check'} size={18}/><span>{t.text}</span></div>)}</div>
  </AppCtx.Provider>
}
