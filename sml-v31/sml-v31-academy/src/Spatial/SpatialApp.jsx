import React, { useEffect, useRef, useState } from 'react';
import LegacyWorld from './LegacyWorld.jsx';
import Chapter from '../Experience/Chapter.jsx';
import Threshold from '../Scene/Transitions/Threshold.jsx';
import {
  site, hero, advisorySubstages, evaluacionInicial,
  dossierItems, reserva, faq, empresas, cierre, waLink
} from '../Data/Content.js';
import { image, eci, entrenamientoMedia, fotosSesion } from '../Data/Media.js';
import { existingPlans, kitInicio } from '../Data/Programs.js';
import { RUTAS } from '../Data/Legal.js';
import GrupoFinder from '../Experience/Slot/GrupoFinder.jsx';
import CredentialGallery from './CredentialGallery.jsx';
import Calendly from '../Experience/Reserva/Calendly.jsx';
import './styles.css';
import './inline-group-map.css';
import './immersive-continuity.css';

class SpatialBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('SML spatial scene unavailable:', error); }
  render() { return this.state.failed ? <div className="world-fallback" aria-hidden="true" /> : this.props.children; }
}

const navItems = [
  ['inicio', 'Inicio'], ['metodo', 'MÃ©todo'],
  ['entrenamiento', 'Precios'], ['alex', 'Sobre Alex'], ['reserva', 'Reservar'],
  ['empresas', 'Empresas'],
];
const chapterTarget = { inicio: 'entrada', metodo: 'asesoria-lab', entrenamiento: 'slot', alex: 'proof-chen', reserva: 'reserva', empresas: 'empresas' };
const activeNavForChapter = { entrada: 'inicio', 'asesoria-lab': 'metodo', slot: 'entrenamiento', 'proof-chen': 'alex', reserva: 'reserva' };
const spatialHeroTitle = ['TÃ©cnica de competiciÃ³n.', 'A tu medida.'];
const spatialHeroContext = 'ObservaciÃ³n tÃ©cnica, anÃ¡lisis individual y entrenamiento adaptado a tu nivel y tus objetivos. Aprende a moverte, golpear y defenderte con criterio.';
const spatialEvaluationText = 'No es una clase de prueba: es una sesiÃ³n privada para analizar tu punto de partida, observar cÃ³mo te mueves y definir quÃ© necesitas trabajar.';
const credentialItems = [
  { id: 'wako', src: image.credencialWako, width: 900, height: 826, alt: 'Certificado oficial WAKO a nombre de CHEN HAN: 3.Âº puesto en K1, categorÃ­a -57 kg, en los I Juegos de Combate 2025 Â· Copa de EspaÃ±a, club GK1 Team Trust Fitness Center', caption: '3.Âº puesto Â· K1 -57 kg Â· Juegos de Combate 2025 Â· Copa de EspaÃ±a', eyebrow: 'RESULTADO DE COMPETICIÃN', stat: '3.Âº', detail: 'K1 Â· â57 KG', note: 'Juegos de Combate 2025 Â· Copa de EspaÃ±a' },
  { id: 'fekm', src: image.credencialFekm, width: 900, height: 683, alt: 'Licencia federativa FEKM a nombre de CHEN HAN para Kickboxing y Muay Thai, con el Consejo Superior de Deportes y el club GK-1 Team Carabanchel', caption: 'Licencia FEKM Â· Kickboxing y Muay Thai', eyebrow: 'ACREDITACIÃN FEDERATIVA', stat: 'FEKM', detail: 'KICKBOXING + MUAY THAI', note: 'Licencia federativa Â· Consejo Superior de Deportes' },
];
const SessionPhoto = ({ photo, alt, caption, framing = 'portrait' }) => <figure className={`service-media service-media--portrait ${framing === 'wide' ? 'service-media--wide' : ''}`}><img src={photo.src} width={photo.width} height={photo.height} alt={alt} loading="eager" decoding="async"/><figcaption>{caption}</figcaption></figure>;
const methodStepMedia = [null, { video: '/Striking_Motion_Lab_Analisis_Movimiento.mov', poster: '/method-movement-poster.webp', src: '/method-movement-poster.webp', width: 512, height: 848 }, null, null];
const money = (value) => `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 })} â¬`;

const monthlyPlanCopy = {
  arsenal: {
    descriptor: 'FUNDAMENTOS',
    identity: 'Empiezas con evaluaciÃ³n y anÃ¡lisis en vÃ­deo para orientar quÃ© corregir en tus siguientes sesiones.',
    intro: 'INCLUYE',
    highlights: ['EvaluaciÃ³n tÃ©cnica inicial', 'AnÃ¡lisis tÃ©cnico en vÃ­deo', 'Comba de entrenamiento de boxeo'],
    cta: 'Empezar con Arsenal',
  },
  striker: {
    descriptor: 'DESARROLLO',
    identity: 'AÃ±ade planificaciÃ³n personalizada y una biblioteca de ejercicios para dar continuidad al trabajo entre sesiones.',
    intro: 'TODO ARSENAL +',
    highlights: ['Plan de entrenamiento personalizado', 'Biblioteca personalizada de ejercicios', 'Trabajo especÃ­fico segÃºn objetivos'],
    cta: 'Reservar Striker',
    popular: true,
  },
  'fight-iq': {
    descriptor: 'DOMINIO',
    identity: 'Para desarrollar estrategia, estilo y preparaciÃ³n especÃ­fica de combate con seguimiento tÃ©cnico.',
    intro: 'TODO STRIKER +',
    highlights: ['PreparaciÃ³n especÃ­fica para combate', 'Estrategia y tÃ¡ctica', 'Desarrollo del estilo de pelea y sparring supervisado, progresivo y adaptado a tu nivel tÃ©cnico; no es un requisito para empezar'],
    cta: 'Reservar Fight IQ',
  },
};

