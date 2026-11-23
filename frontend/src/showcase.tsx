// Premium interactive pieces: South Africa network map, home-internet speed finder, desktop mega menu.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { InternetPlan, Phone } from './api'
import { saMap } from './saMap'
import { Icon, PhoneMock } from './App'

const zar = (n: number) => `R${n.toLocaleString('en-ZA')}`

// ---------------------------------------------------------------------------
// Coverage map — dot-matrix South Africa, towers pulse and the network
// "switches on" outward from Johannesburg when the section scrolls into view.
// ---------------------------------------------------------------------------
type Tower = { name: string; x: number; y: number; major: boolean }

export function CoverageMap() {
  const [active, setActive] = useState<string | null>(null)
  const towers = saMap.towers as readonly Tower[]
  const byName = useMemo(() => Object.fromEntries(towers.map(t => [t.name, t])) as Record<string, Tower>, [towers])
  const hub = byName['Johannesburg']

  const dots = useMemo(() => saMap.dots.map(([x, y, l], i) =>
    <circle key={i} cx={x} cy={y} r={l === 2 ? 2.6 : l === 1 ? 2.1 : 1.7} className={`lvl${l}`} style={{ '--d': `${Math.round(Math.hypot(x - hub.x, y - hub.y) * 2.4)}ms` } as CSSProperties}/>), [hub])

  const links = useMemo(() => saMap.links.map(([a, b], i) => {
    const A = byName[a], B = byName[b]
    const len = Math.hypot(B.x - A.x, B.y - A.y)
    const d = `M${A.x} ${A.y} Q${(A.x + B.x) / 2} ${(A.y + B.y) / 2 - len * 0.2} ${B.x} ${B.y}`
    return <g key={i} style={{ '--i': i } as CSSProperties}><path className="link-base" d={d}/><path className="link-flow" d={d} pathLength={100}/></g>
  }), [byName])

  return <figure className="sa-map">
    <svg viewBox={`0 0 ${saMap.w} ${saMap.h}`} role="img" aria-labelledby="sa-map-title">
      <title id="sa-map-title">Connectra network map of South Africa showing 5G hubs in major cities and LTE coverage nationwide</title>
      <defs>
        <radialGradient id="tower-glow"><stop offset="0" stopColor="#19d3e6" stopOpacity=".55"/><stop offset="1" stopColor="#19d3e6" stopOpacity="0"/></radialGradient>
      </defs>
      <g className="map-dots">{dots}</g>
      <g className="map-links">{links}</g>
      <g className="map-towers">{towers.map(t =>
        <g key={t.name} className={`tower ${t.major ? 'major' : ''} ${active === t.name ? 'active' : ''}`} transform={`translate(${t.x} ${t.y})`}
          tabIndex={0} aria-label={`${t.name}: 5G hub`} onMouseEnter={() => setActive(t.name)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(t.name)} onBlur={() => setActive(null)}>
          <circle className="tower-glow" r="22" fill="url(#tower-glow)"/>
          {t.major && <circle className="tower-pulse" r="5"/>}
          <circle className="tower-core" r={t.major ? 4.4 : 3.2}/>
          {(t.major || active === t.name) && <g className="tower-label" transform="translate(0 -14)"><rect x={-t.name.length * 3.4 - 8} y="-11" width={t.name.length * 6.8 + 16} height="18" rx="9"/><text textAnchor="middle" y="2">{t.name}</text></g>}
        </g>)}
      </g>
    </svg>
    <figcaption className="map-legend"><span><i className="lg-5g"/>5G hubs</span><span><i className="lg-plus"/>LTE-A</span><span><i className="lg-lte"/>LTE</span></figcaption>
    <div className="map-stats">
      <div><b data-count="12">12</b><span>5G metro hubs</span></div>
      <div><b data-count="98" data-suffix="%">98%</b><span>of people covered</span></div>
    </div>
  </figure>
}

