import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import CameraRig from '../Scene/Camera/index.jsx';
import Lighting from '../Scene/Lighting/index.jsx';
import Environment from './MemoryEnvironment.jsx';
import { segmentKeys } from '../Data/Content.js';
import { scrollState, setSegment, prefersReducedMotion } from '../Scene/Transitions/scrollState.js';
import { useStore } from '../App/store.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// The existing page sections remain the only DOM chapters. The original 3D Discover
// room is traversed inside the Home → Method passage; it does not create another page.
const ROUTES = [
  { id: 'inicio', steps: [
    { key: 'entrada', from: 0, to: 0.78 },
    { key: 'entrada>character-select', from: 0.78, to: 0.90 },
    { key: 'character-select', from: 0.90, to: 1 },
  ] },
  { id: 'metodo', steps: [
    { key: 'asesoria-lab', from: 0, to: 0.12 },
    { key: 'asesoria-lab', from: 0.12, to: 1 },
  ] },
  { id: 'entrenamiento', steps: [
    { key: 'asesoria-lab>slot', from: 0, to: 0.12 },
    { key: 'slot', from: 0.12, to: 1 },
  ] },
  { id: 'alex', steps: [
    { key: 'slot>proof-chen', from: 0, to: 0.12 },
    { key: 'proof-chen', from: 0.12, to: 1 },
  ] },
  { id: 'reserva', steps: [
    { key: 'proof-chen>reserva', from: 0, to: 0.12 },
    { key: 'reserva', from: 0.12, to: 1 },
  ] },
];

// El 3D (Scene/Transitions/scrollState.js#isExploreActive) solo acepta toques sobre los luchadores cuando el umbral
// 'entrada>character-select' esta COMPLETO (>= .999). El overlay de Explore debe mostrarse justo entonces, no antes: si no,
// hay un tramo con panel visible y luchadores que no responden.
const HOME_DIRECT_ROUTE = { id: 'inicio', steps: [{ key: 'entrada', from: 0, to: 1 }] };
const CHAPTER_GATE = { 'entrada>character-select': 0.999 };
const chapterFor = (key, progress) => {
  if (!key.includes('>')) return key;
  const [from, to] = key.split('>');
  return progress >= (CHAPTER_GATE[key] ?? 0.72) ? to : from;
};

// La transición y la selección se gobiernan por el scroll real del tramo explore-dwell (340svh en styles.css).
// 18% Bridge, 18% revelado de luchadores y 64% de permanencia (~2 pantallas) para seleccionar sin que un
// solo deslizamiento la consuma.
const EXPLORE_START = 0.78;
const EXPLORE_END = 0.90;
const BRIDGE_SHARE = 0.18;
const REVEAL_SHARE = 0.18;

const smoothstep = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

function applyRoute(route, progress, lastChapter) {
  const step = route.steps.find((item, index) => progress < item.to || index === route.steps.length - 1);
  const index = segmentKeys.indexOf(step.key);
  if (index < 0) return lastChapter;
  const local = clamp((progress - step.from) / Math.max(0.0001, step.to - step.from));
  // Keep the already-traversed segments complete, the active one live, and future
  // segments reset. This makes the original camera path reversible on upward scroll.
  segmentKeys.forEach((key, i) => {
    scrollState.segments[key] = i < index ? 1 : i === index ? Math.max(0.0001, local) : 0;
  });
  setSegment(step.key, Math.max(0.0001, local));
  const chapter = chapterFor(step.key, local);
  if (chapter !== lastChapter) useStore.getState().setActiveChapter(chapter);
  return chapter;
}

