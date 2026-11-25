import React from 'react';

export default function EntryInterface({ hero, site, activeService, chooseService, go }) {
  return (
    <div className="hero-world-interface" aria-label="Entrenamiento de striking en Madrid">
      <div className="hero-world-copy">
        <p className="hero-overline">{hero.kicker}</p>
        <h1>Técnica de competición.<br/><em>A tu medida.</em></h1>
        <p className="hero-context">Entrenamiento personal y en grupos reducidos para mejorar tu técnica, forma física y confianza, empieces desde cero o no.</p>
        <p className="hero-start-note">¿Empiezas desde cero? No necesitas experiencia previa. Entrenamos desde tu nivel y llevo el material.</p>
        <div className="hero-actions hero-actions--editorial">
          <a className="primary-cta" href={site.calendly} target="_blank" rel="noopener noreferrer"><span>Reservar evaluación · 30 €</span><span aria-hidden="true">↗</span></a>
          <button className="secondary-cta" type="button" onClick={() => go('metodo')}>Conocer el método <span aria-hidden="true">↗</span></button>
        </div>
        <p className="hero-cta-note">Sesión privada de evaluación. Si contratas un plan mensual, descontamos los 30 € del primer mes.</p>
      </div>
      <div className="hero-world-stations" aria-label="Elige cómo quieres entrenar">
        <div className="hero-world-benefits">
          <div><b>01</b><span>Análisis técnico</span></div>
          <div><b>02</b><span>Entrenamiento adaptado</span></div>
          <div><b>03</b><span>Progreso medible</span></div>
        </div>
        <p className="hero-console-label">SELECCIONA TU FORMATO</p>
        <div className="hero-world-formats">
          <button type="button" className={activeService === 'individual' ? 'is-selected' : ''} aria-pressed={activeService === 'individual'} onClick={() => { chooseService('individual'); go('entrenamiento'); }}><span className="station-number">01</span><strong>1:1</strong><small>Individual</small></button>
          <button type="button" className={activeService === 'parejas' ? 'is-selected' : ''} aria-pressed={activeService === 'parejas'} onClick={() => { chooseService('parejas'); go('entrenamiento'); }}><span className="station-number">02</span><strong>Parejas</strong><small>Dos personas</small></button>
          <button type="button" className={activeService === 'grupos' ? 'is-selected' : ''} aria-pressed={activeService === 'grupos'} onClick={() => { chooseService('grupos'); go('entrenamiento'); }}><span className="station-number">03</span><strong>Grupos</strong><small>Máximo 4</small></button>
        </div>
        <div className="hero-world-proof">{hero.confianza}</div>
        <nav className="hero-world-links" aria-label="Accesos rápidos"><button type="button" onClick={() => go('entrenamiento')}>Precios</button><button type="button" onClick={() => go('empresas')}>Empresas y eventos</button><button type="button" onClick={() => go('entrenamiento')}>Explorar recorrido ↓</button></nav>
      </div>
    </div>
  );
}
