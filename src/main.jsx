import React, { useState } from 'react';
import { ArrowDown, ArrowDownRight, ArrowUpRight, Leaf, Menu, Sun, X, Zap } from 'lucide-react';
import { pages, normalizePath } from './content.js';
import { InnerPage, BlogPage, ContactPage, MissingPage, ArticlePage } from './pages.jsx';
import { useContent } from './site-content.jsx';
import Admin from './admin.jsx';

function Brand({ inverse = false }) { return <a className={'brand' + (inverse ? ' brand-inverse' : '')} href="/" aria-label="eniminds. ENERGY INNOVATING MINDS – pagina iniziale"><span className="brand-mark"><span></span><span></span><span></span><span></span></span><span className="brand-word">eniminds<span className="brand-dot">.</span><small>ENERGY INNOVATING MINDS</small></span></a>; }
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="header"><div className="header-inner wrap"><Brand/><nav id="main-nav" className={'nav' + (menuOpen ? ' nav-open' : '')} aria-label="Navigazione principale"><a href="/chi-siamo/">Chi siamo</a><a href="/consulenze/">Consulenze</a><a href="/per-consumatori/">Organizzazioni</a><a href="/per-condomini/">Residenziale</a><a href="/blog/">Approfondimenti</a><a className="mobile-contact" href="/contatti/">Parliamone <ArrowUpRight size={16}/></a></nav><a className="header-cta" href="/contatti/">Parliamone <ArrowUpRight size={16} strokeWidth={1.6}/></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={menuOpen} aria-controls="main-nav">{menuOpen ? <X/> : <Menu/>}</button></div></header>;
}
function Footer() { const { settings } = useContent(); return <footer className="footer"><div className="wrap"><div className="footer-main"><div><Brand inverse/><p className="footer-description">{settings.footerText}</p></div><div><span>ESPLORA</span><a href="/chi-siamo/">Chi siamo</a><a href="/vision-e-mission/">Vision e mission</a><a href="/priorita/">Le nostre priorità</a><a href="/consulenze/">Consulenze</a><a href="/blog/">Approfondimenti</a></div><div><span>CONTATTI</span><a href={'mailto:'+settings.email}>{settings.email}</a><p>{settings.address}<br/>{settings.city}</p><a href="/contatti/">Scrivici ↗</a></div><a className="back-top" href="#inizio" aria-label="Torna all'inizio"><ArrowUpRight size={22}/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ENIMINDS SRL · P.IVA {settings.vat} · R.E.A. {settings.rea}</span><span>ENERGY INNOVATING MINDS</span><a href="https://www.iubenda.com/privacy-policy/15841804/legal" target="_blank" rel="noreferrer">PRIVACY POLICY ↗</a></div></div></footer>; }
function Home() { const { home, services, audiences, settings } = useContent(); const [audience, setAudience] = useState('business'); const current = audiences[audience]; return (
    <main id="inizio">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-image" style={{backgroundImage: `url("${home.heroImage}")`}} role="img" aria-label={home.heroAlt}></div>
        <div className="hero-shade"></div>
        <div className="wrap hero-content">
          <div className="hero-kicker"><span className="live-dot"></span> ENERGY INNOVATING MINDS <span className="kicker-line"></span> BOLOGNA, ITALIA</div>
          <h1 id="hero-title">{home.heroTitle}</h1>
          <div className="hero-bottom"><p>{home.heroIntro}</p><a href="#servizi" className="button button-light">Scopri cosa facciamo <span><ArrowUpRight size={17}/></span></a></div>
        </div>
        <div className="hero-foot wrap"><span>ENERGIA · INNOVAZIONE · SOSTENIBILITÀ</span><a href="#chi-siamo">SCORRI PER ESPLORARE <ArrowDown size={15}/></a><span>01 / 04</span></div>
      </section>
      <section className="intro section wrap" id="chi-siamo">
        <div className="section-label"><span className="tiny-symbol">✳</span> CHI SIAMO <span className="label-number">/ 01</span></div>
        <div className="intro-main"><div><h2>{home.introTitle}</h2><div className="intro-decoration"><span></span><span></span><span></span><span></span><span></span></div></div><div className="intro-copy"><p className="intro-lead">{home.introLead}</p><p>{home.introText}</p><a className="text-link" href="/vision-e-mission/">La nostra visione <span><ArrowUpRight size={17}/></span></a></div></div>
        <div className="intro-bottom"><span>ENERGIA CON UNA DIREZIONE</span><span>UNA VISIONE, PIÙ POSSIBILITÀ <ArrowDownRight size={18}/></span></div>
      </section>
      <section className="services section" id="servizi"><div className="wrap">
        <div className="section-top"><div className="section-label"><span className="tiny-symbol">✳</span> COSA FACCIAMO <span className="label-number">/ 02</span></div><p>COMPETENZE CHE LAVORANO INSIEME</p></div>
        <div className="section-heading"><h2>{home.serviceTitle}</h2><p>{home.serviceIntro}</p></div>
        <div className="service-grid">{services.map(({number, label, title, text, tags}, index) => <article className="service-card" key={number}><div className="service-card-top"><span>{number} / 03</span>{React.createElement([Zap, Leaf, Sun][index % 3], {size:25, strokeWidth:1.35})}</div><div className="service-body"><div className="service-label">{label}</div><h3>{title}</h3><p>{text}</p></div><div className="tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div><a className="service-arrow" href="/consulenze/" aria-label={'Scopri le consulenze su ' + label.toLowerCase()}><ArrowUpRight size={20}/></a></article>)}</div>
      </div></section>
      <section className="audiences section wrap" id="destinatari">
        <div className="section-top"><div className="section-label"><span className="tiny-symbol">✳</span> PER CHI <span className="label-number">/ 03</span></div><p>OGNI PERCORSO INIZIA DALL’ASCOLTO</p></div>
        <div className="audience-heading"><h2>{home.audienceTitle}</h2><div className="audience-switch" role="group" aria-label="Scegli per chi"><button onClick={() => setAudience('business')} aria-pressed={audience === 'business'}>Organizzazioni</button><button onClick={() => setAudience('residential')} aria-pressed={audience === 'residential'}>Residenziale</button></div></div>
        <div className="audience-content"><div className="audience-img"><img src={current.image} alt={current.alt}/><span className="image-index">{audience === 'business' ? '01' : '02'} / 02</span></div><div className="audience-copy"><span className="mini-label"><span></span> {current.eyebrow}</span><h3>{current.title}</h3><p>{current.description}</p><ul>{current.items.map(item => <li key={item}><ArrowUpRight size={15}/>{item}</li>)}</ul><a href={audience === 'business' ? '/per-consumatori/' : '/per-condomini/'} className="text-link">Scopri i servizi <span><ArrowUpRight size={17}/></span></a></div></div>
      </section>
      <section className="vision" id="visione"><div className="wrap vision-inner"><div className="vision-side"><div className="section-label light-label"><span className="tiny-symbol">✳</span> LA NOSTRA VISIONE <span className="label-number">/ 04</span></div><span className="vision-asterisk">✳</span></div><div className="vision-copy"><span className="mini-label light-mini">ENERGY INNOVATING MINDS</span><h2>{home.visionTitle}</h2><p>{home.visionText}</p><a className="button button-outline" href="/chi-siamo/">Conosciamoci <span><ArrowUpRight size={17}/></span></a></div></div></section>
      <section className="contact wrap" id="contatti"><div className="contact-top"><div className="section-label"><span className="tiny-symbol">✳</span> CONTATTI <span className="label-number">/ 05</span></div><span>IL PROSSIMO PASSO È IL TUO</span></div><div className="contact-body"><h2>{home.contactTitle}</h2><div><p>{home.contactText}</p><a href="/contatti/" className="button button-dark">Contattaci <span><ArrowUpRight size={17}/></span></a><a className="email-link" href={'mailto:'+settings.email}>{settings.email}</a></div></div></section>
    </main>

); }
export default function App({path='/'}) { const currentPath=normalizePath(path); let content; if(currentPath==='/admin/') return <Admin/>; if(currentPath==='/') content=<Home/>; else if(pages[currentPath]) content=<InnerPage page={currentPath}/>; else if(currentPath==='/blog/') content=<BlogPage/>; else if(currentPath==='/contatti/') content=<ContactPage/>; else if(/^\/blog\/[a-z0-9-]+\/$/.test(currentPath)) content=<ArticlePage slug={currentPath.split('/')[2]}/>; else content=<MissingPage legacy={currentPath==='/2024/12/12/titolo-articolo/'}/>; return <><a className="skip-link" href="#inizio">Vai al contenuto</a><Header/>{content}<Footer/></>; }
