// Connectra Voice — Voice over Internet (VoIP) page, call-cost estimator and line configurator.
import { useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import type { VoipPlan } from './api'
import { api } from './api'
import { voipAreaCodes, voipFaqs, voipRates } from './data'
import { Button, Icon, Modal, PageHero, SectionHead, useApp } from './App'
import type { CartItem } from './App'

const zar = (n: number, cents = false) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`
const rate = (n: number) => `R${n.toFixed(2).replace('.', ',')}`

export function VoipPage() {
  const { voip, go } = useApp()
  const [config, setConfig] = useState<VoipPlan | null>(null)
  const home = voip.filter(p => p.audience === 'home')
  const business = voip.find(p => p.audience === 'business')

  return <>
    <PageHero eyebrow="Voice over Internet" title="Crystal-clear calls over your internet." text="A real landline number for home or business, carried on your fibre, LTE or 5G connection. Keep your number, cut your call costs and call from any device." icon="call"/>

    <section className="voip-perks"><div className="shell">
      {[['phone', 'Keep your number', 'Move your existing landline number to Connectra at no cost.'], ['signal', 'HD voice quality', 'Wideband audio that sounds clearer than a copper line.'], ['bolt', 'Load-shedding ready', 'Keeps working when your router is on a UPS.'], ['wifi', 'Call from anywhere', 'Desk phone, home phone, laptop or the Connectra Voice app.']].map(([i, t, d]) =>
        <article key={t}><span><Icon name={i}/></span><div><h3>{t}</h3><p>{d}</p></div></article>)}
    </div></section>

    <section className="section shell" id="voip-plans">
      <SectionHead eyebrow="Connectra Voice plans" title="Simple VoIP plans. Real savings." text="No line rental, no installation fees and no long contracts. All plans are month-to-month and billed per second."/>
      <div className="plan-grid voip-grid">{voip.map(p =>
        <article className={`plan-card ${p.popular ? 'recommended' : ''}`} key={p.id}>
          {p.popular && <span className="recommend-label">MOST POPULAR</span>}
          <div className="plan-icon"><Icon name={p.audience === 'business' ? 'building' : 'call'}/></div>
          <span className="muted-label">{p.audience === 'business' ? 'For business' : 'For home'}</span>
          <h3>{p.name}</h3><p>{p.note}</p>
          <div className="plan-price"><b>{zar(p.price)}</b><span>/{p.perUser ? 'user/month' : 'month'}</span></div>
          <ul>{p.includes.map(x => <li key={x}><Icon name="check" size={17}/> {x}</li>)}</ul>
          <Button variant={p.popular ? 'primary' : 'outline'} onClick={() => setConfig(p)}>Get {p.name}</Button>
        </article>)}
      </div>
    </section>

    <CallEstimator plans={home} onChoose={setConfig}/>

    <section className="section shell voip-how">
      <SectionHead eyebrow="How it works" title="Up and calling in three steps."/>
      <ol>{[['call', 'Choose your plan and number', 'Pick a new number in your area, or keep the landline number you already have.'], ['wifi', 'Plug in or download', 'Connect our adapter to your router and phone, or sign in to the Connectra Voice app.'], ['headset', 'Start calling', 'Your line is live within minutes. Ported numbers move over in 3 to 5 working days.']].map(([i, t, d], n) =>
        <li key={t}><span className="voip-step"><Icon name={i} size={26}/><em>{n + 1}</em></span><h3>{t}</h3><p>{d}</p></li>)}
      </ol>
    </section>

    <section className="section voip-rates-wrap"><div className="shell voip-rates">
      <div>
        <span className="eyebrow light">Call rates</span>
        <h2>Transparent rates, billed per second.</h2>
        <p>These rates apply to calls outside your plan's included minutes. You never pay for a full minute you didn't use.</p>
      </div>
      <table>
        <caption className="sr-only">Connectra Voice call rates per minute, VAT included</caption>
        <thead><tr><th scope="col">Calling</th><th scope="col">Per minute</th></tr></thead>
        <tbody>
          <tr><th scope="row">Other Connectra numbers</th><td className="free">Free</td></tr>
          <tr><th scope="row">South African landlines</th><td>{rate(voipRates.landline)}</td></tr>
          <tr><th scope="row">South African mobiles</th><td>{rate(voipRates.mobile)}</td></tr>
          <tr><th scope="row">International</th><td>from {rate(voipRates.internationalFrom)}</td></tr>
        </tbody>
        <tfoot><tr><td colSpan={2}>Rates in ZAR, VAT included. VoIP needs power and internet, so keep a mobile phone handy to call 112 or 10111 in an emergency.</td></tr></tfoot>
      </table>
    </div></section>

    {business && <BusinessVoice plan={business} onChoose={() => setConfig(business)}/>}

    <section className="section shell faq"><div><span className="eyebrow">VoIP questions</span><h2>Good to know.</h2><p>Need help setting up?</p><a href="#/support" onClick={e => { e.preventDefault(); go('support') }}>Visit our support centre <Icon name="arrow" size={16}/></a></div><VoipFaq/></section>

    {config && <VoipConfigurator plan={config} onClose={() => setConfig(null)}/>}
  </>
}

function VoipFaq() {
  const [open, setOpen] = useState(0)
  return <div>{voipFaqs.map(([q, a], i) => <article className={open === i ? 'open' : ''} key={q}><button aria-expanded={open === i} aria-controls={`vfaq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}><b>{q}</b><span className="faq-icon" aria-hidden="true"/></button><div className="faq-a" id={`vfaq-${i}`} role="region"><div><p>{a}</p></div></div></article>)}</div>
}