// ---------------------------------------------------------------------------
// Speed finder — recommends a fibre plan from household size and habits.
// ---------------------------------------------------------------------------
const ACTIVITIES: [string, number][] = [['Browsing & email', 3], ['HD streaming', 8], ['4K streaming', 25], ['Online gaming', 15], ['Video calls', 6], ['Working from home', 10], ['Smart home', 4]]
const GAUGE_MAX = 600

function useTween(target: number, ms = 700) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now(), a = from.current
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - p, 3)
      const v = a + (target - a) * e
      setValue(v); from.current = v
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

export function SpeedFinder({ plans, onChoose }: { plans: InternetPlan[]; onChoose: (planId: string) => void }) {
  const [people, setPeople] = useState(3)
  const [acts, setActs] = useState<string[]>(['HD streaming', 'Video calls'])
  const load = acts.reduce((sum, a) => sum + (ACTIVITIES.find(x => x[0] === a)?.[1] ?? 0), 0)
  const need = Math.min(GAUGE_MAX, Math.max(10, Math.round((people * (5 + load) * 0.8) / 5) * 5))
  const sorted = [...plans].sort((a, b) => a.mbps - b.mbps)
  const plan = sorted.find(p => p.mbps >= need) ?? sorted[sorted.length - 1]
  const shown = useTween(need)
  const pct = Math.min(1, shown / GAUGE_MAX)
  const toggle = (a: string) => setActs(s => s.includes(a) ? s.filter(x => x !== a) : [...s, a])

  return <section className="section speed-finder" aria-labelledby="sf-title">
    <div className="shell sf-grid">
      <div className="sf-controls">
        <span className="eyebrow">Speed finder</span>
        <h2 id="sf-title">Find your perfect speed in ten seconds.</h2>
        <p>Tell us who's online and what they do. We'll match you with the right fibre plan, with no guesswork and no overpaying.</p>
        <label className="sf-range">
          <span>People at home <b>{people}{people === 8 ? '+' : ''}</b></span>
          <input type="range" min={1} max={8} value={people} onChange={e => setPeople(Number(e.target.value))} style={{ '--fill': `${((people - 1) / 7) * 100}%` } as CSSProperties} aria-valuetext={`${people} people`}/>
        </label>
        <div className="sf-acts" role="group" aria-label="What do you do online?">
          <span>What do you do online?</span>
          <div>{ACTIVITIES.map(([a]) => <button type="button" key={a} aria-pressed={acts.includes(a)} className={acts.includes(a) ? 'on' : ''} onClick={() => toggle(a)}>{acts.includes(a) && <Icon name="check" size={14}/>}{a}</button>)}</div>
        </div>
      </div>
      <div className="sf-result" aria-live="polite">
        <svg className="sf-gauge" viewBox="0 0 240 140" aria-hidden="true">
          <defs><linearGradient id="sf-grad" x1="0" x2="1"><stop offset="0" stopColor="#0b5fff"/><stop offset=".6" stopColor="#19d3e6"/><stop offset="1" stopColor="#ff7a1a"/></linearGradient></defs>
          <path d="M20 125 A100 100 0 0 1 220 125" className="sf-track" pathLength={100}/>
          <path d="M20 125 A100 100 0 0 1 220 125" className="sf-fill" pathLength={100} style={{ strokeDashoffset: 100 - pct * 100 }}/>
          {[0, 0.25, 0.5, 0.75, 1].map(t => { const a = Math.PI * (1 - t); return <line key={t} x1={120 + Math.cos(a) * 82} y1={125 - Math.sin(a) * 82} x2={120 + Math.cos(a) * 90} y2={125 - Math.sin(a) * 90} className="sf-tick"/> })}
          <g style={{ transform: `rotate(${-90 + pct * 180}deg)`, transformOrigin: '120px 125px' }}><path d="M117 125 L120 45 L123 125 Z" className="sf-needle"/></g>
          <circle cx="120" cy="125" r="7" className="sf-hub"/>
        </svg>
        <div className="sf-readout"><b>{Math.round(shown)}</b><span>Mbps recommended</span></div>
        <div className="sf-plan" key={plan.id}>
          <div><small>Your match</small><h3>{plan.name}</h3><p>{plan.speed} · Unlimited · Free Wi-Fi 6 router</p></div>
          <div className="sf-price"><b>{zar(plan.price)}</b><span>/month</span></div>
          <button type="button" className="btn btn-primary" onClick={() => onChoose(plan.id)}>Choose {plan.name} <Icon name="arrow" size={17}/></button>
        </div>
      </div>
    </div>
  </section>
}

