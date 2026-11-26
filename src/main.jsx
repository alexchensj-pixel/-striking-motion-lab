import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import AppOriginal from './App/App.jsx';
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';

const MiSML = lazy(() => import('./Client/MiSML.jsx'));
const Academia = lazy(() => import('./Academy/Academia.jsx'));
const SpatialApp = lazy(() => import('./Spatial/SpatialApp.jsx'));
const MethodPage = lazy(() => import('./Experience/MethodPage/MethodPage.jsx'));

function PublicHome() {
  return <Suspense fallback={null}><SpatialApp /></Suspense>;
}

const ruta = window.location.pathname.replace(/\/$/, '') || '/';
const legalTipo = ruta === RUTAS.privacidad ? 'privacidad' : ruta === RUTAS.aviso ? 'aviso' : null;
const esMiSML = ruta === '/mi-sml' || ruta.startsWith('/mi-sml/');
const esAcademia = ruta === '/academia' || ruta.startsWith('/academia/');
const esMetodo = ruta === '/metodo';

if (!legalTipo && !esMiSML && !esAcademia && !esMetodo) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esMiSML
      ? <Suspense fallback={null}><MiSML /></Suspense>
      : esAcademia ? <Suspense fallback={null}><Academia /></Suspense>
      : esMetodo ? <Suspense fallback={null}><MethodPage /></Suspense>
      : legalTipo ? <LegalPage tipo={legalTipo} />
      : ruta === '/' ? <PublicHome /> : <AppOriginal />}
  </React.StrictMode>
);
