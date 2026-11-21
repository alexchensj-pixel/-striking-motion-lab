import React from 'react';
import { site, waLink } from '../Data/Content.js';
import { image } from '../Data/Media.js';
import Calendly from '../Experience/Reserva/Calendly.jsx';
import './SalesLanding.css';

const services = [
  { number: '01', title: 'Entrenamiento privado', text: 'Una sesión individual para trabajar técnica, movimiento y condición física a tu ritmo.', detail: '1:1 · Adaptado a tu nivel y objetivo' },
  { number: '02', title: 'Entrenamiento en pareja', text: 'Entrenad juntos con una sesión guiada y ajustada a vuestro punto de partida.', detail: 'Dos personas · Atención del entrenador' },
  { number: '03', title: 'Grupos reducidos', text: 'Entrena con otras personas en grupos pequeños, con seguimiento directo durante la sesión.', detail: 'Plazas limitadas · Material incluido' },
];

export default function SalesLanding() {
  return (
    <main className="sml-sales">
      <header className="sml-sales__nav">
        <a className="sml-sales__brand" href="#inicio" aria-label="Striking Motion Lab, inicio">STRIKING <span>MOTION</span> LAB</a>
        <nav aria-label="Navegación principal"><a href="#entrenamientos">Entrenamientos</a><a href="#chen">Sobre mí</a><a className="sml-sales__nav-cta" href="#reserva">Reservar evaluación · 30 €</a></nav>
      </header>
      <section className="sml-sales__hero" id="inicio">
        <img className="sml-sales__hero-image" src={image.heroLab} alt="Entrenamiento real de deportes de contacto en Striking Motion Lab" />
        <div className="sml-sales__hero-shade" />
        <div className="sml-sales__hero-copy">
          <p className="sml-sales__eyebrow">ENTRENAMIENTO PERSONAL · MADRID</p>
          <h1>Aprende a golpear.<br/><em>Entrena a tu manera.</em></h1>
          <p className="sml-sales__lead">Muay Thai · Boxeo · Kickboxing · K1</p>
          <p className="sml-sales__intro">Entrenamientos privados, en pareja y en grupos reducidos. Adaptamos el trabajo a tu nivel, tus objetivos y tu experiencia.</p>
          <div className="sml-sales__actions"><a className="sml-sales__button sml-sales__button--primary" href="#reserva">Reserva tu evaluación · 30 €</a><a className="sml-sales__button sml-sales__button--ghost" href={waLink('Hola, quiero información sobre los entrenamientos de Striking Motion Lab.')}>Pregúntame por WhatsApp</a></div>
          <p className="sml-sales__micro">La evaluación es presencial y privada. Si continúas con un plan mensual, los 30 € se descuentan del primer pago.</p>
        </div>
        <div className="sml-sales__hero-index">MADRID <span>·</span> 01 / 03</div>
      </section>
      <section className="sml-sales__services sml-sales__section" id="entrenamientos">
        <div className="sml-sales__section-head"><p className="sml-sales__eyebrow">ELIGE CÓMO ENTRENAR</p><h2>Un entrenamiento.<br/><em>Tu punto de partida.</em></h2><p>Da igual si empiezas desde cero o si ya tienes experiencia. Lo importante es trabajar con un proceso que tenga sentido para ti.</p></div>
        <div className="sml-sales__service-grid">{services.map((service) => <article className="sml-sales__service" key={service.number}><span>{service.number}</span><h3>{service.title}</h3><p>{service.text}</p><small>{service.detail}</small></article>)}</div>
      </section>
      <section className="sml-sales__method sml-sales__section"><div><p className="sml-sales__eyebrow">CÓMO EMPEZAMOS</p><h2>Primero te conozco.<br/><em>Después construimos.</em></h2></div><div className="sml-sales__method-copy"><p>Empezamos con una evaluación inicial presencial. Hablamos de tus objetivos, vemos tu punto de partida y trabajamos durante una sesión privada.</p><p>A partir de ahí definimos cómo entrenar y qué frecuencia encaja contigo. No tienes que elegir una disciplina ni tener experiencia antes de empezar.</p><a href="#reserva">Ver disponibilidad <span>↗</span></a></div></section>
      <section className="sml-sales__coach sml-sales__section" id="chen"><img src={image.chenRing} alt="Chen en el entorno de entrenamiento de deportes de contacto" loading="lazy"/><div className="sml-sales__coach-copy"><p className="sml-sales__eyebrow">TU ENTRENADOR</p><h2>Entrena conmigo.<br/><em>Construye tu camino.</em></h2><p>Soy Chen. Compito y entreno en deportes de contacto. Mi trabajo es ayudarte a aprender, mejorar y disfrutar del proceso, tanto si empiezas de cero como si buscas llevar tu entrenamiento más lejos.</p><p className="sml-sales__achievement">3.º · Copa de España 2025 · FEKM / WAKO</p><p className="sml-sales__rating">5,0 ★ <span>· 18 reseñas en Google</span></p></div></section>
      <section className="sml-sales__booking sml-sales__section" id="reserva"><div className="sml-sales__booking-head"><p className="sml-sales__eyebrow">DA EL PRIMER PASO</p><h2>Reserva tu evaluación<br/><em>inicial · 30 €</em></h2><p>Elige el día y la hora que mejor te encajen. La sesión dura 60 minutos y es privada.</p><p className="sml-sales__booking-note">Si después contratas un plan mensual, los 30 € se descuentan del primer pago. El pago de la sesión se gestiona aparte, no online.</p></div><Calendly /></section>
      <footer className="sml-sales__footer"><a className="sml-sales__brand" href="#inicio">STRIKING <span>MOTION</span> LAB</a><p>Muay Thai · Boxeo · Kickboxing · K1 · Madrid</p><div><a href={waLink('Hola, quiero información sobre los entrenamientos.')}>WhatsApp</a><a href={site.instagram.url}>Instagram</a><a href={site.maps}>Ubicación</a></div><small>© {new Date().getFullYear()} Striking Motion Lab</small></footer>
      <a className="sml-sales__mobile-cta" href="#reserva">Reservar evaluación · 30 €</a>
    </main>
  );
}
