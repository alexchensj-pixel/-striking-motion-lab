import { useEffect, useRef } from 'react';
import { useStore } from '../../App/store.js';
import { evaluacionInicialTexto, ratingTexto, site, waLink } from '../../Data/Content.js';
import { existingPlans } from '../../Data/Programs.js';
import { goToSection } from '../../Scene/Transitions/navigation.js';
import { FaqContextual } from '../Faq/Faq.jsx';
import './primeraVez.css';

// ES MI PRIMERA VEZ — pantalla breve y OPCIONAL para quien duda antes de reservar. Overlay propio sobre el canvas 3D (mismo patrón que
// Estudio y Experiences): no toca capítulos, cámara ni scroll de fondo, y al cerrar la persona vuelve exactamente donde estaba.
// NO es un paso previo: RESERVAR sigue a un toque desde el Inicio, el menú y el CTA fijo sin pasar por aquí.
// Todo el texto sale de Data/Content.js (evaluación inicial, nota y nº de reseñas en Google, logro, FAQ). No hay testimonios ni promesas nuevas.
const PREGUNTAS = [
  '¿Puedo empezar completamente desde cero?',
  '¿Tengo que estar en forma para empezar?',
  '¿Tengo que hacer sparring?',
  '¿Tengo que comprar material?',
  '¿Qué ocurre en mi primera sesión?',
];

export default function PrimeraVez() {
  const open = useStore((s) => s.primeraVezOpen);
  const close = useStore((s) => s.closePrimeraVez);
  const stage = useRef(null);
  const from = useRef(null);

  // Carga directa con #primera-vez: abre el overlay (igual que #estudio).
  useEffect(() => { if (window.location.hash === '#primera-vez') useStore.getState().openPrimeraVez(); }, []);

  useEffect(() => {
    if (!open) return undefined;
    from.current = document.activeElement;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden'; // la página queda congelada; al cerrar, la persona vuelve exactamente donde estaba
    history.replaceState(null, '', '#primera-vez');
    stage.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev;
      history.replaceState(null, '', window.location.pathname + window.location.search);
      from.current?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;
  const precio = existingPlans.find((p) => p.id === '1-1')?.precio ?? 30;

  return (
    <section id="pv" role="region" aria-label="Es mi primera vez">
      <header className="pv__top">
        <span className="pv__brand">SML</span>
        <span className="pv__where">Es mi primera vez</span>
        <button type="button" className="pv__close" onClick={close}>Volver ×</button>
      </header>

      <main className="pv__stage" ref={stage} tabIndex={0} aria-label="Es mi primera vez: confianza y dudas frecuentes">
        <div className="pv__col">
          <h2 className="pv__h">Es mi primera vez</h2>
          <p className="pv__p">{evaluacionInicialTexto}</p>

          <div className="pv__trust">
            <p className="pv__rate">{ratingTexto}</p>
            <a className="pv__link" href={site.maps} target="_blank" rel="noopener noreferrer">Ver las reseñas en Google →</a>
            <p className="pv__logro">{site.logro}</p>
          </div>

          <p className="pv__k">Dudas frecuentes</p>
          <div className="pv__faq">
            {PREGUNTAS.map((q) => <FaqContextual key={q} q={q} />)}
          </div>

          <button type="button" className="pv__explore" onClick={() => goToSection('explore', { direct: true })}>Prefiero explorar la web primero →</button>
        </div>
      </main>

      <div className="pv__bar">
        <button type="button" className="pv__cta" onClick={() => goToSection('book')}>Reservar evaluación · {precio} €</button>
        <a className="pv__alt" href={waLink('Hola, tengo una duda antes de reservar mi primera sesión.')} target="_blank" rel="noopener noreferrer">¿Dudas? Escríbenos por WhatsApp · {site.whatsappVisible}</a>
      </div>
    </section>
  );
}
