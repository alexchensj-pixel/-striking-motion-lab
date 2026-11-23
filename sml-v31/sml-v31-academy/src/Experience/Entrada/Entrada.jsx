import Chapter from '../Chapter.jsx';
import { hero } from '../../Data/Content.js';
import { goToSection } from '../../Scene/Transitions/navigation.js';
import './HeroConversion.css';

// Hero comercial: conserva el lenguaje visual cinematográfico y ordena la información
// como en la referencia aprobada: propuesta, explicación, formatos y reserva.
export default function Entrada() {
  return (
    <Chapter id="entrada" className="ent">
      <div className="hc-hero">
        <header className="hc-top">
          <span className="hc-logo">S<span>/</span>ML</span>
          <span className="hc-city">STRIKING MOTION LAB<br />MADRID</span>
        </header>

        <p className="hc-kicker">{hero.marca}</p>
        <h1 className="hc-title">
          <span>ENTRENA CON</span>
          <span>METODOLOGÍA DE</span>
          <span>COMPETICIÓN.</span>
          <span className="hc-title-accent">APRENDE A GOLPEAR</span>
          <span className="hc-title-accent">CON CRITERIO.</span>
        </h1>

        <p className="hc-description">
          Entrenamiento personalizado basado en la observación técnica, el análisis del movimiento y la corrección individual. Adaptado a tu nivel y tus objetivos, incluso si empiezas desde cero.
        </p>

        <div className="hc-divider" />
        <p className="hc-formats">INDIVIDUAL <i>·</i> PAREJAS <i>·</i> GRUPOS REDUCIDOS</p>

        <div className="hc-actions">
          <button type="button" className="hc-primary" onClick={() => goToSection('reserva')}>
            {hero.ctaReservar}
          </button>
          <button type="button" className="hc-secondary" onClick={() => goToSection('asesoria-lab')}>
            CONOCER EL MÉTODO <span>↓</span>
          </button>
          <nav className="hc-links" aria-label="Accesos rápidos">
            <button type="button" onClick={() => goToSection('slot')}>VER PRECIOS</button>
            <span>·</span>
            <button type="button" onClick={() => goToSection('slot')}>GRUPOS Y HORARIOS</button>
          </nav>
        </div>

        <div className="hc-divider hc-divider-bottom" />
        <p className="hc-footer">TÉCNICA <i>·</i> ANÁLISIS <i>·</i> PROGRESIÓN</p>
      </div>
    </Chapter>
  );
}