export default function LegacyWorld({ exploreOpen = false }) {
  useEffect(() => {
    let lastChapter = '';
    let frame = 0;
    // Una vez alcanzada la permanencia, volver a entrar desde abajo muestra el estado final (sin repetir Bridge ni revelado).
    // Se reinicia solo al volver por encima del tramo (hero), donde la secuencia vuelve a enlazar de forma continua.
    let selectionSeen = false;

    const update = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const exploreNode = document.querySelector('.explore-dwell');
        const exploreRect = exploreNode?.getBoundingClientRect();
        const exploreTop = exploreRect ? exploreRect.top + y : Infinity;
        const exploreBottom = exploreRect ? exploreRect.bottom + y : -Infinity;
        const exploreHeight = Math.max(1, exploreBottom - exploreTop);
        const insideExplore = exploreOpen && !!exploreRect && y >= exploreTop && y < exploreBottom;
        if (y < exploreTop) selectionSeen = false;

        // La selección ocupa una pantalla, pero nunca bloquea el scroll de página.
        // El reveal 3D sigue ligado al recorrido real y reversible del usuario.
        if (insideExplore) {
          const dwellProgress = clamp((y - exploreTop) / exploreHeight);
          if (dwellProgress >= BRIDGE_SHARE + REVEAL_SHARE) selectionSeen = true;
          const sequenceProgress = prefersReducedMotion || selectionSeen
            ? 1
            : dwellProgress <= BRIDGE_SHARE
              ? 0.82 * smoothstep(dwellProgress / BRIDGE_SHARE)
              : dwellProgress <= BRIDGE_SHARE + REVEAL_SHARE
                ? 0.82 + 0.18 * smoothstep((dwellProgress - BRIDGE_SHARE) / REVEAL_SHARE)
                : 1;
          setSegment('entrada', 1);
          const routeProgress = EXPLORE_START + (EXPLORE_END - EXPLORE_START) * sequenceProgress;
          lastChapter = applyRoute(ROUTES[0], routeProgress, lastChapter);
          return;
        }

        // Fuera de la selección, el resto del sitio sigue usando su recorrido original.
        const sections = ROUTES.map((route) => ({ route, node: document.getElementById(route.id) })).filter((item) => item.node);
        if (!sections.length) return;
        for (let i = 0; i < sections.length; i += 1) {
          const start = sections[i].node.getBoundingClientRect().top + y;
          const next = sections[i + 1]?.node || (sections[i].route.id === 'reserva' ? document.getElementById('empresas') : null);
          const end = next ? next.getBoundingClientRect().top + y : Math.max(start + 1, document.documentElement.scrollHeight - window.innerHeight);
          if (y >= start && (y < end || i === sections.length - 1)) {
            let progress = clamp((y - start) / Math.max(1, end - start));
            let route = sections[i].route;
            if (route.id === 'inicio' && !exploreOpen) {
              // Sin abrir Descubrir, el hero recorre únicamente Entrada y enlaza directamente con Método.
              route = HOME_DIRECT_ROUTE;
            } else if (route.id === 'inicio' && exploreOpen && Number.isFinite(exploreTop) && exploreTop > start) {
              // Antes del dwell: 0 → 0,78. Después: 0,90 → 1. El tramo central lo gobierna el recorrido opcional.
              if (y < exploreTop) progress = EXPLORE_START * clamp((y - start) / (exploreTop - start));
              else if (y >= exploreBottom) progress = EXPLORE_END + (1 - EXPLORE_END) * clamp((y - exploreBottom) / Math.max(1, end - exploreBottom));
            }
            lastChapter = applyRoute(route, progress, lastChapter);
            return;
          }
        }
      });
    };

    const handleNavigation = () => update();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('sml:navigate', handleNavigation);
    return () => {
      window.removeEventListener('sml:navigate', handleNavigation);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [exploreOpen]);

  return (
    <div className="world" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 50, near: 0.1, far: 220, position: [0, 1.6, 0] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050608']} />
        <fog attach="fog" args={['#050608', 12, 75]} />
        <CameraRig />
        <Suspense fallback={null}>
          <Lighting />
          <Environment />
        </Suspense>
      </Canvas>
    </div>
  );
}
