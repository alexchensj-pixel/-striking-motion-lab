import React from 'react';
import { site, waLink } from '../Data/Content.js';
import { image, fotosSesion } from '../Data/Media.js';
import Calendly from '../Experience/Reserva/Calendly.jsx';
import './SalesLanding.css';

const disciplines = [
  { n: '01', title: 'Muay Thai', sub: 'Técnica · Clinch · Patadas', img: '/IMG_3495.webp' },
  { n: '02', title: 'Boxeo', sub: 'Distancia · Golpes · Defensa', img: '/IMG_3491.webp' },
  { n: '03', title: 'Kickboxing · K1', sub: 'Combinaciones · Ritmo · Control', img: '/IMG_3493.webp' },
];
const formats = [
  { n: '01', title: 'Entrenamiento 1:1', sub: 'Atención individual', body: 'Corrección técnica y trabajo adaptado a tu nivel, objetivos y ritmo.', img: fotosSesion.individual[0].src, tag: 'PERSONALIZADO' },
  { n: '02', title: 'Entrenamiento en pareja', sub: 'Entrenad juntos', body: 'Compartid una sesión guiada sin perder la atención del entrenador.', img: fotosSesion.parejas[0].src, tag: 'COMPARTIDO' },
  { n: '03', title: 'Grupos reducidos', sub: 'Máximo 4 personas', body: 'Aprende y mejora en un grupo pequeño con seguimiento directo.', img: fotosSesion.grupos[0].src, tag: 'PLAZAS LIMITADAS' },
];
const plans = [
  { name: 'ARSENAL', desc: 'Base sólida', price: '110', sessions: '1 sesión / semana', features: ['Técnica fundamental', 'Condición física', 'Seguimiento básico'] },
  { name: 'STRIKER', desc: 'Progresión real', price: '185', sessions: '2 sesiones / semana', features: ['Técnica avanzada', 'Combinaciones y táctica', 'Análisis de movimiento', 'Seguimiento de progreso'], popular: true },
  { name: 'FIGHT IQ', desc: 'Rendimiento total', price: '270', sessions: '3 sesiones / semana', features: ['Técnica y estrategia', 'Sparring controlado', 'Análisis en vídeo', 'Plan personalizado'] },
];
const technique = [
  ['Golpes', 'Jab · Cross · Hook', '01'],
  ['Patadas', 'Low · Middle · High', '02'],
  ['Clinch', 'Control · Rodillas', '03'],
  ['Desplazamiento', 'Ángulos · Distancia', '04'],
  ['Defensa', 'Bloqueo · Esquiva', '05'],
  ['Combinaciones', 'Técnica · Ritmo · Control', '06'],
];
const faqs = [
  ['¿Necesito experiencia previa?', 'No. Puedes empezar desde cero. Adaptamos la técnica, la intensidad y el ritmo a tu punto de partida.'],
  ['¿Qué material necesito?', 'El material necesario para las sesiones lo aporto yo. No necesitas comprar nada para empezar.'],
  ['¿Puedo entrenar solo o en grupo?', 'Sí. Puedes elegir entrenamiento individual, en pareja o grupos reducidos, según disponibilidad.'],
  ['¿Cómo funciona la evaluación inicial?', 'Es una sesión privada presencial de 60 minutos. Cuesta 30 € y, si después contratas un plan mensual, se descuentan del primer pago.'],
  ['¿Hay permanencia?', 'No hay permanencia. La frecuencia y el plan se adaptan a tus objetivos y disponibilidad.'],
  ['¿Dónde entrenamos?', 'Entrenamiento en distintas zonas de Madrid, en espacios exteriores y ubicaciones acordadas. Los grupos tienen horarios y puntos de encuentro definidos.'],
];

function SectionLabel({ n, children }) {
  return <p className="sml-v3__eyebrow"><span>{n}</span> / {children}</p>;
}

