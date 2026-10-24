import { gsap } from './gsap.js';
import { chapters } from '../../Data/Content.js';
import { useStore } from '../../App/store.js';
import { SECTIONS, SECTION_CHAPTER, SECTION_HASH, HASH_SECTION } from '../../App/sections.js';
import { prefersReducedMotion, scrollState, BRIDGE_END } from './scrollState.js';

const els = {};
export const registerChapterEl = (id, el) => { els[id] = el; };

const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;
const go = (y, duration) => {
  stopBridgeTour();
  return gsap.to(window, { scrollTo: { y, autoKill: true }, duration: prefersReducedMotion ? 0 : duration, ease: 'power3.inOut' });
};

// SALTO DIRECTO: coloca la página en `y` sin recorrer la película intermedia. El progreso de cada tramo (ScrollTrigger) es
// posicional, así que todo lo anterior queda "ya recorrido" y todo lo posterior "sin empezar": el estado es coherente.
// La cámara no viaja por el mundo: un velo breve cubre el cambio y la cámara se coloca en su sitio (ver Camera/index.jsx).
const JUMP_IN = 0.16;
const JUMP_OUT = 0.4;
let jumpTl = null;
export function jumpTo(y) {
  stopBridgeTour();
  gsap.killTweensOf(window);
  jumpTl?.kill();
  if (prefersReducedMotion) {
    scrollState.snapUntil = performance.now() + 250;
    window.scrollTo(0, y);
    return;
  }
  jumpTl = gsap.timeline()
    .to(scrollState, { jump: 1, duration: JUMP_IN, ease: 'power1.in' })
    .add(() => { scrollState.snapUntil = performance.now() + 250; window.scrollTo(0, y); })
    .to(scrollState, { jump: 0, duration: JUMP_OUT, ease: 'power1.out' });
}

// HOME → EXPLORE por DESCUBRIR (o ↓ desde HOME): un scroll de una sola pieza cruzaba el Bridge a máxima velocidad (cada ejemplo, < 0,5 s).
// Ahora el recorrido se detiene un momento en cada bloque (cuerpo · Tyson · McGregor · combate · mapa completo) y sigue hasta EXPLORE.
// Son posiciones de scroll reales: lo que se ve es exactamente lo mismo que al deslizar a mano. Cualquier gesto de la persona (rueda,
// toque, tecla) lo detiene y le devuelve el control donde esté. Con «reducir movimiento», salto directo como el resto de la navegación.
// BRIDGE_STOPS = progreso LOCAL del Bridge (Experience/Entrada/Bridge.jsx#build), a mitad de cada bloque · [parada, pausa en s].
const STEP_DURATION = 2.2;
const crossesBridge = (from, to) => from === 'entrada' && to === 'character-select';
const BRIDGE_STOPS = [[0.08, 1.1], [0.215, 1.3], [0.35, 1.3], [0.485, 1.1], [0.93, 1.6]];
const BRIDGE_MOVE = 0.9;
const INTERRUPT = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
let bridgeTour = null;

function stopBridgeTour() {
  if (!bridgeTour) return;
  bridgeTour.kill();
  bridgeTour = null;
  INTERRUPT.forEach((ev) => window.removeEventListener(ev, stopBridgeTour, true));
}

function tourBridge(targetY) {
  const th = document.querySelector('[data-threshold="entrada>character-select"]');
  if (!th || prefersReducedMotion) { jumpTo(targetY); return; }
  gsap.killTweensOf(window);
  jumpTl?.kill();
  stopBridgeTour();
  const H = window.innerHeight;
  const start = topOf(th) - H; // el umbral empieza a contar cuando asoma por abajo (Threshold.jsx: 'top bottom' → 'bottom top')
  const span = th.offsetHeight + H;
  const tl = gsap.timeline({ onComplete: stopBridgeTour });
  BRIDGE_STOPS.forEach(([local, hold], i) => {
    const y = start + local * BRIDGE_END * span;
    if (y <= window.scrollY) return; // ya se ha pasado ese bloque
    tl.to(window, { scrollTo: { y, autoKill: false }, duration: i === 0 ? 1.6 : BRIDGE_MOVE, ease: 'sine.inOut' })
      .to({}, { duration: hold });
  });
  tl.to(window, { scrollTo: { y: targetY, autoKill: false }, duration: 1.8, ease: 'sine.inOut' });
  bridgeTour = tl;
  INTERRUPT.forEach((ev) => window.addEventListener(ev, stopBridgeTour, { capture: true, passive: true }));
}

// Capítulo (o 'faq') → posición. Nunca recorre capítulos intermedios.
export function jumpToChapter(id) {
  if (els[id]) jumpTo(topOf(els[id]));
}