// ---------------------------------------------------------------------------
// Call-cost estimator — compares Voice Flex against Home Unlimited.
// ---------------------------------------------------------------------------
function CallEstimator({ plans, onChoose }: { plans: VoipPlan[]; onChoose: (p: VoipPlan) => void }) {
  const [landline, setLandline] = useState(200)
  const [mobile, setMobile] = useState(150)
  const [intl, setIntl] = useState(20)
  const flex = plans.find(p => p.id === 'voip-flex')
  const unlimited = plans.find(p => p.id === 'voip-home')
  const costs = useMemo(() => {
    const out: { plan: VoipPlan; total: number }[] = []
    if (flex) out.push({ plan: flex, total: flex.price + landline * voipRates.landline + mobile * voipRates.mobile + intl * voipRates.internationalAvg })
    if (unlimited) out.push({ plan: unlimited, total: unlimited.price + Math.max(0, mobile - 500) * voipRates.mobile + intl * voipRates.internationalAvg })
    return out.sort((a, b) => a.total - b.total)
  }, [flex, unlimited, landline, mobile, intl])
  const best = costs[0]
  const max = Math.max(...costs.map(c => c.total), 1)
  const slider = (label: string, value: number, set: (n: number) => void, maxV: number, step: number) =>
    <label className="sf-range"><span>{label} <b>{value} min</b></span><input type="range" min={0} max={maxV} step={step} value={value} onChange={e => set(Number(e.target.value))} style={{ '--fill': `${(value / maxV) * 100}%` } as CSSProperties} aria-valuetext={`${value} minutes`}/></label>

  return <section className="section speed-finder" aria-labelledby="ce-title">
    <div className="shell sf-grid">
      <div className="sf-controls">
        <span className="eyebrow">Call cost estimator</span>
        <h2 id="ce-title">See what your calls will cost.</h2>
        <p>Move the sliders to match a typical month and we'll show the best-value Connectra Voice plan for your home.</p>
        {slider('Calls to SA landlines', landline, setLandline, 2000, 25)}
        {slider('Calls to SA mobiles', mobile, setMobile, 1500, 25)}
        {slider('International calls', intl, setIntl, 300, 5)}
      </div>
      <div className="sf-result" aria-live="polite">
        <span className="ce-label">Estimated monthly cost</span>
        <div className="ce-bars">{costs.map(c => <div key={c.plan.id} className={c === best ? 'best' : ''}>
          <span><b>{c.plan.name}</b>{c === best && <em>Best value</em>}</span>
          <i><em style={{ width: `${(c.total / max) * 100}%` }}/></i>
          <strong>{zar(c.total, true)}</strong>
        </div>)}</div>
        {best && <div className="sf-plan" key={best.plan.id}>
          <div><small>Your match</small><h3>{best.plan.name}</h3><p>{costs.length > 1 ? `Saves you about ${zar(costs[1].total - best.total)} a month compared with ${costs[1].plan.name}.` : best.plan.note}</p></div>
          <div className="sf-price"><b>{zar(best.total)}</b><span>/month</span></div>
          <button type="button" className="btn btn-primary" onClick={() => onChoose(best.plan)}>Get {best.plan.name} <Icon name="arrow" size={17}/></button>
        </div>}
        <p className="ce-note">Estimate uses an average international rate of {rate(voipRates.internationalAvg)}/min. Actual rates depend on the destination.</p>
      </div>
    </div>
  </section>
}

