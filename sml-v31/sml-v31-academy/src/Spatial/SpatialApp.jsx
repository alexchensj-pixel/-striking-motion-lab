import React, { useEffect, useRef, useState } from 'react';
import LegacyWorld from './scene/LegacyWorld.jsx';
import ExploreOverlay from './scene/ExploreOverlay.jsx';
import {
  site, hero, advisorySubstages, evaluacionInicial,
  dossierItems, reserva, faq, empresas, cierre, waLink
} from './legacy/Data/Content.js';
import { image, eci, entrenamientoMedia } from './legacy/Data/Media.js';
import { existingPlans, kitInicio } from './legacy/Data/Programs.js';
import { RUTAS } from './legacy/Data/Legal.js';

class SpatialBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('SML spatial scene unavailable:', error); }
  render() { return this.state.failed ? <div className="world-fallback" aria-hidden="true" /> : this.props.children; }
}

const navItems = [
  ['inicio', 'Inicio'], ['metodo', 'Método'],
  ['entrenamiento', 'Precios'], ['alex', 'Sobre Alex'], ['reserva', 'Reservar'],
  ['empresas', 'Empresas'],
];
const spatialHeroTitle = ['Tu técnica.', 'Tu estrategia.', 'Tu forma de combatir.'];
const spatialHeroContext = 'Entrenamiento privado en Madrid · Análisis técnico · Seguimiento personal';
const spatialEvaluationText = 'No es una clase de prueba: es una sesión privada para analizar tu punto de partida, observar cómo te mueves y definir qué necesitas trabajar.';
const money = (value) => `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 })} €`;

const monthlyPlanCopy = {
  arsenal: {
    descriptor: 'FUNDAMENTOS',
    identity: 'Empiezas con evaluación y análisis en vídeo para orientar qué corregir en tus siguientes sesiones.',
    intro: 'INCLUYE',
    highlights: ['Evaluación técnica inicial', 'Análisis técnico en vídeo', 'Comba de entrenamiento de boxeo'],
    cta: 'Empezar con Arsenal',
  },
  striker: {
    descriptor: 'DESARROLLO',
    identity: 'Añade planificación personalizada y una biblioteca de ejercicios para dar continuidad al trabajo entre sesiones.',
    intro: 'TODO ARSENAL +',
    highlights: ['Plan de entrenamiento personalizado', 'Biblioteca personalizada de ejercicios', 'Trabajo específico según objetivos'],
    cta: 'Reservar Striker',
    popular: true,
  },
  'fight-iq': {
    descriptor: 'DOMINIO',
    identity: 'Para desarrollar estrategia, estilo y preparación específica de combate con seguimiento técnico.',
    intro: 'TODO STRIKER +',
    highlights: ['Preparación específica para combate', 'Estrategia y táctica', 'Desarrollo del estilo de pelea y sparring supervisado, progresivo y adaptado a tu nivel técnico; no es un requisito para empezar'],
    cta: 'Reservar Fight IQ',
  },
};

const planComparisonRows = [
  { label: 'Técnica y vídeo', arsenal: 'Evaluación + análisis en vídeo', striker: 'Incluido', fightIq: 'Incluido' },
  { label: 'Personalización', arsenal: '—', striker: 'Plan + biblioteca + objetivos', fightIq: 'Incluida' },
  { label: 'Estrategia y combate', arsenal: '—', striker: '—', fightIq: 'Táctica + estilo + sparring supervisado' },
  { label: 'Frecuencia', arsenal: '1 sesión/semana', striker: '2 sesiones/semana', fightIq: '3 sesiones/semana' },
];

