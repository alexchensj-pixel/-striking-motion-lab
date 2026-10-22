import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
// El árbol 3D público se importa solo en la ruta pública; /mi-sml y /academia no necesitan Three.js ni sus vídeos.
const App = lazy(() => import('./App/App.jsx'));
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';

// MI SML (/mi-sml): zona privada del cliente, aplicación independiente de la experiencia 3D pública (sin canvas, sin scroll-scrub).
// Se carga bajo demanda: la web pública no descarga nada de ella.
const MiSML = lazy(() => import('./Client/MiSML.jsx'));
const Academia = lazy(() => import('./Academy/Academia.jsx'));

// Rutas legales (/privacidad, /aviso-legal): páginas independientes, sin canvas 3D. Netlify ya sirve index.html para cualquier ruta (netlify.toml).
const ruta = window.location.pathname.replace(/\/+$/, '') || '/';
const legalTipo = ruta === RUTAS.privacidad ? 'privacidad' : ruta === RUTAS.aviso ? 'aviso' : null;
const esMiSML = ruta === '/mi-sml' || ruta.startsWith('/mi-sml/');
const esAcademia = ruta === '/academia' || ruta.startsWith('/academia/');

if (!legalTipo && !esMiSML && !esAcademia) {
  // El scroll ES la navegación: siempre arrancamos en la entrada.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

const fallback = (
  <main role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#050608', color: '#f4f4f4', fontFamily: 'sans-serif' }}>
    Cargando Striking Motion Lab…
  </main>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={fallback}>
      {esMiSML
        ? <MiSML />
        : esAcademia ? <Academia />
        : legalTipo ? <LegalPage tipo={legalTipo} /> : <App />}
    </Suspense>
  </React.StrictMode>
);
