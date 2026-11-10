import { Fragment } from 'react';
import { chapters } from '../Data/Content.js';
import Threshold from '../Scene/Transitions/Threshold.jsx';
import Entrada from './Entrada/Entrada.jsx';
import Explore from './Explore/Explore.jsx';
import AsesoriaLab from './AsesoriaLab/AsesoriaLab.jsx';
import Slot from './Slot/Slot.jsx';
import ProofChen from './ProofChen/ProofChen.jsx';
import Reserva from './Reserva/Reserva.jsx';
import Faq from './Faq/Faq.jsx';

const views = {
  'entrada': Entrada,
  'character-select': Explore, // sección EXPLORE: selección 3D de personajes y disciplinas
  'asesoria-lab': AsesoriaLab,
  'slot': Slot,
  'proof-chen': ProofChen,
  'reserva': Reserva,
};

// Secuencia: experiencia → umbral → experiencia → umbral ... Cada umbral es un tramo de scroll con sentido narrativo.
export default function Experience() {
  return (
    <main className="experience">
      {chapters.map((c, i) => {
        const View = views[c.id];
        const next = chapters[i + 1];
        return (
          <Fragment key={c.id}>
            <View />
            {/* FAQ: justo después de 04 Entrenamiento y antes del umbral hacia 05 Sobre Chen. No es un capítulo. */}
            {c.id === 'slot' && <Faq />}
            {/* HOME → EXPLORE: transición corta y directa; los tres personajes se revelan en el propio umbral. */}
            {next && (
              <Threshold
                from={c.id}
                to={next.id}
                start={c.id === 'slot' ? 'top top' : undefined}
              />
            )}
          </Fragment>
        );
      })}
    </main>
  );
}
