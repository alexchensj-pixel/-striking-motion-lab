import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App/App.jsx';
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';
import './styles/sml-brand-overrides.css';

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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esMiSML
      ? <Suspense fallback={null}><MiSML /></Suspense>
      : esAcademia ? <Suspense fallback={null}><Academia /></Suspense>
      : legalTipo ? <LegalPage tipo={legalTipo} /> : <App />}
  </React.StrictMode>
);
