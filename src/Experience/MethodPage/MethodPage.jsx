import './MethodPage.css';

const STEPS = [
  {
    number: '01',
    title: 'Observar',
    lead: 'Antes de corregir, necesitamos entender cómo te mueves.',
    body: 'Observamos tu postura, guardia, equilibrio, desplazamientos, coordinación y ejecución. No partimos de una plantilla: partimos de lo que haces hoy.',
    tags: ['Técnica', 'Movimiento', 'Punto de partida'],
  },
  {
    number: '02',
    title: 'Registrar',
    lead: 'Lo que ocurre en el entrenamiento no se queda en una impresión.',
    body: 'Recogemos observaciones, referencias y fragmentos de vídeo para construir un historial útil. Así podemos volver sobre un detalle y comprobar qué ha cambiado.',
    tags: ['Sesiones', 'Vídeo', 'Evolución'],
  },
  {
    number: '03',
    title: 'Analizar',
    lead: 'Convertimos los datos en decisiones de entrenamiento.',
    body: 'Relacionamos lo observado con tus objetivos, detectamos patrones y priorizamos lo que más puede mejorar tu rendimiento. No se trata de corregirlo todo a la vez.',
    tags: ['Patrones', 'Criterio', 'Prioridades'],
  },
  {
    number: '04',
    title: 'Corregir',
    lead: 'El análisis solo tiene valor cuando cambia lo que haces.',
    body: 'Aplicamos una corrección concreta, la practicamos y volvemos a observar. El ciclo se repite para que cada ajuste tenga continuidad y puedas medir tu progreso.',
    tags: ['Feedback', 'Repetición', 'Progreso'],
  },
];

function returnToJourney() {
  const sameSite = document.referrer && (() => {
    try { return new URL(document.referrer).origin === window.location.origin; }
    catch { return false; }
  })();

  if (sameSite && window.history.length > 1) window.history.back();
  else window.location.assign('/');
}

export default function MethodPage() {
  return (
    <main className="method-page">
      <header className="method-page__top">
        <a className="method-page__mark" href="/" aria-label="Volver al inicio">SML<span> / MÉTODO</span></a>
        <button className="method-page__back" type="button" onClick={returnToJourney}>← Volver al recorrido</button>
      </header>

      <section className="method-page__intro" aria-labelledby="method-title">
        <p className="method-page__eyebrow"><span /> SISTEMA DE APRENDIZAJE</p>
        <h1 id="method-title">La técnica no se improvisa.<br /><em>Se observa y se construye.</em></h1>
        <p className="method-page__summary">
          Cada entrenamiento deja información. La utilizamos para entender tu movimiento,
          decidir qué trabajar y comprobar si estás evolucionando.
        </p>
        <div className="method-page__cycle" aria-label="Ciclo del método">
          <span>Observar</span><i>→</i><span>Registrar</span><i>→</i><span>Analizar</span><i>→</i><span>Corregir</span>
        </div>
      </section>

      <section className="method-page__steps" aria-label="Las cuatro fases del método">
        {STEPS.map((step) => (
          <article className="method-step" key={step.number} id={`metodo-${step.number}`}>
            <div className="method-step__meta">
              <span className="method-step__number">{step.number}</span>
              <span className="method-step__line" />
            </div>
            <div className="method-step__content">
              <h2>{step.title}</h2>
              <p className="method-step__lead">{step.lead}</p>
              <p className="method-step__body">{step.body}</p>
              <ul className="method-step__tags">
                {step.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <span className="method-step__ghost" aria-hidden="true">{step.number}</span>
          </article>
        ))}
      </section>

      <footer className="method-page__footer">
        <p>UN CICLO CONTINUO. UNA MEJORA QUE PUEDES COMPROBAR.</p>
        <div>
          <button type="button" onClick={returnToJourney}>← Volver al recorrido</button>
          <a href="/#reservar">Reservar evaluación <span>↗</span></a>
        </div>
      </footer>
    </main>
  );
}