const planComparisonRows = [
  { label: 'TÃ©cnica y vÃ­deo', arsenal: 'EvaluaciÃ³n + anÃ¡lisis en vÃ­deo', striker: 'Incluido', fightIq: 'Incluido' },
  { label: 'PersonalizaciÃ³n', arsenal: 'â', striker: 'Plan + biblioteca + objetivos', fightIq: 'Incluida' },
  { label: 'Estrategia y combate', arsenal: 'â', striker: 'â', fightIq: 'TÃ¡ctica + estilo + sparring supervisado' },
  { label: 'Frecuencia', arsenal: '1 sesiÃ³n/semana', striker: '2 sesiones/semana', fightIq: '3 sesiones/semana' },
];

function App() {
  const [active, setActive] = useState('inicio');
  const [showMethod, setShowMethod] = useState(false);
  const methodReturnScroll = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(-1);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showGroupFinder, setShowGroupFinder] = useState(false);
  const [activeService, setActiveService] = useState('grupos');
  const [activeMethodIndex, setActiveMethodIndex] = useState(0);
  const handleMethodProgress = (progress) => {
    const nextStep = Math.min(3, Math.floor(Math.max(0, Math.min(0.999, progress)) * 4));
    setActiveMethodIndex((current) => current === nextStep ? current : nextStep);
  };
  const [bookingVisible, setBookingVisible] = useState(false);

  useEffect(() => {
    if (showMethod) { setActive('metodo'); return undefined; }
    const ids = navItems.filter(([id]) => id !== 'metodo').map(([id]) => id);
    const nodes = ids.map((id) => document.getElementById(chapterTarget[id] || id)).filter(Boolean);
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(activeNavForChapter[visible.target.id] || visible.target.id);
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .15, .35, .6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = document.getElementById('reserva');
    if (!target || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting), { rootMargin: '-15% 0px -15% 0px' });
    observer.observe(target);
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



  const go = (id) => {
    setActive(id);
    setMenuOpen(false);
    if (id === 'metodo' || id === 'asesoria-lab') {
      methodReturnScroll.current = window.scrollY;
      setShowMethod(true);
      window.dispatchEvent(new CustomEvent('sml:navigate', { detail: { id: 'metodo' } }));
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      return;
    }
    window.dispatchEvent(new CustomEvent('sml:navigate', { detail: { id } }));
    requestAnimationFrame(() => {
      const target = document.getElementById(chapterTarget[id] || id);
      if (!target) return;
      if (id === 'metodo' || id === 'asesoria-lab') {
        // MÃ©todo activa su ruta 3D en el borde real de la secciÃ³n; scrollIntoView respeta scroll-padding-top y se quedaba 90px antes.
        const top = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 2, behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <SpatialBoundary><LegacyWorld /></SpatialBoundary>
    <div className="grain" aria-hidden="true" />
    <header className="topbar">
      <a className="brand" href="#inicio" onClick={(e) => { e.preventDefault(); go('inicio'); }} aria-label="Striking Motion Lab, inicio">
        <span className="brand-mark">S<span>/</span>ML</span>
        <span className="brand-caption">STRIKING MOTION LAB<br/>MADRID</span>
      </a>
      <button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? 'Cerrar navegaciÃ³n' : 'Abrir navegaciÃ³n'}><span/><span/></button>
      <nav id="site-navigation" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="NavegaciÃ³n principal">
        {navItems.map(([id, label]) => <button key={id} type="button" aria-current={active === id ? 'location' : undefined} onClick={() => go(id)}>{label}</button>)}
        <a href="/academia">Academia â</a><a href="/mi-sml">Mi SML â</a>
      </nav>
      <span className="top-index">SPATIAL EXPERIENCE / 001</span>
    </header>

    {!bookingVisible && <button className="quick-booking" type="button" onClick={() => go('reserva')}><span>VER HORARIOS</span><span aria-hidden="true">â</span></button>}
    <main id="contenido">
      {!showMethod ? <>
      <Chapter id="entrada" className="spatial-chapter spatial-chapter--entry">
        <div id="inicio" className="hero journey-section">
        <p className="hero-overline">{hero.kicker}</p>
        <h1>{spatialHeroTitle.map((line, i) => <React.Fragment key={line}>{line}{i < spatialHeroTitle.length - 1 && <br/>}</React.Fragment>)}</h1>
        <p className="hero-context">Entrenamiento personal y en grupos reducidos para mejorar tu tÃ©cnica, forma fÃ­sica y confianza, empieces desde cero o no.</p>
        <div className="hero-benefits" aria-label="QuÃ© incluye el entrenamiento">
          <div className="hero-benefit"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 25V17M13 25V10M21 25V5M29 25V13"/></svg><span>AnÃ¡lisis tÃ©cnico<br/>personalizado</span></div>
          <div className="hero-benefit"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6M16 12v8M12 16h8"/></svg><span>Entrenamiento<br/>adaptado a tu nivel</span></div>
          <div className="hero-benefit"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 12 6-12 6L4 9 16 3ZM4 16l12 6 12-6M4 23l12 6 12-6"/></svg><span>Progreso<br/>medible</span></div>
        </div>
        <div className="hero-start-note">Â¿Empiezas desde cero? No necesitas experiencia previa. Entrenamos desde tu nivel y llevo el material.</div>
        <div className="hero-actions hero-actions--editorial">
          <a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer"><span>Reservar evaluaciÃ³n Â· 30 â¬</span><svg className="hero-cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
          <button className="secondary-cta" type="button" onClick={() => go('metodo')}>Conocer el mÃ©todo <span aria-hidden="true">â</span></button>
        </div>
        <p className="hero-cta-note">SesiÃ³n privada de evaluaciÃ³n. Si contratas un plan mensual, descontamos los 30 â¬ del primer mes.</p>
        <div className="hero-format-cards" aria-label="Elige tu formato de entrenamiento">
          <button type="button" className={`hero-format-card ${activeService === 'individual' ? 'is-selected' : ''}`} aria-pressed={activeService === 'individual'} onClick={() => { chooseService('individual'); go('entrenamiento'); }}>
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="9" r="5"/><path d="M6 28v-3a10 10 0 0 1 20 0v3H6Z"/></svg><strong>1:1</strong><span>Individuales</span>
          </button>
          <button type="button" className={`hero-format-card ${activeService === 'parejas' ? 'is-selected' : ''}`} aria-pressed={activeService === 'parejas'} onClick={() => { chooseService('parejas'); go('entrenamiento'); }}>
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="10" r="4"/><circle cx="23" cy="12" r="3.5"/><path d="M2.5 27v-2a8.5 8.5 0 0 1 17 0v2h-17ZM19 20a7 7 0 0 1 10.5 6v1H23"/></svg><strong>Parejas</strong><span>Entrena en pareja</span>
          </button>
          <button type="button" className={`hero-format-card ${activeService === 'grupos' ? 'is-selected' : ''}`} aria-pressed={activeService === 'grupos'} onClick={() => { chooseService('grupos'); go('entrenamiento'); }}>
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="8" r="3.5"/><circle cx="5.5" cy="12" r="3"/><circle cx="26.5" cy="12" r="3"/><path d="M9 27v-2a7 7 0 0 1 14 0v2H9ZM1 27v-2a6 6 0 0 1 5-5.9M31 27v-2a6 6 0 0 0-5-5.9"/></svg><strong>Grupos</strong><span>Hasta 4 personas</span>
          </button>
        </div>
        <div className="hero-proof">{hero.confianza}</div>
        <div className="hero-quicklinks"><button type="button" onClick={() => go('entrenamiento')}>Ver precios</button><button type="button" onClick={() => go('empresas')}>Empresas y eventos</button><button type="button" className="intro-skip" onClick={() => go('entrenamiento')}>Saltar introducciÃ³n â</button></div>
        <div className="scroll-cue">DESLIZA PARA EXPLORAR â</div>
        </div>
      </Chapter>
      <Threshold from="entrada" to="slot" />
      <Chapter id="slot" className="spatial-chapter spatial-chapter--pricing">
      <div id="entrenamiento" className="journey-section content-section pricing-section">
        <div className="section-meta"><span>05 / 08</span><span>ENTRENAMIENTO Â· FORMATOS Y PLANES</span></div>
        <p className="eyebrow">TU SIGUIENTE NIVEL</p><h2 className="pricing-title">Tu entrenamiento. Tu siguiente nivel.</h2>
        <p className="pricing-social" aria-label="ValoraciÃ³n en Google: 5,0 estrellas y 18 reseÃ±as">{site.rating.valor.replace('.', ',')} â Â· {site.rating.resenas} reseÃ±as</p>
        <p className="lead">Muay Thai, boxeo, kickboxing y K1 en Madrid. Entrenamiento 1:1, en pareja o en grupos de hasta cuatro personas.</p>
        <div className="pricing-format-chooser">
          <div className="pricing-format-intro"><span className="eyebrow">ELIGE TU FORMATO</span><h3>Â¿CÃ³mo quieres entrenar?</h3><p>Selecciona una opciÃ³n para ver quÃ© incluye y cuÃ¡nto cuesta.</p></div>
          <nav className="pricing-tabs pricing-format-cards" role="tablist" aria-label="Tipo de entrenamiento">
            <button type="button" id="tab-grupos" role="tab" aria-selected={activeService === 'grupos'} aria-controls="service-pricing-panel" className={`pricing-tab pricing-format-card ${activeService === 'grupos' ? 'is-active' : ''}`} onClick={() => chooseService('grupos')}>
              <span className="pricing-format-image"><img src="/Grupo_parejas_poster.jpg" alt="" loading="lazy"/><span className="pricing-format-play" aria-hidden="true">â¶</span></span><span className="pricing-format-copy"><strong>Grupos reducidos</strong><small>Hasta 4 personas</small></span>
            </button>
            <button type="button" id="tab-parejas" role="tab" aria-selected={activeService === 'parejas'} aria-controls="service-pricing-panel" className={`pricing-tab pricing-format-card ${activeService === 'parejas' ? 'is-active' : ''}`} onClick={() => chooseService('parejas')}>
              <span className="pricing-format-image"><img src={fotosSesion.parejas[0].src} alt="" loading="lazy"/></span><span className="pricing-format-copy"><strong>Parejas</strong><small>Entrena junto a otra persona</small></span>
            </button>
            <button type="button" id="tab-individual" role="tab" aria-selected={activeService === 'individual'} aria-controls="service-pricing-panel" className={`pricing-tab pricing-format-card ${activeService === 'individual' ? 'is-active' : ''}`} onClick={() => chooseService('individual')}>
              <span className="pricing-format-image"><img src={fotosSesion.individual[0].src} alt="" loading="lazy"/></span><span className="pricing-format-copy"><strong>1:1</strong><small>AtenciÃ³n individual</small></span>
            </button>
          </nav>
        </div>
        <div id="service-pricing-panel" className="pricing-tab-panel" role="tabpanel" aria-labelledby={`tab-${activeService}`}>
          {activeService === 'individual' && <>
            <div className="format-detail-media"><img src={fotosSesion.individual[0].src} alt="SesiÃ³n individual de entrenamiento en Striking Motion Lab" loading="lazy"/><span>SESIÃN INDIVIDUAL Â· ATENCIÃN PERSONALIZADA</span></div>
            <div className="plan-cards-heading">
              <div><p className="eyebrow">PLANES MENSUALES Â· 1:1</p><h3 className="subsection-title">Elige tu plan de entrenamiento.</h3></div>
              <p>Cada plan incluye el anterior y aÃ±ade mÃ¡s frecuencia y trabajo especÃ­fico.</p>
            </div>
            <div className="training-grid monthly-grid plan-grid">
              {monthlyPlans.map((plan) => {
                const card = monthlyPlanCopy[plan.id];
                const monthlySessions = plan.sesionesSemana * 4;
                const perSession = (plan.precio / monthlySessions).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return <article className={`training-card monthly-card plan-card plan-card-${plan.id} ${card.popular ? 'is-popular' : ''}`} key={plan.id}>
                  <div className="plan-card-top"><span>{card.descriptor}</span>{card.popular && <strong className="plan-popular-badge">MÃS POPULAR</strong>}</div>
                  <h3>{plan.nombre}</h3>
                  <p className="plan-card-identity">{card.identity}</p>
                  <div className="plan-skill-panel">
                    <div className="plan-skill-visual"><span className="plan-skill-emblem">{plan.id === 'arsenal' ? 'A' : plan.id === 'striker' ? 'S' : 'IQ'}</span><span className="plan-skill-rank">{plan.id === 'arsenal' ? 'RANGO 01' : plan.id === 'striker' ? 'RANGO 02' : 'RANGO 03'}</span><span className="plan-skill-xp">RUTA DE DESARROLLO</span></div>
                    <div className="plan-skill-stats">
                      {(plan.id === 'arsenal' ? [['TÃCNICA',2],['ANÃLISIS',1],['PLANIFICACIÃN',0],['TÃCTICA',0]] : plan.id === 'striker' ? [['TÃCNICA',3],['ANÃLISIS',3],['PLANIFICACIÃN',3],['TÃCTICA',1]] : [['TÃCNICA',4],['ANÃLISIS',4],['PLANIFICACIÃN',4],['TÃCTICA',4]]).map(([label,level]) => <div className="plan-stat" key={label}><span>{label}</span><div className="plan-stat-bars" aria-label={`${label}: ${level} de 4 segmentos`}>{[1,2,3,4].map((n) => <i key={n} data-filled={n <= level} />)}</div></div>)}
                    </div>
                  </div>
                  <div className="plan-card-price"><strong>{money(plan.precio)}</strong><span>/ mes</span></div>
                  <p className="plan-card-per-session">{perSession} â¬ / sesiÃ³n</p>
                  <p className="plan-card-frequency">{plan.sesionesSemana} {plan.sesionesSemana === 1 ? 'sesiÃ³n' : 'sesiones'} / semana <span>Â·</span> 60 min</p>
                  <div className="plan-card-content">
                    <p className="plan-card-intro"><span>{card.intro}</span><span className="plan-feature-count">{card.highlights.length} HABILIDADES</span></p>
                    <div className="plan-feature-grid">{card.highlights.map((item, index) => {
                      const featureNames = plan.id === 'arsenal' ? ['EvaluaciÃ³n tÃ©cnica','AnÃ¡lisis en vÃ­deo','Equipo de entrenamiento'] : plan.id === 'striker' ? ['Plan personalizado','Biblioteca de ejercicios','Trabajo por objetivos'] : ['PreparaciÃ³n de combate','Estrategia y tÃ¡ctica','Estilo y sparring'];
                      const featureMarks = plan.id === 'arsenal' ? ['â','â«','â'] : plan.id === 'striker' ? ['â','â¤','â'] : ['â','â','â³'];
                      return <div className="plan-feature-tile" key={item}><span className="plan-feature-index">0{index + 1}</span><span className="plan-feature-mark">{featureMarks[index]}</span><div className="plan-feature-copy"><strong>{featureNames[index]}</strong><p>{item}</p></div><span className="plan-feature-unlock">UNLOCKED</span></div>;
                    })}</div>
                  </div>
                  <a className="plan-card-action" href={waLink(`Hola, quiero informaciÃ³n sobre el plan ${plan.nombre} y consultar disponibilidad.`)} target="_blank" rel="noopener noreferrer"><span>{card.cta} Â· {money(plan.precio)}/mes</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
                  <p className="plan-card-footnote">Sin permanencia Â· cambios con 24 h y recuperaciÃ³n en el mismo mes segÃºn disponibilidad.</p>
                  <p className="plan-kit-note">Kit completo opcional con tu plan mensual: <strong>{money(kitInicio.precio)}.</strong></p>
                </article>;
              })}
            </div>
            <div className="single-session-card">
              <div><small>SESIÃN INDIVIDUAL Â· 60 MIN</small><h3>SesiÃ³n suelta 1:1</h3><p>{individualFormat.texto} No incluye evaluaciÃ³n tÃ©cnica inicial ni diseÃ±o de un plan mensual.</p></div>
              <strong>{money(individualFormat.precio)} <span>/ sesiÃ³n</span></strong>
              <a href={waLink('Hola, quiero consultar disponibilidad para una sesiÃ³n individual 1:1.')} target="_blank" rel="noopener noreferrer">Consultar sesiÃ³n <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
              <p className="format-risk-note">60 min Â· Sin plan mensual ni permanencia Â· cambios con 24 h de antelaciÃ³n.</p>
            </div>
            <div className="plan-comparison-control">
              <button type="button" className="plan-comparison-toggle" aria-expanded={showPlanComparison} aria-controls="plan-comparison" onClick={() => setShowPlanComparison((value) => !value)}>{showPlanComparison ? 'Ocultar comparaciÃ³n' : 'Comparar quÃ© incluye cada plan'} <span>{showPlanComparison ? 'â' : '+'}</span></button>
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
            <article className="format-detail-card">
              <div className="format-detail-media"><img src={fotosSesion.parejas[0].src} alt="SesiÃ³n de entrenamiento en pareja" loading="lazy"/><span>ENTRENAMIENTO COMPARTIDO Â· 2 PERSONAS</span></div>
              <div className="format-detail-copy"><p className="eyebrow">ENTRENAMIENTO COMPARTIDO</p><h3>Entrenad juntos.</h3><div className="format-service-price">{money(coupleFormat.precio)} <span>/ persona / sesiÃ³n</span></div><p>{coupleFormat.texto}</p><a className="format-detail-cta" href={waLink('Hola, quiero consultar disponibilidad para entrenar en pareja.')} target="_blank" rel="noopener noreferrer">Consultar disponibilidad <span>â</span></a><small>Sin permanencia Â· cambios con 24 h de antelaciÃ³n. La evaluaciÃ³n inicial no se descuenta en este formato.</small></div>
            </article>
          </>}
          {activeService === 'grupos' && <>
            <article className="format-detail-card format-detail-card--group">
              <div className="format-detail-media"><video autoPlay muted loop playsInline webkit-playsinline="true" preload="metadata" poster="/Grupo_parejas_poster.jpg" aria-label="VÃ­deo de entrenamiento al aire libre en grupo reducido"><source src="/Grupo_parejas_12s_safari.mp4" type="video/mp4" /></video><span>ENTRENAMIENTO EN EQUIPO Â· MÃXIMO 4 PERSONAS</span></div>
              <div className="format-detail-copy"><p className="eyebrow">GRUPO REDUCIDO</p><h3>Entrena en equipo.</h3><div className="format-service-price">{money(groupFormat.precio)} <span>/ persona / sesiÃ³n</span></div><p>{groupFormat.texto}</p><p className="format-bonuses">{groupFormat.desde}</p><button type="button" className="format-group-toggle" aria-expanded={showGroupFinder} onClick={() => setShowGroupFinder((value) => !value)}>{showGroupFinder ? 'Cerrar mapa de grupos' : 'Consultar grupos en mi zona'} <span aria-hidden="true">{showGroupFinder ? 'â' : '+'}</span></button>{showGroupFinder && <div className="format-inline-map"><GrupoFinder onClose={() => setShowGroupFinder(false)} onPlanes={() => { setShowGroupFinder(false); chooseService('individual'); }} frecuencia={1} /></div>}<small>Sin permanencia Â· plazas sujetas a zona y disponibilidad. Si no existe un grupo compatible, puedes apuntarte para formarlo.</small></div>
            </article>
          </>}
        </div>
      </div>
      </Chapter>
      <Threshold from="slot" to="proof-chen" />
      <Chapter id="proof-chen" className="spatial-chapter spatial-chapter--founder">
      <div id="alex" className="journey-section content-section founder-section">
        <div className="section-meta"><span>04 / 05</span><span>SOBRE ALEX</span></div>
        <p className="eyebrow">COACH / COMPETIDOR</p><h2>Experiencia dentro y fuera del ring.</h2>
        <CredentialGallery items={credentialItems} />
        <div className="founder-human"><figure><img src={image.chenAzotea} alt="Alex, entrenador de Striking Motion Lab" loading="lazy"/><figcaption>Alex Â· Entrenador</figcaption></figure><figure><img src={image.chenRing} alt="Alex compitiendo en el ring" loading="lazy"/><figcaption>Experiencia en competiciÃ³n Â· FEKM / WAKO</figcaption></figure></div>
        <div className="founder-human founder-human--portrait"><figure><img src={fotosSesion.competicion[0].src} width={fotosSesion.competicion[0].width} height={fotosSesion.competicion[0].height} alt="CompeticiÃ³n: imagen de apoyo visual de la trayectoria deportiva" loading="lazy" decoding="async"/><figcaption>CompeticiÃ³n Â· Trayectoria</figcaption></figure><figure><img src={fotosSesion.competicion[1].src} width={fotosSesion.competicion[1].width} height={fotosSesion.competicion[1].height} alt="Apoyo visual de la experiencia en competiciÃ³n" loading="lazy" decoding="async"/><figcaption>Apoyo visual Â· CompeticiÃ³n</figcaption></figure></div>
        {dossierItems.filter((item) => item.id !== 'metodo').map((item) => <article className="proof-card" key={item.id}><small>{item.label}</small>{item.titulo && <h3>{item.titulo}</h3>}{item.datos?.map(([a, b]) => <p key={a}><b>{a}:</b> {b}</p>)}{item.texto?.map((line, i) => <p key={i}>{line}</p>)}{item.resenas?.map((review, i) => <blockquote key={i}>â{review}â</blockquote>)}{item.enlace && <a href={item.enlace.href} target="_blank" rel="noopener noreferrer">{item.enlace.label} â</a>}</article>)}
        </div>
      </Chapter>

      <Threshold from="proof-chen" to="reserva" />
      <Chapter id="reserva" className="spatial-chapter spatial-chapter--booking">
      <div id="reserva-content" className="journey-section content-section booking-section">
        <div className="section-meta"><span>05 / 05</span><span>RESERVA</span></div>
        <p className="eyebrow">{reserva.subtitulo}</p><h2>{reserva.titulo}</h2><p className="lead">{reserva.texto}</p>
        <div className="booking-calendar" aria-label="Calendario de disponibilidad y reservas">
          <div className="booking-calendar-heading"><span className="eyebrow">DISPONIBILIDAD EN TIEMPO REAL</span><h3>Elige dÃ­a y hora.</h3><p>Consulta los huecos libres y confirma tu sesiÃ³n directamente. El calendario estÃ¡ sincronizado con mi agenda.</p></div>
          <Calendly url={site.calendly} fallbackHref={site.calendlyBase} />
        </div>
        <div className="booking-grid booking-grid--secondary"><article><h3>{reserva.caminos.dudas.titulo}</h3><p>{reserva.caminos.dudas.accion}</p><a className="secondary-cta" href={waLink(cierre.mensajeAsesoria)} target="_blank" rel="noopener noreferrer">Pedir asesoramiento â</a></article></div>
        <h3 className="subsection-title">Antes, durante y despuÃ©s</h3><ol className="booking-steps">{reserva.despues.map((item, i) => <li key={i}>{item}</li>)}</ol>
        <aside className="what-to-bring"><p className="eyebrow">MATERIAL OPCIONAL</p><h3>Tu propio kit de entrenamiento.</h3><p>Yo llevo el material necesario para las sesiones. Si prefieres tener el tuyo, puedes adquirir el kit completo: guantes, vendas y bucal.</p><p><strong>Kit completo: {money(kitInicio.precio)}.</strong> Con un plan mensual: <strong>{money(kitInicio.precio)}.</strong></p></aside>
        <div className="faq"><h3>Preguntas frecuentes</h3>{faq.map((item, i) => <article key={item.q}><button type="button" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>{item.q}<span>{faqOpen === i ? 'â' : '+'}</span></button>{faqOpen === i && <p>{item.a}</p>}</article>)}</div>
      </div>

      <div id="empresas" className="journey-section content-section business-section">
        <style>{`.business-section .b2b-intro{max-width:760px;margin-bottom:34px}.business-section .b2b-offers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:28px 0 46px}.business-section .b2b-offer{border:1px solid rgba(255,255,255,.13);background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));padding:24px;min-height:190px}.business-section .b2b-offer .eyebrow{margin-bottom:14px}.business-section .b2b-offer h3{font-size:clamp(20px,2.5vw,28px);margin:0 0 10px}.business-section .b2b-offer p{color:rgba(241,241,238,.72);line-height:1.65;margin:0}.business-section .b2b-case{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:28px;padding:28px 0;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16);margin:24px 0 34px}.business-section .b2b-facts{display:flex;gap:24px;flex-wrap:wrap;margin:22px 0}.business-section .b2b-fact strong{display:block;font-size:30px;color:#54d9e8}.business-section .b2b-fact span{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(241,241,238,.65)}.business-section .b2b-proposals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0 30px}.business-section .b2b-proposal{padding:20px;border:1px solid rgba(255,255,255,.12)}.business-section .b2b-proposal p{color:rgba(241,241,238,.7);line-height:1.6}.business-section .b2b-process{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:24px 0}.business-section .b2b-process article{border-left:2px solid #54d9e8;padding:4px 14px}.business-section .b2b-process strong{display:block;margin-bottom:7px}.business-section .b2b-process span{font-size:14px;line-height:1.55;color:rgba(241,241,238,.68)}.business-section .b2b-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}@media(max-width:680px){.business-section .b2b-offers,.business-section .b2b-proposals,.business-section .b2b-case,.business-section .b2b-process{grid-template-columns:1fr}.business-section .b2b-offer{min-height:0}.business-section .b2b-case{gap:12px}.business-section .b2b-facts{gap:18px}}`}</style>
        <div className="section-meta"><span>BUSINESS / B2B</span><span>PRIVATE EXPERIENCES Â· MADRID</span></div>
        <div className="b2b-intro">
          <p className="eyebrow">COMBAT SPORTS, DESIGNED FOR YOUR AUDIENCE</p>
          <h2>Una experiencia que convierte el combate en algo que se vive.</h2>
          <p className="lead">DiseÃ±o y ejecuto experiencias de Muay Thai, boxeo y kickboxing para empresas, hoteles, eventos y marcas. Llevo entrenador, material y coordinaciÃ³n; el espacio y la audiencia los aporta el partner.</p>
        </div>
        <div className="b2b-offers">
          <article className="b2b-offer"><p className="eyebrow">01 / CORPORATE</p><h3>Empresas & equipos</h3><p>Actividades participativas para team building, bienestar y encuentros internos. Adaptadas al tamaÃ±o del grupo, al espacio y al objetivo del evento.</p></article>
          <article className="b2b-offer"><p className="eyebrow">02 / HOSPITALITY</p><h3>Hoteles & huÃ©spedes</h3><p>Sesiones privadas individuales, en pareja o para pequeÃ±os grupos. Una experiencia premium que el hotel puede ofrecer como actividad para sus huÃ©spedes.</p></article>
          <article className="b2b-offer"><p className="eyebrow">03 / LIVE EVENTS</p><h3>Eventos & activaciones</h3><p>Demostraciones, introducciones guiadas y participaciÃ³n del pÃºblico con tatami, material y direcciÃ³n tÃ©cnica.</p></article>
          <article className="b2b-offer"><p className="eyebrow">04 / BRAND PARTNERSHIPS</p><h3>Marcas & colaboraciones</h3><p>Experiencias deportivas integradas en lanzamientos, campaÃ±as y acciones de marca, diseÃ±adas alrededor del pÃºblico y del contexto.</p></article>
        </div>
        <div className="b2b-case">
          <div>
            <p className="eyebrow">PROYECTO REALIZADO</p><h3 className="subsection-title">El Corte InglÃ©s Â· Experiencia Muay Thai</h3>
            <p>ActivaciÃ³n realizada durante dos jornadas, con ocho intervenciones programadas de 20 minutos. Un entrenador y dos peleadores realizaron demostraciones tÃ©cnicas y participaciÃ³n guiada. SML se encargÃ³ de la direcciÃ³n deportiva y del material.</p>
            <div className="b2b-facts"><div className="b2b-fact"><strong>2</strong><span>jornadas</span></div><div className="b2b-fact"><strong>8</strong><span>intervenciones programadas</span></div><div className="b2b-fact"><strong>2026</strong><span>Madrid</span></div></div>
            <p>Un formato que combina exhibiciÃ³n y participaciÃ³n: el pÃºblico no solo observa, tambiÃ©n puede probar la actividad con acompaÃ±amiento profesional.</p>
          </div>
          <div><p className="eyebrow">DEL CONCEPTO A LA EJECUCIÃN</p><p>Montaje de zona y tatami, material, demostraciones, explicaciÃ³n tÃ©cnica y participaciÃ³n guiada. Cada activaciÃ³n se dimensiona segÃºn el espacio, los horarios y el flujo de asistentes.</p><div className="eci-proof"><img src={eci.participacion} alt="ParticipaciÃ³n guiada del pÃºblico en la activaciÃ³n de Muay Thai de El Corte InglÃ©s" loading="lazy"/><img src={eci.demostracionPoster} alt="DemostraciÃ³n tÃ©cnica de Muay Thai en El Corte InglÃ©s" loading="lazy"/></div></div>
        </div>
        <p className="eyebrow">HOSPITALITY / FORMATOS EN PROPUESTA</p>
        <div className="b2b-proposals">
          <article className="b2b-proposal"><h3>Hotel 101</h3><p>Formato propuesto para sesiones privadas individuales, en pareja o grupos de 3â4 personas. Propuesta comercial, no presentada como colaboraciÃ³n ejecutada.</p></article>
          <article className="b2b-proposal"><h3>ILUNION Atrium</h3><p>Formato propuesto de entrenamiento privado para huÃ©spedes, adaptable a la operativa y los espacios del hotel. Propuesta comercial pendiente de confirmaciÃ³n.</p></article>
        </div>
        <p className="eyebrow">A SIMPLE PARTNERSHIP MODEL</p>
        <div className="b2b-process"><article><strong>01 Â· DiseÃ±amos</strong><span>Definimos objetivo, audiencia, duraciÃ³n, aforo y espacio.</span></article><article><strong>02 Â· Producimos</strong><span>SML aporta entrenador, material y coordinaciÃ³n de la experiencia.</span></article><article><strong>03 Â· Activamos</strong><span>El partner aporta espacio y acceso al pÃºblico; ejecutamos y ajustamos el formato.</span></article></div>
        <p>{empresas.ayuda}</p>
        <div className="b2b-actions"><a className="primary-cta" href={waLink('Hola, quiero diseÃ±ar una experiencia B2B con SML. Tipo de proyecto: empresa / hotel / evento / marca.')} target="_blank" rel="noopener noreferrer">DiseÃ±ar una experiencia â</a><a className="secondary-cta" href={waLink('Hola, quiero recibir informaciÃ³n sobre formatos y colaboraciÃ³n B2B.')} target="_blank" rel="noopener noreferrer">Solicitar dossier â</a></div>
      </div>
      </Chapter>
      </> : <>
        <div className="method-view-controls"><button type="button" onClick={() => { setShowMethod(false); setActive("inicio"); requestAnimationFrame(() => window.scrollTo({ top: methodReturnScroll.current, behavior: "instant" })); }}>â Volver al recorrido</button></div>
        <Chapter id="asesoria-lab" className="spatial-chapter spatial-chapter--method" onProgress={handleMethodProgress}>
          <div id="metodo" className="method-section journey-section">
            <div className="method-stage">
              <header className="method-intro">
                <div className="method-intro-copy">
                  <p className="eyebrow">EL MÃTODO <span>â CICLO DE APRENDIZAJE</span></p>
                  <h2>UN ENTRENAMIENTO QUE <em>EVOLUCIONA CONTIGO.</em></h2>
                  <p className="method-lead">TÃ©cnica, anÃ¡lisis y progreso real. Un proceso estructurado para que aprendas, mejores tu tÃ©cnica y desarrolles tus capacidades.</p>
                </div>
                <div className="method-pillars" aria-label="Pilares del mÃ©todo">
                  <div><span className="method-pillar-icon">â</span><strong>Multidisciplinar</strong><small>Boxeo Â· K1 Â· Muay Thai</small></div>
                  <div><span className="method-pillar-icon">â</span><strong>AnÃ¡lisis</strong><small>Del movimiento</small></div>
                  <div><span className="method-pillar-icon">â</span><strong>CorrecciÃ³n</strong><small>Personalizada</small></div>
                  <div><span className="method-pillar-icon">âï¸</span><strong>Progreso</strong><small>Medible</small></div>
                </div>
              </header>

              <div className="method-journey-heading"><span>01 â 04</span><p>EL CICLO DE APRENDIZAJE</p><span>STRIKING MOTION LAB / MADRID</span></div>
              <div className="method-journey">
                {advisorySubstages.slice(1, 5).map((step, i) => {
                  const media = methodStepMedia[i];
                  return <article className={`method-step ${media ? 'has-media' : 'no-media'} ${activeMethodIndex === i ? 'is-active' : ''}`} key={step.id}>
                    <button className="method-step-copy" type="button" aria-expanded={activeMethodIndex === i} onClick={() => setActiveMethodIndex(i)}>
                      <span className="method-step-number">{step.num}</span>
                      <span className="method-step-text"><strong>{step.n}</strong><span>{step.texto}</span></span>
                      <span className="method-step-mark" aria-hidden="true">{activeMethodIndex === i ? 'â' : '+'}</span>
                    </button>
                    {media && <figure className="method-step-visual">{media.video ? <video ref={(el) => { if (el) el.muted = true; }} src={media.video} poster={media.poster} width={media.width} height={media.height} autoPlay muted loop playsInline preload="metadata" aria-label="AnÃ¡lisis biomecÃ¡nico de un movimiento de combate con referencias articulares y mediciones tÃ©cnicas" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${media.width} / ${media.height}`, objectFit: 'contain', background: '#07090c' }}/> : <img src={media.src} width={media.width} height={media.height} alt="AnÃ¡lisis biomecÃ¡nico de un movimiento de combate con referencias articulares y mediciones tÃ©cnicas" loading="lazy" decoding="async"/>}<span className="method-image-index">SML / MOVEMENT ANALYSIS</span></figure>}
                  </article>;
                })}
              </div>

              <div className="method-closing-panel"><p>MUCHO MÃS QUE ENTRENAR</p><h3>No solo entrenas. <span>Entiendes quÃ© estÃ¡s desarrollando.</span></h3><small>Aprende, comprende tu movimiento y construye tu propia evoluciÃ³n.</small></div>

              <section className="method-booking" aria-label="Reserva de evaluaciÃ³n inicial">
                <div className="method-booking-copy"><span>{evaluacionInicial.kickerMetodo}</span><h3>EVALUACIÃN<br/>INICIAL</h3><p>{spatialEvaluationText}</p></div>
                <div className="method-booking-details"><strong>Primera sesiÃ³n privada Â· {evaluacionInicial.precio}</strong><ul><li>ValoraciÃ³n de tu nivel y experiencia</li><li>ObservaciÃ³n tÃ©cnica y objetivos</li><li>{evaluacionInicial.nota}</li></ul><p>No necesitas comprar material. Si no tienes, lo llevo yo.</p></div>
                <div className="method-booking-action"><a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer"><span>RESERVAR EVALUACIÃN Â· 30 â¬ â</span></a><small>Sin permanencia Â· Primera sesiÃ³n privada</small></div>
              </section>
              <span className="method-coordinate">SML / METHOD â {String(activeMethodIndex + 1).padStart(2, '0')} : 04</span>
            </div>
          </div>
        </Chapter>
      </>}
    </main>

    <footer className="footer footer-complete">
      <div><strong>{site.nombre}</strong><p>{site.claim} Â· {site.ciudad}</p><p>{site.disciplinas}</p></div>
      <div><strong>Contacto</strong><a href={waLink('Hola, quiero informaciÃ³n sobre los entrenamientos.')} target="_blank" rel="noopener noreferrer">WhatsApp Â· {site.whatsappVisible}</a><a href={site.instagram.url} target="_blank" rel="noopener noreferrer">Instagram Â· {site.instagram.handle}</a><a href={site.maps} target="_blank" rel="noopener noreferrer">Google Maps</a></div>
      <div><strong>Acceso</strong><a href="/academia">Academia â</a><a href="/mi-sml">Mi SML â</a><a href={RUTAS.privacidad}>PolÃ­tica de privacidad</a><a href={RUTAS.aviso}>Aviso legal</a></div>
      <p className="footer-bottom">Â© {new Date().getFullYear()} Striking Motion Lab Â· Madrid, EspaÃ±a. Los servicios se realizan con reserva previa.</p>
    </footer>
  </>;
}
export default App;
