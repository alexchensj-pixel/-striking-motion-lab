import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';

// Carga diferida por ruta: /mi-sml no debe importar el árbol 3D público
// (Three.js, React Three Fiber, escenas y medios) solo para mostrar el área privada.
const App = lazy(() => import('./App/App.jsx'));
const MiSML = lazy(() => import('./Client/MiSML.jsx'));

// Rutas legales (/privacidad, /aviso-legal): páginas independientes, sin canvas 3D.
const ruta = window.location.pathname.replace(/\/+$/, '') || '/';
const legalTipo = ruta === RUTAS.privacidad ? 'privacidad' : ruta === RUTAS.aviso ? 'aviso' : null;
const esMiSML = ruta === '/mi-sml' || ruta.startsWith('/mi-sml/');

if (!legalTipo && !esMiSML) {
  // El scroll ES la navegación: siempre arrancamos en la entrada.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

const fallback = (
  <main
    role="status"
    aria-live="polite"
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem',
      background: '#050608',
      color: '#f4f4f4',
      fontFamily: 'sans-serif',
    }}
  >
    Cargando Striking Motion Lab…
  </main>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={fallback}>
      {esMiSML
        ? <MiSML />
        : legalTipo ? <LegalPage tipo={legalTipo} /> : <App />}
    </Suspense>
  </React.StrictMode>
);
