import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';
import './Spatial/mobile-composition.css';

// La experiencia 3D y la metodología independiente se cargan solo en su ruta.
// La página de metodología no descarga el mundo Three.js ni monta el recorrido.
const App = lazy(() => import('./App/App.jsx'));
const MethodPage = lazy(() => import('./Experience/MethodPage/MethodPage.jsx'));
const MiSML = lazy(() => import('./Client/MiSML.jsx'));

const ruta = window.location.pathname.replace(/\/+$/, '') || '/';
const legalTipo = ruta === RUTAS.privacidad ? 'privacidad' : ruta === RUTAS.aviso ? 'aviso' : null;
const esMiSML = ruta === '/mi-sml' || ruta.startsWith('/mi-sml/');
const esMetodo = ruta === '/metodo';

if (!legalTipo && !esMiSML && !esMetodo) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esMiSML
      ? <Suspense fallback={null}><MiSML /></Suspense>
      : legalTipo
        ? <LegalPage tipo={legalTipo} />
        : esMetodo
          ? <Suspense fallback={null}><MethodPage /></Suspense>
          : <Suspense fallback={null}><App /></Suspense>}
  </React.StrictMode>
);
