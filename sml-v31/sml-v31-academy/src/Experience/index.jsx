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
  'character-select': Explore, // selección de disciplinas, después de Entrenamiento
  'asesoria-lab': AsesoriaLab,
  'slot': Slot,
  'proof-chen': ProofChen,
  'reserva': Reserva,
};

// Secuencia comercial: Inicio → Entrenamiento → Disciplinas → Método → Evidencia → Reserva. Sin Bridge intermedio.
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
            {next && (
              <Threshold
                from={c.id}
                to={next.id}
                start={c.id === 'slot' ? 'top top' : undefined}
              >
              </Threshold>
            )}
          </Fragment>
        );
      })}
    </main>
  );
}
