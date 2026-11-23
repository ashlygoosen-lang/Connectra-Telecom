// Legal centre: one page per policy, with a policy switcher, on-this-page navigation and print.
import { useEffect, useState } from 'react'
import { legalDocs, legalBySlug, legalEntity } from './legal'
import type { LegalBlock } from './legal'
import { Icon, useApp } from './App'

function Block({ b }: { b: LegalBlock }) {
  if (typeof b === 'string') return <p>{b}</p>
  if ('list' in b) return <ul>{b.list.map((x, i) => <li key={i}>{x}</li>)}</ul>
  return <aside className="legal-note"><Icon name="shield" size={18}/><p>{b.note}</p></aside>
}

export function LegalPage() {
  const { route, go } = useApp()
  const doc = legalBySlug[route.slug ?? 'terms'] ?? legalDocs[0]
  const [active, setActive] = useState(doc.sections[0].id)
  const [tocOpen, setTocOpen] = useState(false)

  // Highlight the section currently in view.
  useEffect(() => {
    setActive(doc.sections[0].id)
    const io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActive(visible[0].target.id)
    }, { rootMargin: '-90px 0px -65% 0px' })
    doc.sections.forEach(s => { const el = document.getElementById(`s-${s.id}`); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [doc])

  const jump = (id: string) => {
    setTocOpen(false)
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  return <>
    <section className="legal-hero"><div className="shell">
      <nav className="legal-crumbs" aria-label="Breadcrumb"><button onClick={() => go('home')}>Home</button><Icon name="chevron" size={14}/><button onClick={() => go('legal', { slug: 'terms' })}>Legal</button><Icon name="chevron" size={14}/><span aria-current="page">{doc.short}</span></nav>
      <h1>{doc.title}</h1>
      <p className="legal-meta"><span>Effective {legalEntity.effectiveDate}</span><span>{legalEntity.tradingName}, a division of {legalEntity.entity}</span></p>
    </div></section>

    <div className="shell legal-layout">
      <aside className="legal-side">
        <div className="legal-docs" role="navigation" aria-label="Legal documents">
          <span className="eyebrow">Policies</span>
          {legalDocs.map(d => <button key={d.slug} className={d.slug === doc.slug ? 'on' : ''} aria-current={d.slug === doc.slug ? 'page' : undefined} onClick={() => go('legal', { slug: d.slug })}>{d.short}</button>)}
        </div>
      </aside>

      <article className="legal-body" aria-labelledby="legal-title">
        <h2 id="legal-title" className="sr-only">{doc.title}</h2>
        <div className="legal-summary">
          <span className="eyebrow">In plain language</span>
          <ul>{doc.summary.map(s => <li key={s}><Icon name="check" size={16}/>{s}</li>)}</ul>
          <p>This summary is for convenience. The full text below is what applies.</p>
        </div>

        <div className="legal-toc-mobile">
          <button onClick={() => setTocOpen(!tocOpen)} aria-expanded={tocOpen}>On this page <Icon name={tocOpen ? 'close' : 'menu'} size={18}/></button>
          {tocOpen && <ol>{doc.sections.map(s => <li key={s.id}><button onClick={() => jump(s.id)}>{s.heading}</button></li>)}</ol>}
        </div>

        {doc.sections.map(s => <section key={s.id} id={`s-${s.id}`} className="legal-section">
          <h3>{s.heading}</h3>
          {s.body.map((b, i) => <Block key={i} b={b}/>)}
        </section>)}

        <div className="legal-foot">
          <p>Questions about this document? <button className="text-link" onClick={() => go('support')}>Contact our team <Icon name="arrow" size={16}/></button></p>
          <button className="btn btn-outline" onClick={() => window.print()}><Icon name="bill" size={17}/> Print or save as PDF</button>
        </div>
      </article>

      <aside className="legal-toc" aria-label="On this page">
        <span className="eyebrow">On this page</span>
        <ol>{doc.sections.map(s => <li key={s.id}><button className={active === s.id ? 'on' : ''} onClick={() => jump(s.id)}>{s.heading.replace(/^\d+\.\s*/, '')}</button></li>)}</ol>
      </aside>
    </div>
  </>
}
