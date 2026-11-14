import { useEffect, useState } from 'react';
import './ExploreOverlay.css';
import { useStore } from '../App/store.js';
import { disciplines } from '../Data/Disciplines.js';
import { explore } from '../Data/Content.js';

// Selector visible de disciplinas; el capítulo y la selección 3D comparten estado.
// Vertical = pantalla con aspect < 1,1 (misma frontera que cells.js#EXPLORE_SPLIT_MIN_ASPECT). Solo ahí se muestra el vídeo
// en el panel: en apaisado el personaje ya es el propio 3D, a pantalla grande, a la derecha.
function useStacked() {
  const query = '(min-aspect-ratio: 11/10)';
  const [stacked, setStacked] = useState(() => (typeof window === 'undefined' ? false : !window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setStacked(!mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return stacked;
}

// #rrggbb -> "r, g, b": el color de identidad de cada disciplina como luz translúcida (CSS var), sin color-mix().
function rgbTriplet(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}


// v29 · EXPLORE como SELECCIÓN DE PERSONAJE (no como documento). Misma fuente de estado y mismas acciones que antes; cambia la jerarquía:
//   v30: la SELECCIÓN vive en el 3D (Scene/Environment/ModeStations.jsx: estaciones 01–05 + sockets de disciplina + haz). Los botones de abajo
//   son solo el acceso por teclado / lector de pantalla de esos mismos objetos (.exs__sr); el texto aparece como consecuencia de la selección.
//   Nivel 1 (siempre): disciplina · concepto · acción.  Nivel 2: línea de la disciplina / del concepto.  Nivel 3 (solo si se pide): «Profundizar».
export default function Explore({ onContinue }) {
  const discId = useStore((s) => s.selectedDiscipline);
  const selectDiscipline = useStore((s) => s.selectDiscipline);
  const focus = useStore((s) => s.exploreFocus);
  const activeChapter = useStore((s) => s.activeChapter);
  const setExploreFocus = useStore((s) => s.setExploreFocus);
  const stacked = useStacked();
  const [deep, setDeep] = useState(false);     // Nivel 3 de la disciplina (qué es · cómo · desarrolla · glosario)

  const active = disciplines.find((d) => d.id === discId) || null;

  // Capitulo activo expuesto al CSS (data-sml-chapter en <html>): las secciones DOM de otros capitulos no deben pintarse bajo este overlay.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.smlChapter = activeChapter || '';
    return () => { delete root.dataset.smlChapter; };
  }, [activeChapter]);

  // Cambiar de personaje o de concepto cierra el nivel 3 anterior: la información es consecuencia de la selección, no un resto.
  useEffect(() => { setDeep(false); }, [discId]);
  useEffect(() => {
    if (!discId || activeChapter !== 'character-select') return;
    const target = document.querySelector(`[data-discipline-id="${discId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [discId, activeChapter]);
  useEffect(() => {
    if (activeChapter !== 'character-select') return undefined;
    const root = document.querySelector('.ex-overlay .ex__scroll');
    if (!root) return undefined;
    const syncFigureToCard = () => {
      const rootRect = root.getBoundingClientRect();
      const anchor = rootRect.top + Math.min(130, rootRect.height * 0.38);
      const cards = [...root.querySelectorAll('[data-discipline-id]')];
      const nearest = cards
        .map((node) => ({ node, distance: Math.abs(node.getBoundingClientRect().top - anchor) }))
        .sort((a, b) => a.distance - b.distance)[0]?.node;
      const id = nearest?.getAttribute('data-discipline-id');
      if (id && useStore.getState().selectedDiscipline !== id) selectDiscipline(id);
    };
    root.addEventListener('scroll', syncFigureToCard, { passive: true });
    return () => root.removeEventListener('scroll', syncFigureToCard);
  }, [activeChapter, selectDiscipline]);

  const style = active ? { '--ex-accent': active.accent, '--ex-rgb': rgbTriplet(active.accent) } : undefined;

  // Tocar una disciplina aquí o en el 3D actualiza la misma selección.
  const discSection = (
    <section className="ex__block ex__block--disc" aria-label={explore.disciplinasTitulo}>
      <h3 className="ex__h">{explore.disciplinasTitulo}</h3>
      <div className="ex__figure-rail" role="group" aria-label="Selecciona una disciplina">
        {disciplines.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="ex__figure-label"
            data-active={d.id === discId}
            style={{ "--figure-order": i, "--figure-accent": d.accent, "--figure-rgb": rgbTriplet(d.accent) }}
            aria-pressed={d.id === discId}
            onClick={() => selectDiscipline(d.id)}
          >{d.id === 'k1' ? 'K1' : d.name}</button>
        ))}
      </div>
      <p className={active ? 'ex__pick' : 'exs__hint'} aria-live="polite">{active ? active.linea : explore.intro}</p>
      {active && (
        <button type="button" className="ex__reset" aria-expanded={deep} aria-controls={`ex-detail-${active.id}`} onClick={() => setDeep((v) => !v)}>
          {deep ? explore.cerrar : explore.profundizar} {deep ? '−' : '+'}
        </button>
      )}
      {active && deep && (
        <DisciplineDetail key={active.id} discipline={active} stacked={stacked} onReset={() => { setDeep(false); selectDiscipline(null); }} />
      )}
    </section>
  );

  return (
    <div className={`ex-overlay ${activeChapter === 'character-select' ? 'is-active' : ''}`} aria-hidden={activeChapter !== 'character-select'}>
      <div className="ex">
      <div className="ex__body" data-empty={!active ? 'true' : undefined} data-picked={active ? active.id : 'none'} data-focus={focus} data-deep={deep || undefined} style={style}>
        <div className="ex__glow" aria-hidden="true" />

        <div className="ex__panel">
          <div className="ex__scroll">
            <header className="exs__head">
              <h2 className="ex__title">{explore.titulo}</h2>
              
            </header>

            {discSection}
            {/* V27 · paso 7: objeción de quien llega sin saber qué quiere (puerta DESCUBRIR). La puerta DISCIPLINAS es de quien ya sabe: no se le añade. */}
            
            {/* Entre las dos puertas, sin pasar por el menú: quien llega por DISCIPLINAS sin saber qué quiere descubre; quien descubre puede ver las disciplinas. */}
          </div>
        </div>
      </div>
      </div>
      <button type="button" className="ex__continue" onClick={onContinue}>Continuar a Método <span aria-hidden="true">→</span></button>
    </div>
  );
}

// NIVEL 3 de la disciplina elegida (solo existe tras «Profundizar»): qué es · cómo se entrena · qué desarrolla · glosario. Cajón interno de la escena.
function DisciplineDetail({ discipline: d, stacked, onReset }) {
  const b = explore.bloques;
  return (
    <div className="exs__drawer ex__detail" id={`ex-detail-${d.id}`}>

      <h4 className="ex__dh">{b.que}</h4>
      {d.descripcion.map((p, i) => <p key={i} className="ex__text">{p}</p>)}

      <h4 className="ex__dh">{b.como}</h4>
      <p className="ex__text">{d.entrenamiento}</p>

      <h4 className="ex__dh">{b.desarrolla}</h4>
      <ul className="ex__attrs">{d.atributos.map((a) => <li key={a}>{a}</li>)}</ul>

      {d.glosario?.length > 0 && (
        <>
          <h4 className="ex__dh">{b.glosario}</h4>
          <dl className="ex__gloss">
            {d.glosario.map((g) => (
              <div key={g.t}><dt>{g.t}</dt><dd>{g.d}</dd></div>
            ))}
          </dl>
        </>
      )}

      <button type="button" className="ex__reset" onClick={onReset}>{explore.verLas3}</button>
    </div>
  );
}