// Distancia en capítulos entre el activo y el destino ('faq' cuenta como medio paso después de 'slot').
const orderOf = (id) => (id === 'faq' ? chapters.findIndex((c) => c.id === 'slot') + 0.5 : chapters.findIndex((c) => c.id === id));

// Scroll animado a un capítulo. Entre capítulos contiguos conserva el recorrido cinematográfico de siempre; si el destino está
// a más de un paso, salta directamente (ninguna acción obliga a atravesar toda la película anterior).
export function scrollToChapter(id, duration) {
  if (!els[id]) return;
  const active = useStore.getState().activeChapter;
  const dist = Math.abs(orderOf(id) - orderOf(active));
  if (dist > 1) jumpTo(topOf(els[id]));
  else if (crossesBridge(active, id)) tourBridge(topOf(els[id]));
  else go(topOf(els[id]), duration ?? STEP_DURATION);
}

// p = 0..1 dentro del capítulo (p.ej. saltar a un sub-estado del laboratorio).
export function scrollToChapterProgress(id, p, duration = 1.2) {
  const el = els[id];
  if (!el) return;
  go(topOf(el) + p * (el.offsetHeight - window.innerHeight), duration);
}

// HASH / HISTORIAL (PASO 1). Cada salto de menú hace pushState; popstate y la carga con hash llaman a goToSection sin volver a pushear.
// B2B (#empresas) y Estudio (#estudio) siguen escribiendo su propio hash con replaceState al abrirse y lo borran al cerrarse; aquí solo
// se coordinan con ellos: antes de abrirlos se duplica la entrada actual (su replaceState pisa la copia y el «atrás» vuelve al punto
// anterior) y, si había un overlay abierto, el hash nuevo se escribe con replaceState DESPUÉS de que su limpieza haya corrido.
const hashOf = (id) => (SECTION_HASH[id] ? `#${SECTION_HASH[id]}` : '');
const urlFor = (hash) => window.location.pathname + window.location.search + hash;
function writeHash(id, mode) {
  const hash = hashOf(id);
  if (window.location.hash === hash) return;
  try { history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', urlFor(hash)); } catch { /* entorno sin History API */ }
}

// Posición dentro de un capítulo con pasos (0..1), para volver a ENTRENAMIENTO / MÉTODO / CHEN donde se quedó la persona.
const RESUME_CHAPTERS = ['asesoria-lab', 'slot', 'proof-chen'];
const savedProgress = {};
function rememberProgress(chapter) {
  const el = els[chapter];
  if (!el || !RESUME_CHAPTERS.includes(chapter)) return;
  const range = el.offsetHeight - window.innerHeight;
  if (range <= 0) return;
  savedProgress[chapter] = Math.min(1, Math.max(0, (window.scrollY - topOf(el)) / range));
}
function jumpToChapterResuming(chapter) {
  const el = els[chapter];
  if (!el) return;
  const p = savedProgress[chapter];
  const range = el.offsetHeight - window.innerHeight;
  if (p > 0.02 && p < 0.98 && range > 0) jumpTo(topOf(el) + p * range);
  else jumpToChapter(chapter);
}

// NAVEGACIÓN POR SECCIÓN (V22). UI state primero, respuesta 3D después:
//   1) se cierra lo que esté encima (B2B) · 2) se fija activeSection · 3) BOOK abre el calendario · 4) la escena se coloca.
// Funciona desde cualquier sección hacia cualquier otra, sin pasar por las intermedias. NO borra ninguna decisión del store
// (selectedTrainingMode, selectedDiscipline, selectedFormat, selectedFrequency, planHibrido, substage…).
//   opts.push   false → no toca el historial (lo usan popstate y la carga con hash)
//   opts.direct true  → ni siquiera DESCUBRIR recorre el Bridge (carga con hash / «atrás»)
export function goToSection(id, opts = {}) {
  if (!SECTIONS.includes(id)) return;
  const { push = true, direct = false } = opts;
  const st = useStore.getState();
  const hadOverlay = st.b2bOpen || st.estudioOpen;
  if (st.b2bOpen && id !== 'experiences') st.closeB2B();
  if (st.estudioOpen && id !== 'estudio') st.closeEstudio();

  // Overlays: no tocan capítulos, cámara ni scroll. Antes de abrirlos se duplica la entrada de historial (ver arriba).
  if (id === 'estudio' || id === 'experiences') {
    const alreadyOpen = id === 'estudio' ? st.estudioOpen : st.b2bOpen;
    if (push && !alreadyOpen) { try { history.pushState(null, '', urlFor(window.location.hash)); } catch { /* sin History API */ } }
    if (id === 'estudio') st.openEstudio(); else st.openB2B(0); // activeSection lo fija el propio open*
    return;
  }

  const chapter = SECTION_CHAPTER[id];
  const isExplore = id === 'explore' || id === 'disciplinas';
  const sameChapter = chapter && useStore.getState().activeChapter === chapter;
  if (!sameChapter) rememberProgress(useStore.getState().activeChapter); // antes de moverse: dónde se queda la persona

  st.setActiveSection(id);
  if (isExplore) st.setExploreFocus(id === 'disciplinas' ? 'disciplinas' : 'modos');
  if (id === 'book') st.openBooking();

  // Historial: con overlay abierto su limpieza (replaceState) corre tras el render, así que el hash se escribe después y reemplazando.
  if (hadOverlay) setTimeout(() => writeHash(id, 'replace'), 0);
  else if (push) writeHash(id, 'push');

  if (!chapter) return;
  // DISCIPLINAS ↔ DESCUBRIR dentro de character-select: solo cambia el foco, sin volver a saltar.
  if (isExplore && sameChapter) return;
  // Ya estás en ese capítulo (sin overlay encima): no se recoloca ni se reinicia el paso en el que estabas.
  if (sameChapter) return;
  // Desde HOME, DESCUBRIR se alcanza ATRAVESANDO el Bridge (cuerpo → combate → mapa → disciplinas). DISCIPLINAS desde HOME y DESCUBRIR
  // desde cualquier otra sección son salto directo (la persona ya sabe lo que quiere o ya conoce la narrativa).
  if (id === 'explore' && !direct && st.activeChapter === 'entrada') scrollToChapter(chapter);
  else if (RESUME_CHAPTERS.includes(chapter)) jumpToChapterResuming(chapter);
  else jumpToChapter(chapter);
}

// Hash → sección. Los hashes de B2B/Estudio los abre goToSection igual (popstate), pero en la carga inicial los resuelven sus overlays.
function sectionFromHash() {
  const key = window.location.hash.replace(/^#/, '');
  return HASH_SECTION[key];
}
function onPopState() {
  const id = sectionFromHash() ?? (window.location.hash ? null : 'home');
  // «Atrás» con Empresas / Estudio abierto = cerrar el overlay y quedarse donde estaba la persona (el scroll no se movió bajo él).
  // Sin esto, un hash antiguo (el scroll no escribe hash) la llevaba a otra sección o a HOME.
  const st = useStore.getState();
  if ((st.b2bOpen || st.estudioOpen) && id !== 'experiences' && id !== 'estudio') {
    if (st.b2bOpen) st.closeB2B(); else st.closeEstudio();
    return;
  }
  if (id) goToSection(id, { push: false, direct: true });
}

let historyReady = false;
export function initHistoryNavigation() {
  if (historyReady || typeof window === 'undefined') return;
  historyReady = true;
  window.addEventListener('popstate', onPopState);

  // Cerrar B2B/Estudio con Esc / botón: su limpieza borra el hash; se restituye el de la sección en pantalla (replace, sin entrada nueva).
  useStore.subscribe((s, prev) => {
    const closed = (prev.b2bOpen && !s.b2bOpen) || (prev.estudioOpen && !s.estudioOpen);
    if (closed && !s.b2bOpen && !s.estudioOpen) setTimeout(() => writeHash(useStore.getState().activeSection, 'replace'), 0);
  });

  // Carga directa con hash de B2C (#metodo…): espera a que los capítulos se registren y salta sin pushear. #empresas y #estudio los abren sus overlays.
  const id = sectionFromHash();
  if (!id || id === 'home' || id === 'experiences' || id === 'estudio') return;
  const chapter = SECTION_CHAPTER[id];
  let tries = 0;
  const wait = () => {
    if (els[chapter] || tries++ > 180) {
      if (els[chapter]) setTimeout(() => goToSection(id, { push: false, direct: true }), 150); // deja que ScrollTrigger calcule los tramos
      return;
    }
    requestAnimationFrame(wait);
  };
  wait();
}
if (typeof window !== 'undefined') initHistoryNavigation();

// Ruta directa a la reserva (BOOK): abre el calendario de la Sesión Privada (30 €) desde cualquier sección.
export function irAReservar() {
  goToSection('book');
}

// Salto directo a un punto de la página que no es sección (p.ej. FAQ).
export function goToAnchor(id) {
  const st = useStore.getState();
  if (st.b2bOpen) st.closeB2B();
  if (st.estudioOpen) st.closeEstudio();
  jumpToChapter(id);
}

// ↑/↓: capítulo anterior / siguiente, con el recorrido animado (son contiguos).
export function stepChapter(dir) {
  const i = chapters.findIndex((c) => c.id === useStore.getState().activeChapter);
  const next = chapters[Math.max(0, Math.min(chapters.length - 1, i + dir))];
  const el = els[next.id];
  if (!el) return;
  if (crossesBridge(chapters[i].id, next.id)) tourBridge(topOf(el));
  else go(topOf(el), STEP_DURATION);
}
