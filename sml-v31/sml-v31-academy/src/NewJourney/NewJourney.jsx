import React, { useEffect, useRef, useState } from 'react';
import SpatialWorld from './scene/SpatialWorld.jsx';
import './styles.css';
import { RUTAS } from '../Data/Legal.js';

const WHATSAPP = 'https://wa.me/34603809155?text=' + encodeURIComponent('Hola, quiero reservar una sesión en Striking Motion Lab.');

const sections = [
  { id: 'training', number: '01', eyebrow: 'THE TRAINING FLOOR', title: <>TRAIN<br/><em>WITH INTENT.</em></>, copy: 'Boxeo · Kickboxing · Muay Thai. Entrenamiento personalizado, técnica aplicada y progreso medible.', action: 'Explorar entrenamiento' },
  { id: 'method', number: '02', eyebrow: 'THE METHOD', title: <>BUILT<br/><em>AROUND YOU.</em></>, copy: 'Te conocemos. Observamos cómo te mueves. Diseñamos cada sesión para tu nivel, tu objetivo y tu evolución.', action: 'Descubrir el método' },
  { id: 'contact', number: '03', eyebrow: 'ENTER THE LAB', title: <>YOUR MOVE<br/><em>STARTS HERE.</em></>, copy: 'Sesiones 1:1, parejas y grupos reducidos en Madrid. Sin intimidación. Sin fórmulas genéricas.', action: 'Reservar por WhatsApp' }
];

export default function NewJourney() {
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('nj-page');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => document.documentElement.classList.remove('nj-page');
  }, []);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
      const marker = window.scrollY + window.innerHeight * 0.55;
      let current = 0;
      sections.forEach((section, index) => {
        const node = document.getElementById(section.id);
        if (node && marker >= node.offsetTop) current = index;
      });
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const go = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="nj">
      <SpatialWorld progress={progress} />
      <div className="nj-grain" aria-hidden="true" />
      <header className="nj-topbar">
        <a className="nj-brand" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="nj-brand-mark">S<span>/</span>ML</span><span className="nj-brand-caption">STRIKING MOTION LAB<br/>MADRID · EST. 2025</span>
        </a>
        <button className="nj-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Abrir navegación"><span/><span/></button>
        <nav className={menuOpen ? 'nj-nav nj-nav-open' : 'nj-nav'}>
          {sections.map((s) => <button key={s.id} onClick={() => go(s.id)}>{s.eyebrow}</button>)}
        </nav>
        <span className="nj-top-index">SPATIAL EXPERIENCE / 001</span>
      </header>

      <main id="top">
        <section className="nj-hero" aria-label="Striking Motion Lab">
          <div className="nj-hero-kicker"><span className="nj-live-dot"/> PERSONAL COMBAT SPORTS LAB <span>·</span> MADRID</div>
          <div className="nj-hero-title-wrap">
            <p className="nj-hero-overline">MOVE WITH INTENT</p>
            <h1>STRIKING<br/><span>MOTION</span><b>LAB.</b></h1>
          </div>
          <div className="nj-hero-bottom">
            <p>TRAINING IS NOT<br/>ABOUT FIGHTING.<br/><strong>IT'S ABOUT HOW YOU MOVE.</strong></p>
            <button className="nj-round-cta" onClick={() => go('training')} aria-label="Entrar en el laboratorio"><span>ENTER<br/>THE LAB</span><b>↘</b></button>
          </div>
          <div className="nj-hero-coordinate">40°25' N&nbsp; 3°42' W<br/>MADRID / SPAIN</div>
          <div className="nj-scroll-cue"><span/> SCROLL TO EXPLORE</div>
        </section>

        {sections.map((section, index) => (
          <section className={`nj-journey-section nj-section-${index + 1}`} id={section.id} key={section.id}>
            <div className="nj-section-meta"><span>{section.number} / 03</span><span>{section.eyebrow}</span></div>
            <div className="nj-section-content">
              <p className="nj-section-kicker"><i/> {section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p className="nj-section-copy">{section.copy}</p>
              {index === 0 && <div className="nj-discipline-list"><span>BOXING</span><span>KICKBOXING</span><span>MUAY THAI</span></div>}
              {index === 1 && <div className="nj-method-steps"><span>01 / OBSERVE</span><span>02 / TRAIN</span><span>03 / EVOLVE</span></div>}
              {index === 2 ? <a className="nj-text-cta" href={WHATSAPP} target="_blank" rel="noreferrer">{section.action}<b>↗</b></a> : <button className="nj-text-cta" onClick={() => go(sections[index + 1].id)}>{section.action}<b>↘</b></button>}
            </div>
            <div className="nj-section-side-note">STRIKING MOTION LAB <span>—</span> MADRID</div>
          </section>
        ))}
      </main>

      <div className="nj-progress-rail"><span style={{ transform: `scaleY(${progress.current || 0})` }}/></div>
      <div className="nj-chapter-indicator"><span>0{active + 1}</span><i/>03</div>
      <footer className="nj-footer"><span>© {new Date().getFullYear()} STRIKING MOTION LAB</span><span>MOVE WITH INTENT / 1% BETTER EVERYDAY</span><a href="https://www.instagram.com/strikingmotionlab/" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><span><a href={RUTAS.privacidad}>PRIVACIDAD</a> · <a href={RUTAS.aviso}>AVISO LEGAL</a> · <a href="/academia">ACADEMIA</a> · <a href="/mi-sml">MI SML</a></span></footer>
    </div>
  );
}