// ---------------------------------------------------------------------------
// Mega menu — desktop navigation panel for phones and home internet.
// ---------------------------------------------------------------------------
type MegaProps = { open: 'phones' | 'internet' | null; phones: Phone[]; plans: InternetPlan[]; onEnter: () => void; onLeave: () => void; go: (page: string, slug?: string) => void }

export function MegaMenu({ open, phones, plans, onEnter, onLeave, go }: MegaProps) {
  const [shown, setShown] = useState(open)
  useEffect(() => { if (open) setShown(open) }, [open])
  return <div className={`mega ${open ? 'open' : ''}`} onMouseEnter={onEnter} onMouseLeave={onLeave} aria-hidden={!open} inert={!open}>
    <div className="shell mega-inner" key={shown ?? 'none'}>
      {shown === 'phones' && <>
        <div className="mega-col">
          <span className="eyebrow">Shop by brand</span>
          {['Apple', 'Samsung', 'Google', 'Xiaomi'].map(b => <button key={b} onClick={() => go('phones', b)}>{b}<Icon name="arrow" size={16}/></button>)}
          <button className="mega-all" onClick={() => go('phones')}>View all phones <Icon name="arrow" size={16}/></button>
        </div>
        <div className="mega-cards">{phones.slice(0, 3).map(p =>
          <button key={p.slug} className="mega-card" onClick={() => go('product', p.slug)}>
            <span className="mega-visual" style={{ background: p.accent }}><PhoneMock color={p.color} small/></span>
            <span className="mega-meta"><small>{p.brand}</small><b>{p.name}</b><span>From {zar(p.price)}/mo</span></span>
          </button>)}
        </div>
        <div className="mega-promo"><span className="badge cyan">SIM ONLY</span><h4>Unlimited everything.</h4><p>Calls, texts and 5G data from <b>R599/mo</b>.</p><button className="btn btn-primary" onClick={() => go('phones')}>Get this deal</button></div>
      </>}
      {shown === 'internet' && <>
        <div className="mega-col">
          <span className="eyebrow">Home internet</span>
          <button onClick={() => go('internet')}>Fibre plans<Icon name="arrow" size={16}/></button>
          <button onClick={() => go('internet')}>Speed finder<Icon name="arrow" size={16}/></button>
          <button onClick={() => go('internet')}>Check availability<Icon name="arrow" size={16}/></button>
          <button className="mega-all" onClick={() => go('voice')}>Business internet <Icon name="arrow" size={16}/></button>
        </div>
        <div className="mega-cards">{plans.map(p =>
          <button key={p.id} className={`mega-plan ${p.popular ? 'hot' : ''}`} onClick={() => go('internet')}>
            {p.popular && <span className="badge blue">Most popular</span>}
            <Icon name="wifi" size={26}/><b>{p.speed}</b><small>{p.name}</small><span>{zar(p.price)}<em>/month</em></span>
          </button>)}
        </div>
        <div className="mega-promo"><span className="badge cyan">FREE ROUTER</span><h4>Wi-Fi 6 included.</h4><p>Free installation and unlimited usage on every fibre plan.</p><button className="btn btn-primary" onClick={() => go('internet')}>Check my address</button></div>
      </>}
    </div>
  </div>
}
