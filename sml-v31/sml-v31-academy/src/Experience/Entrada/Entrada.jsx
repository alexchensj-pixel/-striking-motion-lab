import Chapter from '../Chapter.jsx';
import { hero } from '../../Data/Content.js';
import { goToSection } from '../../Scene/Transitions/navigation.js';

// Entrada editorial estática: un solo mensaje legible sobre la escena 3D.
// La cámara y el mundo siguen avanzando con el scroll; el copy no se pisa ni compite consigo mismo.
export default function Entrada() {
  return (
    <Chapter id="entrada" className="ent">
      <div className="ent__hero">
        <p className="ent__marca">{hero.marca}</p>
        <h1 className="ent__titulo">
          {hero.titulo.map((line) => <span key={line}>{line}</span>)}
        </h1>
        <p className="ent__disc">{hero.disciplinasLinea}</p>
        <p className="ent__support">{hero.contexto}</p>
        <div className="ent__actions">
          <button type="button" className="ent__reservar" onClick={() => goToSection('reserva')}>{hero.ctaReservar}</button>
          <button type="button" className="ent__b2bLink" onClick={() => goToSection('asesoria-lab')}>CONOCER EL MÉTODO ↓</button>
          <button type="button" className="ent__b2bLink" onClick={() => goToSection('slot')}>VER PRECIOS →</button>
          <button type="button" className="ent__b2bLink" onClick={() => goToSection('slot')}>GRUPOS Y HORARIOS →</button>
          <button type="button" className="ent__b2bLink" onClick={() => goToSection('experiences')}>EMPRESAS · HOTELES · EVENTOS</button>
        </div>
      </div>
    </Chapter>
  );
}
