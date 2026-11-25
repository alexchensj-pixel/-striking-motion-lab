import SceneCanvas from '../Scene/SceneCanvas.jsx';
import TransitionVeil from '../Scene/Transitions/TransitionVeil.jsx';
import Experience from '../Experience/index.jsx';
import Explore from '../Experience/Explore/Explore.jsx';
import Navigation from '../UI/Navigation/Navigation.jsx';
import HUD from '../UI/HUD/HUD.jsx';
import Controls from '../UI/Controls/Controls.jsx';
import Footer from '../UI/Footer/Footer.jsx';
import StickyCTA from '../UI/StickyCTA/StickyCTA.jsx';
import B2B from '../Experience/B2B/B2B.jsx';
import Estudio from '../Experience/Estudio/Estudio.jsx';

// Página pública: una sola experiencia persistente.
// El contenido se ancla a las estaciones del mundo 3D; la navegación, los precios,
// la reserva y los recorridos B2B/Estudio permanecen conectados al mismo estado.
export default function App() {
  return (
    <>
      <SceneCanvas />
      <Experience />
      <Explore />
      <Footer />
      <TransitionVeil />
      <HUD />
      <Navigation />
      <Controls />
      <StickyCTA />
      <B2B />
      <Estudio />
    </>
  );
}