export default function SalesLanding() {
  return (
    <main className="sml-v3">
      <header className="sml-v3__nav">
        <a className="sml-v3__logo" href="#inicio" aria-label="Striking Motion Lab, inicio"><b>S<span>M</span>L</b><small>STRIKING MOTION LAB<br/>MADRID</small></a>
        <nav aria-label="Navegación principal">
          <a href="#metodo">Método</a><a href="#entrenamiento">Entrenamiento</a><a href="#planes">Planes</a><a href="#grupos">Grupos</a>
          <a className="sml-v3__nav-cta" href="#reserva">Reservar · 30 €</a>
        </nav>
        <a className="sml-v3__menu" href="#contacto" aria-label="Ir a contacto"><span></span><span></span><span></span></a>
      </header>

      <section className="sml-v3__hero" id="inicio">
        <img className="sml-v3__hero-bg" src={image.heroLab} alt="Entrenamiento de deportes de combate en Madrid"/>
        <div className="sml-v3__hero-overlay"/>
        <div className="sml-v3__hero-content">
          <SectionLabel n="01">INICIO · MADRID</SectionLabel>
          <h1>Muay Thai <i>·</i> Boxeo <i>·</i> K1</h1>
          <p className="sml-v3__hero-sub">Entrenamiento personal y en grupos reducidos para mejorar tu técnica, forma física y confianza.</p>
          <p className="sml-v3__hero-note">Empieza desde cero o sube tu nivel.</p>
          <div className="sml-v3__hero-points"><span><b>↗</b>Técnica real</span><span><b>▥</b>Forma física</span><span><b>◎</b>Confianza y control</span></div>
          <div className="sml-v3__actions"><a className="sml-v3__button" href="#reserva">Reservar evaluación · 30 € <span>↗</span></a><a className="sml-v3__text-link" href="#metodo">Conocer el método ↓</a></div>
        </div>
        <div className="sml-v3__chapter">01 <span>—</span> 08</div>
        <div className="sml-v3__vertical">STRIKING MOTION LAB · MADRID</div>
      </section>

      <section className="sml-v3__about sml-v3__section" id="chen">
        <div className="sml-v3__about-image"><img src={image.chenRing} alt="Chen en el entorno de entrenamiento"/><span>COACH · MADRID</span></div>
        <div className="sml-v3__about-copy">
          <SectionLabel n="02">SOBRE MÍ</SectionLabel>
          <h2>Mi historia,<br/><em>mi método.</em></h2>
          <p>Empecé en el Muay Thai a los 23. He competido, he aprendido y el entrenamiento me ha ayudado a construir la disciplina, la confianza y el foco que tengo hoy.</p>
          <p>Ahora acompaño a otras personas a descubrir lo mismo a través del entrenamiento.</p>
          <div className="sml-v3__stats"><div><b>+3</b><span>años entrenando</span></div><div><b>2</b><span>combates en España</span></div><div><b>Madrid</b><span>entrenador</span></div></div>
          <p className="sml-v3__credential">{site.logro}</p>
        </div>
      </section>

      <section className="sml-v3__method sml-v3__section" id="metodo">
        <div className="sml-v3__method-copy">
          <SectionLabel n="03">EL MÉTODO</SectionLabel>
          <h2>Training<br/><em>Intelligence.</em></h2>
          <p>Un sistema de aprendizaje basado en el análisis del movimiento, la corrección y la evolución constante.</p>
          <div className="sml-v3__steps">
            {[
              ['01','Observar','Tu movimiento en acción'],
              ['02','Registrar','Vídeo y datos clave'],
              ['03','Analizar','Detectar errores y patrones'],
              ['04','Corregir','Ajustes concretos y seguimiento'],
            ].map(([n,t,d]) => <div className="sml-v3__step" key={n}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></div>)}
          </div>
        </div>
        <div className="sml-v3__method-visual" aria-label="Diagrama ilustrativo de análisis del movimiento">
          <div className="sml-v3__orbit sml-v3__orbit--one"/><div className="sml-v3__orbit sml-v3__orbit--two"/>
          <div className="sml-v3__axis"><span>90°</span><i/><b>ANÁLISIS<br/>DEL MOVIMIENTO</b></div>
          <div className="sml-v3__method-caption">MOVEMENT / CONTROL / PROGRESSION</div>
        </div>
      </section>

      <section className="sml-v3__tech sml-v3__section" id="tecnica">
        <div className="sml-v3__section-heading"><div><SectionLabel n="04">TÉCNICA</SectionLabel><h2>Técnica que se<br/><em>entiende y se aplica.</em></h2></div><p>Aprende los fundamentos, corrige detalles y gana control en cada movimiento.</p></div>
        <div className="sml-v3__tech-grid">{technique.map(([t,d,n],i) => <article className="sml-v3__tech-card" key={n}><img src={['/IMG_3493.webp','/IMG_3495.webp','/IMG_3491.webp','/IMG_3476.webp','/IMG_3492.webp','/IMG_3488.webp'][i]} alt="" loading="lazy"/><div><small>{n}</small><h3>{t}</h3><p>{d}</p></div></article>)}</div>
      </section>

      <section className="sml-v3__formats sml-v3__section" id="entrenamiento">
        <div className="sml-v3__section-heading"><div><SectionLabel n="05">ENTRENAMIENTO</SectionLabel><h2>Tu entrenamiento.<br/><em>Tu siguiente nivel.</em></h2></div><p>Elige el formato que se adapta a ti y entrena con un seguimiento real.</p></div>
        <div className="sml-v3__format-grid">{formats.map((f,i) => <article className={i===2?'sml-v3__format is-featured':'sml-v3__format'} key={f.n}><div className="sml-v3__format-image"><img src={f.img} alt="" loading="lazy"/><small>{f.tag}</small></div><div className="sml-v3__format-copy"><span>{f.n}</span><h3>{f.title}</h3><b>{f.sub}</b><p>{f.body}</p><a href={i===2?'#grupos':'#reserva'}>{i===2?'Ver grupos':'Consultar disponibilidad'} ↗</a></div></article>)}</div>
        <div className="sml-v3__benefits"><span><b>↗</b>Flexible<small>Tú eliges el ritmo</small></span><span><b>▥</b>Adaptado<small>A tu nivel y objetivo</small></span><span><b>◎</b>Progresión<small>Seguimiento continuo</small></span></div>
      </section>

      <section className="sml-v3__plans sml-v3__section" id="planes">
        <div className="sml-v3__section-heading"><div><SectionLabel n="06">PLANES Y PRECIOS</SectionLabel><h2>Elige tu plan.<br/><em>Entrena con propósito.</em></h2></div><p>Tres niveles de entrenamiento, adaptados a tu objetivo, disponibilidad y ritmo de vida.</p></div>
        <div className="sml-v3__plan-grid">{plans.map(p => <article className={p.popular?'sml-v3__plan is-popular':'sml-v3__plan'} key={p.name}>{p.popular&&<span className="sml-v3__popular">MÁS POPULAR</span>}<h3>{p.name}</h3><p className="sml-v3__plan-desc">“{p.desc}”</p><b className="sml-v3__sessions">{p.sessions}</b><ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul><div className="sml-v3__price"><strong>{p.price} €</strong><span>/ mes</span></div><a href="#reserva">Empezar con {p.name} ↗</a></article>)}</div>
        <div className="sml-v3__plan-foot"><span>∞ <b>Sin permanencia</b></span><span>▦ <b>Flexible</b><small>A tu ritmo</small></span><span>↗ <b>Evolución real</b><small>Técnica, forma y confianza</small></span></div>
      </section>

      <section className="sml-v3__groups sml-v3__section" id="grupos">
        <div className="sml-v3__groups-copy"><SectionLabel n="07">GRUPOS EN MADRID</SectionLabel><h2>Entrenamientos<br/><em>en grupo.</em></h2><p>Sesiones al aire libre, grupo reducido (máx. 4 personas) y buen ambiente.</p>
          <div className="sml-v3__schedule"><article><small>SÁBADOS Y DOMINGOS</small><b>10:00 – 11:00</b><span>Estadio Metropolitano (Wanda)</span><a href={site.maps}>Cómo llegar ↗</a></article><article><small>SÁBADOS Y DOMINGOS</small><b>11:00 – 12:00</b><span>Parque de Roma · Metro Sainz de Baranda</span><a href={site.maps}>Cómo llegar ↗</a></article></div>
          <p className="sml-v3__group-price">15 € sesión · 55 €/mes (1 día/semana) · 95 €/mes (2 días/semana)</p>
          <a className="sml-v3__button" href={waLink('Hola, quiero reservar una plaza en los grupos de entrenamiento.')}>Reservar mi plaza ↗</a>
        </div>
        <div className="sml-v3__groups-visual"><div className="sml-v3__map"><span className="sml-v3__map-label">MADRID</span><i className="pin pin--one">01</i><i className="pin pin--two">02</i><b>ESTADIO<br/>METROPOLITANO</b><small>PARQUE DE ROMA</small></div><img src="/IMG_3492.webp" alt="Sesión de entrenamiento en grupo" loading="lazy"/></div>
      </section>

      <section className="sml-v3__faq sml-v3__section" id="contacto">
        <div className="sml-v3__faq-side"><SectionLabel n="08">FAQ Y CONTACTO</SectionLabel><h2>Preguntas<br/><em>frecuentes.</em></h2><p>Resolvemos las dudas más habituales antes de empezar.</p><img src="/IMG_3495.webp" alt="Guantes de entrenamiento" loading="lazy"/></div>
        <div className="sml-v3__faq-content"><div className="sml-v3__accordions">{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>＋</span></summary><p>{a}</p></details>)}</div>
          <div className="sml-v3__ready"><h3>¿Listo para empezar?</h3><p>Reserva tu evaluación, resuelve tus dudas o cuéntame tus objetivos. Te responderé personalmente.</p><a className="sml-v3__button" href="#reserva">Reservar evaluación · 30 € ↗</a></div>
          <div className="sml-v3__contact-links"><a href={waLink('Hola, quiero información sobre los entrenamientos.')}><b>◉</b>WhatsApp<small>Respuesta rápida</small></a><a href="mailto:hola@strikingmotionlab.com"><b>✉</b>Email<small>Contacto directo</small></a><a href={site.maps}><b>⌖</b>Madrid<small>Entrenamiento en tu zona</small></a></div>
        </div>
      </section>

      <section className="sml-v3__booking sml-v3__section" id="reserva">
        <div className="sml-v3__booking-heading"><SectionLabel n="09">PRIMER PASO</SectionLabel><h2>Empieza con una<br/><em>evaluación inicial.</em></h2><p>Sesión privada · 60 minutos · 30 €</p><small>Si después contratas un plan mensual, los 30 € se descuentan del primer pago.</small></div>
        <Calendly/>
      </section>
      <footer className="sml-v3__footer"><a className="sml-v3__logo" href="#inicio"><b>S<span>M</span>L</b><small>STRIKING MOTION LAB<br/>MADRID</small></a><p>Muay Thai · Boxeo · Kickboxing · K1</p><div><a href={waLink('Hola, quiero información sobre los entrenamientos.')}>WhatsApp</a><a href={site.instagram.url}>Instagram</a><a href={site.maps}>Ubicación</a></div><small>© {new Date().getFullYear()} Striking Motion Lab</small></footer>
      <a className="sml-v3__sticky" href="#reserva">Reservar evaluación · 30 € <span>↗</span></a>
    </main>
  );
}
