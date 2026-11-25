import { useEffect, useState } from 'react';
import { useStore } from '../../App/store.js';
import { goToSection, irAReservar } from '../../Scene/Transitions/navigation.js';

// NAVEGACIÓN = «¿A qué parte de SML quiero ir?». Cada entrada lleva DIRECTAMENTE a su destino.
// Método es una página independiente: no salta al capítulo del recorrido inmersivo.
const MAIN = [
  { id: 'disciplinas', label: 'Disciplinas', target: 'disciplinas' },
  { id: 'method', label: 'Método', target: 'method' },
  { id: 'training', label: 'Entrenamiento', target: 'training' },
  { id: 'founder', label: 'Sobre Alex', target: 'founder' },
  { id: 'experiences', label: 'Empresas', target: 'experiences' },
];
const ACTION = { id: 'book', label: 'Reservar' };

export default function Navigation() {
  const section = useStore((s) => s.activeSection);
  const [open, setOpen] = useState(false);
  const [faqOn, setFaqOn] = useState(false);

  useEffect(() => {
    const el = document.getElementById('faq');
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setFaqOn(e.isIntersecting), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navOpen = open ? 'true' : 'false';
    return () => { delete root.dataset.navOpen; };
  }, [open]);

  const overFaq = faqOn && section !== 'experiences' && section !== 'estudio';
  const isOn = (target) => !overFaq && section === target;

  const go = (target) => {
    setOpen(false);
    if (target === 'method') {
      window.location.assign('/metodo');
      return;
    }
    goToSection(target, { direct: target !== 'explore' });
  };

  return (
    <nav className="nav" aria-label="Navegación principal" data-open={open}>
      <button type="button" className="nav__toggle" aria-expanded={open} aria-controls="nav-list" onClick={() => setOpen((o) => !o)}>
        {open ? 'Cerrar' : 'Menú'}
      </button>
      <ul id="nav-list" className="nav__list">
        {MAIN.map((it) => (
          <li key={it.id} data-on={isOn(it.target)} data-id={it.id}>
            <button type="button" aria-current={isOn(it.target) ? 'true' : undefined} onClick={() => go(it.target)}>
              {it.label}
            </button>
          </li>
        ))}
        <li data-on={isOn('book')} data-id={ACTION.id}>
          <button type="button" aria-current={isOn('book') ? 'true' : undefined} onClick={() => { setOpen(false); irAReservar(); }}>
            {ACTION.label}
          </button>
        </li>
      </ul>
    </nav>
  );
}
