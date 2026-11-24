import React from 'react';
import { site, waLink } from './Data/Content.js';
import { image, fotosSesion } from './Data/Media.js';
import './MobileHome.css';

const formats = [
  { title: '1:1', name: 'Entrenamiento personalizado', desc: 'Corrección individual y un plan adaptado a tu nivel y objetivos.', price: '30 € / sesión', photo: fotosSesion.individual[0].src, alt: 'Entrenamiento individual de deportes de combate' },
  { title: 'PAREJAS', name: 'Entrena con otra persona', desc: 'Compartid la sesión y progresad juntos con atención del entrenador.', price: '15 € / persona', photo: fotosSesion.parejas[0].src, alt: 'Entrenamiento de dos personas' },
  { title: 'GRUPOS', name: 'Grupos reducidos', desc: 'Entrena en grupos pequeños, máximo 4 personas.', price: '15 € / persona', extra: 'Desde 55 € / mes', photo: fotosSesion.grupos[0].src, alt: 'Entrenamiento en grupo reducido' },
];
const steps = [
  ['01', 'Técnica real', 'Aprende a golpear, defenderte y desplazarte con criterio.'],
  ['02', 'Condición física', 'Fuerza, resistencia, coordinación y movilidad.'],
  ['03', 'Análisis del movimiento', 'Observamos, registramos, analizamos y corregimos.'],
];
export default function MobileHome() {
  return <main className="mh">
    <header className="mh__nav">
      <a className="mh__brand" href="#inicio"><b>S<span>/</span>ML</b><small>STRIKING MOTION LAB<br/>MADRID</small></a>
      <a className="mh__menu" href="#contacto" aria-label="Ir a contacto"><i/><i/><i/></a>
    </header>

    <section className="mh__hero" id="inicio" style={{'--mh-hero': `url("${image.heroLab}")`}}>
      <div className="mh__hero-shade"/>
      <div className="mh__hero-content">
        <p className="mh__eyebrow"><span>01 / 05</span> INTRO</p>
        <p className="mh__discipline">MADRID · MUAY THAI · BOXEO · K1</p>
        <h1>Técnica de<br/>competición.<br/><em>A tu medida.</em></h1>
        <p className="mh__lead">Entrenamiento personal y en grupos reducidos para mejorar tu técnica, forma física y confianza. Empieza desde cero o sigue evolucionando.</p>
        <div className="mh__proofline"><span>▥</span> ANÁLISIS TÉCNICO PERSONALIZADO</div>
        <div className="mh__proofline"><span>⌖</span> ENTRENAMIENTO ADAPTADO A TU NIVEL</div>
        <a className="mh__cta" href="#reserva">RESERVAR EVALUACIÓN · 30 € ↗</a>
        <a className="mh__quiet" href="#metodo">CONOCER EL MÉTODO ↓</a>
      </div>
    </section>

    <section className="mh__section mh__formats" id="formatos">
      <p className="mh__eyebrow"><span>02 / 05</span> FORMATOS</p>
      <h2>Elige cómo<br/><em>quieres entrenar.</em></h2>
      <div className="mh__cards">{formats.map((f,i)=><article className="mh__format" key={f.title}>
        <img src={f.photo} alt={f.alt} loading="lazy"/>
        <div className="mh__format-shade"/>
        <div className="mh__format-copy"><span>{f.title}</span><h3>{f.name}</h3><p>{f.desc}</p><strong>{f.price}</strong>{f.extra&&<small>{f.extra}</small>}<a href={i===2?'#grupos':'#reserva'}>{i===2?'VER GRUPOS':'CONSULTAR DISPONIBILIDAD'} ↗</a></div>
      </article>)}</div>
    </section>

    <section className="mh__section mh__training" id="metodo">
      <p className="mh__eyebrow"><span>03 / 05</span> EL ENTRENAMIENTO</p>
      <img className="mh__training-photo" src={fotosSesion.individual[1].src} alt="Sesión de entrenamiento técnico" loading="lazy"/>
      <h2>Entrenamiento diseñado <em>alrededor de ti.</em></h2>
      <p className="mh__lead">Técnica, condición física y control del combate, con una metodología que se adapta a tu nivel y objetivos.</p>
      <div className="mh__steps">{steps.map(([n,t,d])=><article key={n}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></article>)}</div>
      <div className="mh__analysis"><span>MOVEMENT ANALYSIS</span><b>OBSERVAR → REGISTRAR → ANALIZAR → CORREGIR</b><div className="mh__wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
    </section>

    <section className="mh__section mh__experience" id="experiencia">
      <p className="mh__eyebrow"><span>04 / 05</span> EXPERIENCIA</p>
      <img className="mh__experience-photo" src={image.chenRing} alt="Entrenamiento y experiencia en deportes de combate" loading="lazy"/>
      <h2>Experiencia dentro<br/>y fuera del ring.</h2>
      <div className="mh__credential"><small>RESULTADO DE COMPETICIÓN</small><b>3.º</b><span>K1 · −57 KG</span><p>Juegos de Combate 2025 · Copa de España</p></div>
      <div className="mh__credential mh__fekm"><b>FEKM</b><span>KICKBOXING + MUAY THAI</span><p>Licencia federativa · Consejo Superior de Deportes</p></div>
      <div className="mh__gallery"><img src={fotosSesion.competicion[0].src} alt="Entrenamiento de combate" loading="lazy"/><img src={fotosSesion.competicion[1].src} alt="Trabajo técnico en sesión" loading="lazy"/></div>
    </section>

    <section className="mh__section mh__next" id="reserva">
      <p className="mh__eyebrow"><span>05 / 05</span> TU SIGUIENTE NIVEL</p>
      <div className="mh__tunnel" aria-hidden="true"><span/><span/><span/><b/></div>
      <h2>Tu siguiente<br/><em>nivel.</em></h2>
      <p className="mh__lead">No es solo una sesión. Es un proceso. Entrenamiento, análisis y seguimiento para que veas una evolución real, dentro y fuera del ring.</p>
      <ul><li>Evaluación inicial · 30 €</li><li>Plan de entrenamiento</li><li>Seguimiento y evolución</li><li>Flexibilidad de formatos</li></ul>
      <a className="mh__cta" href="#reserva-calendario">RESERVAR EVALUACIÓN · 30 € ↗</a>
      <a className="mh__rating" href={site.maps}><b>G</b><span>Google Maps<br/><strong>5,0 ★ · 18 reseñas</strong></span></a>
    </section>

    <section className="mh__booking" id="reserva-calendario">
      <p className="mh__eyebrow">PRIMER PASO</p><h2>Reserva tu evaluación.</h2><p>Sesión privada · 60 minutos · 30 €</p>
      <a className="mh__cta" href={site.calendly} target="_blank" rel="noreferrer">ELEGIR FECHA EN CALENDLY ↗</a>
    </section>
    <footer className="mh__footer" id="contacto"><a className="mh__brand" href="#inicio"><b>S<span>/</span>ML</b><small>STRIKING MOTION LAB<br/>MADRID</small></a><p>Muay Thai · Boxeo · Kickboxing · K1</p><a href={waLink('Hola, quiero información sobre los entrenamientos.')} target="_blank" rel="noreferrer">WHATSAPP · {site.whatsappVisible}</a><a href={site.instagram.url}>INSTAGRAM</a><small>© {new Date().getFullYear()} Striking Motion Lab · Madrid</small></footer>
    <a className="mh__sticky" href="#reserva-calendario">RESERVAR EVALUACIÓN · 30 € ↗</a>
  </main>;
}
