import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AppOriginal from './App/App.jsx';
import MobileHome from './MobileHome.jsx';
import LegalPage from './UI/Legal/LegalPage.jsx';
import { RUTAS } from './Data/Legal.js';
import './styles/global.css';
import './Spatial/mobile-composition.css';

const MiSML = lazy(() => import('./Client/MiSML.jsx'));
const Academia = lazy(() => import('./Academy/Academia.jsx'));
const SpatialApp = lazy(() => import('./Spatial/SpatialApp.jsx'));

function PublicHome() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return mobile ? <MobileHome /> : <Suspense fallback={null}><SpatialApp /></Suspense>;
}

const ruta = window.location.pathname.replace(/\/$/, '') || '/';
const legalTipo = ruta === RUTAS.privacidad ? 'privacidad' : ruta === RUTAS.aviso ? 'aviso' : null;
const esMiSML = ruta === '/mi-sml' || ruta.startsWith('/mi-sml/');
const esAcademia = ruta === '/academia' || ruta.startsWith('/academia/');

if (!legalTipo && !esMiSML && !esAcademia) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esMiSML
      ? <Suspense fallback={null}><MiSML /></Suspense>
      : esAcademia ? <Suspense fallback={null}><Academia /></Suspense>
      : legalTipo ? <LegalPage tipo={legalTipo} />
      : ruta === '/' ? <PublicHome /> : <AppOriginal />}
  </React.StrictMode>
);