// ---------------------------------------------------------------------------
// Business — Cloud PBX features and quote form.
// ---------------------------------------------------------------------------
function BusinessVoice({ plan, onChoose }: { plan: VoipPlan; onChoose: () => void }) {
  const { toast } = useApp()
  const [email, setEmail] = useState('')
  const [size, setSize] = useState('1–10 employees')
  const [loading, setLoading] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true)
    try { const r = await api.requestCallback({ email, companySize: size, solution: 'Cloud PBX (VoIP)' }); toast(`${r.message} (Ref ${r.ref})`); setEmail('') }
    catch (err) { toast((err as Error).message, 'error') } finally { setLoading(false) }
  }
  return <section className="section shell voip-business">
    <div className="vb-copy">
      <span className="eyebrow">Connectra Voice for business</span>
      <h2>A complete phone system, without the hardware.</h2>
      <p>{plan.name} gives every team member an extension, a professional menu for callers, and calls that follow them from desk to mobile, from {zar(plan.price)} per user a month.</p>
      <div className="vb-features">{[['headset', 'Auto attendant (IVR)', '"Press 1 for sales" menus and business-hours routing.'], ['user', 'Hunt groups & queues', 'Ring a team at once or in order, so no call is missed.'], ['shield', 'Call recording', 'Record calls for training and compliance, stored securely.'], ['phone', 'Calls on any device', 'Desk phones, desktop and mobile apps on one number.']].map(([i, t, d]) =>
        <article key={t}><span><Icon name={i} size={20}/></span><div><h3>{t}</h3><p>{d}</p></div></article>)}
      </div>
      <Button onClick={onChoose}>Set up {plan.name} <Icon name="arrow" size={17}/></Button>
    </div>
    <form className="vb-form" onSubmit={submit}>
      <h3>Get a tailored quote</h3>
      <p>Moving 20+ users or keeping several numbers? A specialist will plan your switch.</p>
      <label>Work email<input type="email" required placeholder="you@company.co.za" value={email} onChange={e => setEmail(e.target.value)}/></label>
      <label>Company size<select value={size} onChange={e => setSize(e.target.value)}><option>1–10 employees</option><option>11–50 employees</option><option>51–200 employees</option><option>200+ employees</option></select></label>
      <Button type="submit" loading={loading}>Request a callback</Button>
    </form>
  </section>
}

// ---------------------------------------------------------------------------
// Configurator — number choice, area code, users → checkout.
// ---------------------------------------------------------------------------
export function VoipConfigurator({ plan, onClose }: { plan: VoipPlan; onClose: () => void }) {
  const { setCart, go } = useApp()
  const [users, setUsers] = useState(plan.perUser ? 3 : 1)
  const [type, setType] = useState<'new' | 'port'>('new')
  const [areaCode, setAreaCode] = useState('021')
  const [portNumber, setPortNumber] = useState('')
  const [error, setError] = useState('')
  const monthly = plan.price * users
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (type === 'port' && !/^0\d{9}$/.test(portNumber.replace(/\D/g, ''))) return setError('Enter the 10-digit landline number you want to keep, e.g. 021 555 0194.')
    const item: CartItem = { type: 'voip', planId: plan.id, users, number: type === 'port' ? { type, portNumber } : { type, areaCode } }
    setCart(item); onClose(); go('checkout')
  }
  return <Modal title={`Set up ${plan.name}`} text="Choose your number. You can add more numbers and users any time." onClose={onClose}>
    <form onSubmit={submit} className="voip-config">
      {plan.perUser && <div className="vc-users"><span>Users</span><div className="stepper"><button type="button" aria-label="Fewer users" onClick={() => setUsers(u => Math.max(1, u - 1))}>−</button><input aria-label="Number of users" inputMode="numeric" value={users} onChange={e => setUsers(Math.min(500, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))}/><button type="button" aria-label="More users" onClick={() => setUsers(u => Math.min(500, u + 1))}>+</button></div></div>}
      <div className="vc-choice" role="radiogroup" aria-label="Number">
        <button type="button" role="radio" aria-checked={type === 'new'} className={type === 'new' ? 'on' : ''} onClick={() => { setType('new'); setError('') }}><b>Get a new number</b><small>Free, live in minutes</small></button>
        <button type="button" role="radio" aria-checked={type === 'port'} className={type === 'port' ? 'on' : ''} onClick={() => { setType('port'); setError('') }}><b>Keep my number</b><small>Free, 3–5 working days</small></button>
      </div>
      {type === 'new'
        ? <label>Area code<select value={areaCode} onChange={e => setAreaCode(e.target.value)}>{voipAreaCodes.map(a => <option key={a.code} value={a.code}>{a.code} · {a.area}</option>)}</select></label>
        : <label>Landline number to keep<input inputMode="tel" placeholder="021 555 0194" value={portNumber} onChange={e => setPortNumber(e.target.value)}/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="vc-total"><span>Monthly total</span><b>{zar(monthly)}<small>/month</small></b></div>
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Continue to checkout <Icon name="arrow" size={17}/></Button></div>
    </form>
  </Modal>
}