function App() {
  const [active, setActive] = useState('inicio');
  const [exploreOpen, setExploreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(-1);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activeService, setActiveService] = useState('grupos');
  const methodProgress = useRef(0);
  const [activeMethodIndex, setActiveMethodIndex] = useState(0);

  useEffect(() => {
    const ids = navItems.map(([id]) => id);
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .15, .35, .6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const validTabs = new Set(['individual', 'parejas', 'grupos']);
    const syncTabFromHash = () => {
      const requested = window.location.hash.slice(1);
      if (validTabs.has(requested)) setActiveService(requested);
    };
    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const section = document.getElementById('metodo');
      if (section) {
        const rect = section.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        methodProgress.current = Math.max(0, Math.min(1, -rect.top / travel));
        const nextStep = Math.min(4, Math.floor(Math.max(0, Math.min(.999, methodProgress.current)) * 5));
        setActiveMethodIndex((current) => current === nextStep ? current : nextStep);
      }
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => { window.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress); };
  }, []);

  const go = (id) => {
    setActive(id);
    setExploreOpen(false);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('sml:navigate', { detail: { id } }));
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      if (id === 'metodo') {
        // Método activa su ruta 3D en el borde real de la sección; scrollIntoView respeta scroll-padding-top y se quedaba 90px antes.
        const top = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 2, behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };
  const openExplore = () => {
    setExploreOpen(true);
    requestAnimationFrame(() => {
      const node = document.querySelector('.explore-dwell');
      if (!node) return;
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY);
      root.style.scrollBehavior = previousBehavior;
    });
  };
  const formatPlans = existingPlans.filter((plan) => plan.tipo === 'formato');
  const monthlyPlans = existingPlans.filter((plan) => plan.tipo === 'mensual');
  const individualFormat = formatPlans.find((plan) => plan.id === '1-1');
  const coupleFormat = formatPlans.find((plan) => plan.id === 'duo');
  const groupFormat = formatPlans.find((plan) => plan.id === 'grupo');
  const chooseService = (id) => {
    setActiveService(id);
    window.history.replaceState(null, '', `#${id}`);
  };
  const serviceTabs = [
    { id: 'grupos', label: 'Grupos reducidos', detail: 'Hasta 4 · por zona' },
    { id: 'parejas', label: 'Parejas', detail: 'Entrenad juntos' },
    { id: 'individual', label: '1:1', detail: 'Atención individual' },
  ];

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <SpatialBoundary><LegacyWorld exploreOpen={exploreOpen} /></SpatialBoundary>
    <ExploreOverlay onContinue={() => go('metodo')} />
    <div className="grain" aria-hidden="true" />
    <header className="topbar">
      <a className="brand" href="#inicio" onClick={(e) => { e.preventDefault(); go('inicio'); }} aria-label="Striking Motion Lab, inicio">
        <span className="brand-mark">S<span>/</span>ML</span>
        <span className="brand-caption">STRIKING MOTION LAB<br/>MADRID</span>
      </a>
      <button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}><span/><span/></button>
      <nav id="site-navigation" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Navegación principal">
        {navItems.map(([id, label]) => <button key={id} type="button" aria-current={active === id ? 'location' : undefined} onClick={() => go(id)}>{label}</button>)}
        <a href="/academia">Academia ↗</a><a href="/mi-sml">Mi SML ↗</a>
      </nav>
      <span className="top-index">SPATIAL EXPERIENCE / 001</span>
    </header>

    <main id="contenido">
      <section id="inicio" className="hero journey-section">
        <img className="hero-photo" src={image.heroLab} alt="" aria-hidden="true" decoding="async" fetchPriority="high" />
        <p className="hero-overline">{hero.kicker}</p>
        <h1>{spatialHeroTitle.map((line, i) => <React.Fragment key={line}>{line}{i < hero.titulo.length - 1 && <br/>}</React.Fragment>)}</h1>
        <p className="hero-context">{spatialHeroContext}</p>
        <p className="hero-offer">Muay Thai · Boxeo · Kickboxing / K1 en Madrid<br/><span>1:1 · Parejas · Grupos reducidos de hasta 4</span></p>
        <div className="hero-actions">
          <a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer"><span>{hero.ctaReservar}</span><svg className="hero-cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
          <button className="secondary-cta" type="button" onClick={() => go('metodo')}>Conocer el método</button>
          <button className="secondary-cta explore-open-cta" type="button" onClick={openExplore}>Descubre tu disciplina</button>
        </div>
        <div className="hero-proof">{hero.confianza}</div>
        <div className="hero-quicklinks"><button type="button" onClick={() => go('entrenamiento')}>Ver precios</button><button type="button" onClick={() => go('empresas')}>Empresas y eventos</button><button type="button" className="intro-skip" onClick={() => go('entrenamiento')}>Saltar introducción ↓</button></div>
        <div className="scroll-cue">DESLIZA PARA EXPLORAR ↓</div>
      </section>



      <section className={exploreOpen ? "explore-dwell is-open" : "explore-dwell"} role="region" aria-label="Selección de disciplinas y formas de entrenamiento" aria-hidden={!exploreOpen} />

      <section id="metodo" className="method-section journey-section">
        <div className="method-stage">
          <div className="method-copy">
            <p className="eyebrow">UN PROCESO PERSONAL</p>
            <h2>{advisorySubstages[0].titular.map((line, i) => <React.Fragment key={line}>{line}{i === 0 && <br/>}</React.Fragment>)}</h2>
            <div className="method-evaluation">
              <span>{evaluacionInicial.kickerMetodo}</span>
              <div className="method-evaluation-title"><h3>{evaluacionInicial.titulo}</h3><small className="method-evaluation-price">Primera evaluación · {evaluacionInicial.precio}</small></div>
              <p className="method-evaluation-note">{spatialEvaluationText}</p>
              <p className="method-material-note">No necesitas comprar nada para empezar. Si no tienes material, lo llevo yo.</p>
              <p className="method-evaluation-terms">{evaluacionInicial.nota}</p>
              <a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer"><span>{hero.ctaReservar}</span></a>
              <p className="method-cta-note">Sin permanencia en los planes.</p>
              <button className="text-link" type="button" aria-expanded={showMore} onClick={() => setShowMore((value) => !value)}>{showMore ? 'Cerrar información −' : `${evaluacionInicial.ctaMas} +`}</button>
              {showMore && <ul>{evaluacionInicial.mas.map(([a, b]) => <li key={a}><b>{a}:</b> {b}</li>)}</ul>}
            </div>
          </div>
          <div className="method-stations" aria-label="Cinco pasos del método">
            {advisorySubstages.slice(1).map((step, i) => <button type="button" className={activeMethodIndex === i ? 'method-station active' : 'method-station'} key={step.id} aria-current={activeMethodIndex === i ? 'step' : undefined} onClick={() => { const section = document.getElementById('metodo'); if (section) { const travel = section.offsetHeight - window.innerHeight; window.scrollTo({ top: section.offsetTop + travel * ((i + .5) / 5), behavior: 'smooth' }); } }}>
              <span className="station-number">{step.num}</span><span className="station-content"><strong>{step.n}</strong>{activeMethodIndex === i && <><span className="station-description">{step.texto}</span>{step.elementos && <span className="station-tags">{step.elementos.join(' · ')}</span>}{step.destacada && <span className="station-highlight">{step.destacada}</span>}</>}</span>
              {step.etiqueta && activeMethodIndex !== i && <small>{step.etiqueta}</small>}
            </button>)}
            <p className="method-closing">No solo entrenas. <span>Entiendes qué estás desarrollando.</span></p>
          </div>
          <span className="method-coordinate">LAB / 03 — {String(activeMethodIndex + 1).padStart(2, '0')} : 05</span>
        </div>
      </section>

      <section id="entrenamiento" className="journey-section content-section pricing-section">
        <div className="section-meta"><span>03 / 05</span><span>ENTRENAMIENTO · FORMATOS Y PRECIOS</span></div>
        <p className="eyebrow">ELIGE CÓMO ENTRENAR</p><h2 className="pricing-title">Entrenamiento diseñado alrededor de ti.</h2>
        <p className="pricing-social" aria-label="Valoración en Google: 5,0 estrellas y 18 reseñas">{site.rating.valor.replace('.', ',')} ★ · {site.rating.resenas} reseñas</p>
        <p className="lead">Muay Thai, boxeo, kickboxing y K1 en Madrid. Entrenamiento 1:1, en pareja o en grupos de hasta cuatro personas.</p>
        <div className="pricing-followup"><span>NO ES SOLO UNA SESIÓN. ES UN PROCESO.</span><p>El trabajo continúa entre sesiones: Arsenal consolida la técnica, Striker añade planificación y biblioteca personalizada, y Fight IQ incorpora estrategia y preparación específica. No compras solo horas de entrenamiento: sigues un proceso con dirección y objetivos.</p></div>
        {entrenamientoMedia.sala?.poster && <figure className="session-proof"><img src={entrenamientoMedia.sala.poster} alt="Sesión real de entrenamiento privado de combate en interior" loading="lazy"/><figcaption>Trabajo técnico real · Sesiones privadas</figcaption></figure>}
        <nav className="pricing-tabs" role="tablist" aria-label="Tipo de entrenamiento">
          {serviceTabs.map((tab) => <a key={tab.id} id={`tab-${tab.id}`} href={`#${tab.id}`} role="tab" aria-selected={activeService === tab.id} aria-controls="service-pricing-panel" className={`pricing-tab ${activeService === tab.id ? 'is-active' : ''}`} onClick={(event) => { event.preventDefault(); chooseService(tab.id); }}>
            <strong>{tab.label}</strong><span>{tab.detail}</span>
          </a>)}
        </nav>
        <div id="service-pricing-panel" className="pricing-tab-panel" role="tabpanel" aria-labelledby={`tab-${activeService}`}>
          {activeService === 'individual' && <>
            <div className="plan-cards-heading">
              <div><p className="eyebrow">PLANES MENSUALES · 1:1</p><h3 className="subsection-title">Elige tu plan de entrenamiento.</h3></div>
              <p>Cada plan incluye el anterior y añade más frecuencia y trabajo específico.</p>
            </div>
            <div className="training-grid monthly-grid plan-grid">
              {monthlyPlans.map((plan) => {
                const card = monthlyPlanCopy[plan.id];
                const monthlySessions = plan.sesionesSemana * 4;
                const perSession = (plan.precio / monthlySessions).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return <article className={`training-card monthly-card plan-card plan-card-${plan.id} ${card.popular ? 'is-popular' : ''}`} key={plan.id}>
                  <div className="plan-card-top"><span>{card.descriptor}</span>{card.popular && <strong className="plan-popular-badge">MÁS POPULAR</strong>}</div>
                  <h3>{plan.nombre}</h3>
                  <p className="plan-card-identity">{card.identity}</p>
                  <div className="plan-card-price"><strong>{money(plan.precio)}</strong><span>/ mes</span></div>
                  <p className="plan-card-per-session">{perSession} € / sesión</p>
                  <p className="plan-card-frequency">{plan.sesionesSemana} {plan.sesionesSemana === 1 ? 'sesión' : 'sesiones'} / semana <span>·</span> 60 min</p>
                  <div className="plan-card-content">
                    <p className="plan-card-intro">{card.intro}</p>
                    <ul>{card.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <a className="plan-card-action" href={waLink(`Hola, quiero información sobre el plan ${plan.nombre} y consultar disponibilidad.`)} target="_blank" rel="noopener noreferrer"><span>{card.cta} · {money(plan.precio)}/mes</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
                  <p className="plan-card-footnote">Sin permanencia · cambios con 24 h y recuperación en el mismo mes según disponibilidad.</p>
                  <p className="plan-kit-note">Kit completo opcional con tu plan mensual: <strong>{money(kitInicio.precio)}.</strong></p>
                </article>;
              })}
            </div>
            <div className="single-session-card">
              <div><small>SESIÓN INDIVIDUAL · 60 MIN</small><h3>Sesión suelta 1:1</h3><p>{individualFormat.texto} No incluye evaluación técnica inicial ni diseño de un plan mensual.</p></div>
              <strong>{money(individualFormat.precio)} <span>/ sesión</span></strong>
              <a href={waLink('Hola, quiero consultar disponibilidad para una sesión individual 1:1.')} target="_blank" rel="noopener noreferrer">Consultar sesión <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
              <p className="format-risk-note">60 min · Sin plan mensual ni permanencia · cambios con 24 h de antelación.</p>
            </div>
            <div className="plan-comparison-control">
              <button type="button" className="plan-comparison-toggle" aria-expanded={showPlanComparison} aria-controls="plan-comparison" onClick={() => setShowPlanComparison((value) => !value)}>{showPlanComparison ? 'Ocultar comparación' : 'Comparar qué incluye cada plan'} <span>{showPlanComparison ? '−' : '+'}</span></button>
            </div>
            {showPlanComparison && <div id="plan-comparison" className="plan-comparison-panel">
              <div className="plan-comparison-scroll">
                <table className="plan-comparison-table">
                  <thead><tr><th scope="col">Atributo</th><th scope="col">Arsenal</th><th scope="col">Striker</th><th scope="col">Fight IQ</th></tr></thead>
                  <tbody>{planComparisonRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.arsenal}</td><td>{row.striker}</td><td>{row.fightIq}</td></tr>)}</tbody>
                </table>
              </div>
            </div>}
          </>}
          {activeService === 'parejas' && <>
            <div className="plan-cards-heading"><div><p className="eyebrow">ENTRENAMIENTO COMPARTIDO</p><h3 className="subsection-title">Entrenad juntos.</h3></div><p>Una sesión privada para dos personas, adaptada a vuestro nivel y objetivos.</p></div>
            <article className="training-card format-service-card"><small>SESIÓN PARA 2 PERSONAS</small><h3>Parejas</h3><div className="format-service-price">{money(coupleFormat.precio)} <span>/ persona / sesión</span></div><p>{coupleFormat.texto}</p><a href={waLink('Hola, quiero consultar disponibilidad para entrenar en pareja.')} target="_blank" rel="noopener noreferrer">Consultar disponibilidad <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a><p className="format-risk-note">Sin permanencia · cambios con 24 h de antelación. La evaluación inicial no se descuenta en este formato.</p></article>
          </>}
          {activeService === 'grupos' && <>
            <div className="plan-cards-heading"><div><p className="eyebrow">ENTRENAMIENTO EN EQUIPO</p><h3 className="subsection-title">Grupo reducido.</h3></div><p>Entrenamiento compartido, con atención técnica y un máximo de cuatro personas.</p></div>
            <article className="training-card format-service-card"><small>GRUPO REDUCIDO · MÁXIMO 4 PERSONAS</small><h3>Grupos reducidos</h3><div className="format-service-price">{money(groupFormat.precio)} <span>/ persona / sesión</span></div><p>{groupFormat.texto}</p><p className="format-bonuses">{groupFormat.desde}</p><a href={waLink('Hola, quiero consultar si hay grupo reducido compatible con mi zona y disponibilidad.')} target="_blank" rel="noopener noreferrer">Consultar grupos en mi zona <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a><p className="format-risk-note">Sin permanencia · grupos sujetos a zona y plazas disponibles. Si no existe uno compatible, puedes apuntarte para formarlo.</p></article>
          </>}
        </div>
      </section>

      <section id="alex" className="journey-section content-section founder-section">
        <div className="section-meta"><span>04 / 05</span><span>SOBRE ALEX</span></div>
        <p className="eyebrow">COACH / COMPETIDOR</p><h2>Experiencia dentro y fuera del ring.</h2>
        <div className="founder-human"><figure><img src={image.chenAzotea} alt="Alex, entrenador de Striking Motion Lab" loading="lazy"/><figcaption>Alex · Entrenador</figcaption></figure><figure><img src={image.chenRing} alt="Alex compitiendo en el ring" loading="lazy"/><figcaption>Experiencia en competición · FEKM / WAKO</figcaption></figure></div>
        {dossierItems.filter((item) => item.id !== 'metodo').map((item) => <article className="proof-card" key={item.id}><small>{item.label}</small>{item.titulo && <h3>{item.titulo}</h3>}{item.datos?.map(([a, b]) => <p key={a}><b>{a}:</b> {b}</p>)}{item.texto?.map((line, i) => <p key={i}>{line}</p>)}{item.resenas?.map((review, i) => <blockquote key={i}>“{review}”</blockquote>)}{item.enlace && <a href={item.enlace.href} target="_blank" rel="noopener noreferrer">{item.enlace.label} ↗</a>}</article>)}
      </section>

      <section id="reserva" className="journey-section content-section booking-section">
        <div className="section-meta"><span>05 / 05</span><span>RESERVA</span></div>
        <p className="eyebrow">{reserva.subtitulo}</p><h2>{reserva.titulo}</h2><p className="lead">{reserva.texto}</p>
        <div className="booking-grid"><article><h3>{reserva.caminos.directo.titulo}</h3><p>{reserva.caminos.directo.accion}</p><a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer">Elegir día y hora ↗</a></article><article><h3>{reserva.caminos.dudas.titulo}</h3><p>{reserva.caminos.dudas.accion}</p><a className="secondary-cta" href={waLink(cierre.mensajeAsesoria)} target="_blank" rel="noopener noreferrer">Pedir asesoramiento ↗</a></article></div>
        <h3 className="subsection-title">Antes, durante y después</h3><ol className="booking-steps">{reserva.despues.map((item, i) => <li key={i}>{item}</li>)}</ol>
        <aside className="what-to-bring"><p className="eyebrow">MATERIAL OPCIONAL</p><h3>Tu propio kit de entrenamiento.</h3><p>Yo llevo el material necesario para las sesiones. Si prefieres tener el tuyo, puedes adquirir el kit completo: guantes, vendas y bucal.</p><p><strong>Kit completo: {money(kitInicio.precioSinPlan)}.</strong> Con un plan mensual: <strong>{money(kitInicio.precio)}.</strong></p></aside>
        <div className="faq"><h3>Preguntas frecuentes</h3>{faq.map((item, i) => <article key={item.q}><button type="button" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>{item.q}<span>{faqOpen === i ? '−' : '+'}</span></button>{faqOpen === i && <p>{item.a}</p>}</article>)}</div>
      </section>

      <section id="empresas" className="journey-section content-section business-section">
        <style>{`.business-section .b2b-intro{max-width:760px;margin-bottom:34px}.business-section .b2b-offers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:28px 0 46px}.business-section .b2b-offer{border:1px solid rgba(255,255,255,.13);background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));padding:24px;min-height:190px}.business-section .b2b-offer .eyebrow{margin-bottom:14px}.business-section .b2b-offer h3{font-size:clamp(20px,2.5vw,28px);margin:0 0 10px}.business-section .b2b-offer p{color:rgba(241,241,238,.72);line-height:1.65;margin:0}.business-section .b2b-case{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:28px;padding:28px 0;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16);margin:24px 0 34px}.business-section .b2b-facts{display:flex;gap:24px;flex-wrap:wrap;margin:22px 0}.business-section .b2b-fact strong{display:block;font-size:30px;color:#e05a2b}.business-section .b2b-fact span{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(241,241,238,.65)}.business-section .b2b-proposals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0 30px}.business-section .b2b-proposal{padding:20px;border:1px solid rgba(255,255,255,.12)}.business-section .b2b-proposal p{color:rgba(241,241,238,.7);line-height:1.6}.business-section .b2b-process{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:24px 0}.business-section .b2b-process article{border-left:2px solid #e05a2b;padding:4px 14px}.business-section .b2b-process strong{display:block;margin-bottom:7px}.business-section .b2b-process span{font-size:14px;line-height:1.55;color:rgba(241,241,238,.68)}.business-section .b2b-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}@media(max-width:680px){.business-section .b2b-offers,.business-section .b2b-proposals,.business-section .b2b-case,.business-section .b2b-process{grid-template-columns:1fr}.business-section .b2b-offer{min-height:0}.business-section .b2b-case{gap:12px}.business-section .b2b-facts{gap:18px}}`}</style>
        <div className="section-meta"><span>BUSINESS / B2B</span><span>PRIVATE EXPERIENCES · MADRID</span></div>
        <div className="b2b-intro">
          <p className="eyebrow">COMBAT SPORTS, DESIGNED FOR YOUR AUDIENCE</p>
          <h2>Una experiencia que convierte el combate en algo que se vive.</h2>
          <p className="lead">Diseño y ejecuto experiencias de Muay Thai, boxeo y kickboxing para empresas, hoteles, eventos y marcas. Llevo entrenador, material y coordinación; el espacio y la audiencia los aporta el partner.</p>
        </div>
        <div className="b2b-offers">
          <article className="b2b-offer"><p className="eyebrow">01 / CORPORATE</p><h3>Empresas & equipos</h3><p>Actividades participativas para team building, bienestar y encuentros internos. Adaptadas al tamaño del grupo, al espacio y al objetivo del evento.</p></article>
          <article className="b2b-offer"><p className="eyebrow">02 / HOSPITALITY</p><h3>Hoteles & huéspedes</h3><p>Sesiones privadas individuales, en pareja o para pequeños grupos. Una experiencia premium que el hotel puede ofrecer como actividad para sus huéspedes.</p></article>
          <article className="b2b-offer"><p className="eyebrow">03 / LIVE EVENTS</p><h3>Eventos & activaciones</h3><p>Demostraciones, introducciones guiadas y participación del público con tatami, material y dirección técnica.</p></article>
          <article className="b2b-offer"><p className="eyebrow">04 / BRAND PARTNERSHIPS</p><h3>Marcas & colaboraciones</h3><p>Experiencias deportivas integradas en lanzamientos, campañas y acciones de marca, diseñadas alrededor del público y del contexto.</p></article>
        </div>
        <div className="b2b-case">
          <div>
            <p className="eyebrow">PROYECTO REALIZADO</p><h3 className="subsection-title">El Corte Inglés · Experiencia Muay Thai</h3>
            <p>Activación realizada durante dos jornadas, con ocho intervenciones programadas de 20 minutos. Un entrenador y dos peleadores realizaron demostraciones técnicas y participación guiada. SML se encargó de la dirección deportiva y del material.</p>
            <div className="b2b-facts"><div className="b2b-fact"><strong>2</strong><span>jornadas</span></div><div className="b2b-fact"><strong>8</strong><span>intervenciones programadas</span></div><div className="b2b-fact"><strong>2026</strong><span>Madrid</span></div></div>
            <p>Un formato que combina exhibición y participación: el público no solo observa, también puede probar la actividad con acompañamiento profesional.</p>
          </div>
          <div><p className="eyebrow">DEL CONCEPTO A LA EJECUCIÓN</p><p>Montaje de zona y tatami, material, demostraciones, explicación técnica y participación guiada. Cada activación se dimensiona según el espacio, los horarios y el flujo de asistentes.</p><div className="eci-proof"><img src={eci.participacion} alt="Participación guiada del público en la activación de Muay Thai de El Corte Inglés" loading="lazy"/><img src={eci.demostracionPoster} alt="Demostración técnica de Muay Thai en El Corte Inglés" loading="lazy"/></div></div>
        </div>
        <p className="eyebrow">HOSPITALITY / FORMATOS EN PROPUESTA</p>
        <div className="b2b-proposals">
          <article className="b2b-proposal"><h3>Hotel 101</h3><p>Formato propuesto para sesiones privadas individuales, en pareja o grupos de 3–4 personas. Propuesta comercial, no presentada como colaboración ejecutada.</p></article>
          <article className="b2b-proposal"><h3>ILUNION Atrium</h3><p>Formato propuesto de entrenamiento privado para huéspedes, adaptable a la operativa y los espacios del hotel. Propuesta comercial pendiente de confirmación.</p></article>
        </div>
        <p className="eyebrow">A SIMPLE PARTNERSHIP MODEL</p>
        <div className="b2b-process"><article><strong>01 · Diseñamos</strong><span>Definimos objetivo, audiencia, duración, aforo y espacio.</span></article><article><strong>02 · Producimos</strong><span>SML aporta entrenador, material y coordinación de la experiencia.</span></article><article><strong>03 · Activamos</strong><span>El partner aporta espacio y acceso al público; ejecutamos y ajustamos el formato.</span></article></div>
        <p>{empresas.ayuda}</p>
        <div className="b2b-actions"><a className="primary-cta" href={waLink('Hola, quiero diseñar una experiencia B2B con SML. Tipo de proyecto: empresa / hotel / evento / marca.')} target="_blank" rel="noopener noreferrer">Diseñar una experiencia ↗</a><a className="secondary-cta" href={waLink('Hola, quiero recibir información sobre formatos y colaboración B2B.')} target="_blank" rel="noopener noreferrer">Solicitar dossier ↗</a></div>
      </section>
    </main>

    <footer className="footer footer-complete">
      <div><strong>{site.nombre}</strong><p>{site.claim} · {site.ciudad}</p><p>{site.disciplinas}</p></div>
      <div><strong>Contacto</strong><a href={waLink('Hola, quiero información sobre los entrenamientos.')} target="_blank" rel="noopener noreferrer">WhatsApp · {site.whatsappVisible}</a><a href={site.instagram.url} target="_blank" rel="noopener noreferrer">Instagram · {site.instagram.handle}</a><a href={site.maps} target="_blank" rel="noopener noreferrer">Google Maps</a></div>
      <div><strong>Acceso</strong><a href="/academia">Academia ↗</a><a href="/mi-sml">Mi SML ↗</a><a href={RUTAS.privacidad}>Política de privacidad</a><a href={RUTAS.aviso}>Aviso legal</a></div>
      <p className="footer-bottom">© {new Date().getFullYear()} Striking Motion Lab · Madrid, España. Los servicios se realizan con reserva previa.</p>
    </footer>
  </>;
}
export default App;
