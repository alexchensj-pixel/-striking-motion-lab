import { useEffect, useMemo, useState } from 'react';
import { MODULES as COURSE_MODULES } from '../../server/academyContent.mjs';
import { waLink } from '../Data/Content.js';
import heroLab from '../Assets/Images/hero-lab.jpg';
import stillMuayThai from '../Assets/Images/still-muay-thai.jpg';
import chenRing from '../Assets/Images/chen-ring.jpg';
import { LESSON_VIDEOS } from './lessonVideos.js';
import './academia.css';

const LESSONS = (modules) => modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ ...lesson, moduleIndex, lessonIndex, moduleId: module.id, moduleTitle: module.title })));
const lessonNumber = (modules, title) => LESSONS(modules).findIndex((x) => x.title === title) + 1;

export default function Academia() {
  const [view, setView] = useState('home');
  const [modules] = useState(COURSE_MODULES);
  const [active, setActive] = useState({ module: 0, lesson: 0 });
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('sml-academy-muaythai-v1-completed') || '[]'); } catch { return []; }
  });
  const [visited, setVisited] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('sml-academy-v42-visited') || '[]'); } catch { return []; }
  });
  const [practiceLog, setPracticeLog] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('sml-academy-v42-practice') || '{}'); } catch { return {}; }
  });
  const [selfChecks, setSelfChecks] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('sml-academy-v42-self-checks') || '{}'); } catch { return {}; }
  });
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [rest, setRest] = useState(false);
  const activeModule = modules[active.module];
  const lesson = activeModule?.lessons?.[active.lesson];
  const TOTAL_LESSONS = useMemo(() => modules.reduce((n, module) => n + module.lessons.length, 0), [modules]);
  const lessonKey = `${active.module}-${active.lesson}`;
  const totalCompleted = completed.length;
  const totalVisited = visited.length;
  const totalPracticed = Object.values(practiceLog).filter((item) => item?.count > 0).length;
  const currentPractice = practiceLog[lessonKey] || { count: 0, minutes: 0, note: '' };
  const currentCheck = selfChecks[lessonKey] || '';
  const movementPassport = LESSONS(modules).map((item, index) => { const key = `${item.moduleIndex}-${item.lessonIndex}`; return { title: item.title, moduleTitle: item.moduleTitle, visited: visited.includes(key), completed: completed.includes(key), practiced: (practiceLog[key]?.count || 0) > 0, count: practiceLog[key]?.count || 0, check: selfChecks[key] || '' }; });

  useEffect(() => {
    try { window.localStorage.setItem('sml-academy-muaythai-v1-completed', JSON.stringify(completed)); } catch { /* storage may be unavailable */ }
  }, [completed]);
  useEffect(() => { try { window.localStorage.setItem('sml-academy-v42-visited', JSON.stringify(visited)); } catch { /* storage may be unavailable */ } }, [visited]);
  useEffect(() => { try { window.localStorage.setItem('sml-academy-v42-practice', JSON.stringify(practiceLog)); } catch { /* storage may be unavailable */ } }, [practiceLog]);
  useEffect(() => { try { window.localStorage.setItem('sml-academy-v42-self-checks', JSON.stringify(selfChecks)); } catch { /* storage may be unavailable */ } }, [selfChecks]);
  useEffect(() => {
    if (!running) return undefined;
    if (seconds <= 0) { setRunning(false); return undefined; }
    const id = window.setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds]);
  useEffect(() => {
    const oldTitle = document.title;
    document.title = view === 'lesson' && lesson ? `${lesson.title} | SML Academy` : 'SML Academy | Boxeo y Muay Thai desde cero | Striking Motion Lab';
    return () => { document.title = oldTitle; };
  }, [view, lesson?.title]);

  const openLesson = (moduleIndex, lessonIndex) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setVisited((prev) => prev.includes(key) ? prev : [...prev, key]);
    setActive({ module: moduleIndex, lesson: lessonIndex });
    setSeconds(120); setRunning(false); setRound(1); setRest(false); setView('lesson');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const markComplete = () => setCompleted((prev) => prev.includes(lessonKey) ? prev : [...prev, lessonKey]);
  const savePractice = () => setPracticeLog((prev) => { const old = prev[lessonKey] || { count: 0, minutes: 0, note: '' }; return { ...prev, [lessonKey]: { ...old, count: old.count + 1, minutes: old.minutes + 5 } }; });
  const formatTime = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const resetTimer = () => { setRunning(false); setSeconds(rest ? 30 : 120); };
  const toggleRest = () => { setRunning(false); setRest((r) => !r); setSeconds(rest ? 120 : 30); };
  const nextLesson = () => {
    if (active.lesson < activeModule.lessons.length - 1) openLesson(active.module, active.lesson + 1);
    else if (active.module < modules.length - 1) openLesson(active.module + 1, 0);
    else setView('program');
  };
  const previousLesson = () => {
    if (active.lesson > 0) openLesson(active.module, active.lesson - 1);
    else if (active.module > 0) openLesson(active.module - 1, modules[active.module - 1].lessons.length - 1);
    else setView('program');
  };

  return <main className="academy">
    <header className="academy__topbar">
      <a className="academy__brand" href="/" aria-label="Volver a Striking Motion Lab"><strong>SML</strong><span>STRIKING MOTION LAB</span></a>
      <div className="academy__topright"><span>ACADEMY</span><a href="/mi-sml">MI SML ↗</a></div>
    </header>

    {view === 'home' && <>
      <section className="academy__hero">
        <img className="academy__heroimage" src={heroLab} alt="Espacio de entrenamiento de Striking Motion Lab" />
        <div className="academy__herooverlay" />
        <div className="academy__herocopy"><p className="academy__eyebrow"><span /> SML ACADEMY · CURSO ONLINE PARA PRINCIPIANTES</p><h1>No solo<br/>golpees.<br/><em>Entiende el movimiento.</em></h1><p className="academy__intro">Aprende los fundamentos del boxeo y el Muay Thai desde cero. Comprende cómo se coloca el cuerpo, cómo se coordina cada movimiento y qué observar al practicar, con explicaciones paso a paso y vídeos técnicos.</p><div className="academy__heroactions"><button className="academy__button academy__button--accent" onClick={() => setView('program')}>Explorar el curso <span>↗</span></button><a className="academy__button" href={waLink('Hola, quiero información sobre el curso online de Boxeo y Muay Thai para principiantes de SML Academy.')} target="_blank" rel="noopener noreferrer">Solicitar información <span>↗</span></a></div></div>
        <div className="academy__herofoot"><span>BOXEO · MUAY THAI · FUNDAMENTOS TÉCNICOS</span><span>{TOTAL_LESSONS} LECCIONES · VÍDEOS TÉCNICOS</span></div>
      </section>
      <section className="academy__section academy__featured"><div className="academy__sectionhead"><p className="academy__eyebrow">EL ENFOQUE · COMPRENDER PARA PRACTICAR</p><p className="academy__muted">SIN EXPERIENCIA PREVIA</p></div><div className="academy__featuregrid"><div className="academy__featureimage"><img src={stillMuayThai} alt="Entrenamiento técnico de Muay Thai"/><span className="academy__imageindex">FUNDAMENTOS · TÉCNICA · MOVIMIENTO</span></div><div className="academy__featurecopy"><p className="academy__eyebrow">DE LO BÁSICO A LA INTEGRACIÓN</p><h2>Entiende qué haces.<br/><em>Y qué debes observar.</em></h2><p>Empieza por la guardia y los desplazamientos. Después estudia los puños, las patadas, las rodillas, la movilidad de cadera y la coordinación de apoyos y rotación. Las explicaciones, los vídeos y las pautas de práctica te ayudan a reconocer los componentes de cada movimiento y revisar aspectos concretos de tu ejecución.</p><div className="academy__stats"><div><strong>{String(modules.length).padStart(2, '0')}</strong><span>MÓDULOS</span></div><div><strong>{TOTAL_LESSONS}</strong><span>LECCIONES</span></div><div><strong>0</strong><span>EXPERIENCIA PREVIA REQUERIDA</span></div></div><div className="academy__heroactions"><button className="academy__button academy__button--accent" onClick={() => setView('program')}>Ver temario <span>→</span></button><a className="academy__button" href={waLink('Hola, quiero información sobre el curso online de Boxeo y Muay Thai para principiantes de SML Academy.')} target="_blank" rel="noopener noreferrer">Solicitar información <span>↗</span></a></div></div></div></section>
      <section className="academy__discipline"><div className="academy__disciplinehead"><p className="academy__eyebrow"><span /> DOS DISCIPLINAS · CONTEXTOS DISTINTOS</p><h2>Se parecen.<br/><em>No son lo mismo.</em></h2></div><div className="academy__disciplinegrid"><article><span>01 / BOXEO</span><h3>Puños, distancia y desplazamientos.</h3><p>El boxeo se centra en el uso de los puños y en cómo la posición, el juego de pies y la distancia ayudan a atacar y defender frente a otros puñetazos.</p></article><article><span>02 / MUAY THAI</span><h3>Más armas. Otras decisiones.</h3><p>Además de los puños, el Muay Thai incorpora patadas, rodillas, codos y clinch, según las reglas y el contexto. Por eso, la guardia, el equilibrio y las opciones defensivas no deben interpretarse como si ambas disciplinas fueran idénticas.</p></article></div><p className="academy__disciplinefoot">El curso aborda fundamentos técnicos de ambas disciplinas. La aplicación táctica completa y la práctica con oposición requieren aprendizaje específico y supervisión adecuada.</p></section>
      <section className="academy__principles"><div><span>01</span><strong>Construye la base</strong><p>Empieza por la guardia, el equilibrio y los desplazamientos antes de enlazar movimientos más complejos.</p></div><div><span>02</span><strong>Observa la mecánica</strong><p>Identifica cómo intervienen los apoyos, la cadera, el torso y los brazos en las técnicas del curso.</p></div><div><span>03</span><strong>Practica con intención</strong><p>Sigue las pautas de práctica y utiliza las comprobaciones para revisar aspectos concretos de tu ejecución.</p></div></section>
      <footer className="academy__footer"><span>SML ACADEMY</span><span>Boxeo · Muay Thai · Fundamentos técnicos</span><a href="/">Volver a SML ↗</a></footer>
    </>}

    
    {view === 'program' && <section className="academy__program">
      <button className="academy__back" onClick={() => setView('home')}>← Academy</button>
      <div className="academy__programhero"><div><p className="academy__eyebrow">TU RECORRIDO · PRINCIPIANTES</p><h1>Aprende Boxeo<br/>y Muay Thai<br/><em>desde 0 en casa.</em></h1><p>Empieza por los fundamentos y avanza hacia los golpes, las patadas y la coordinación. Puedes seguir el orden recomendado o volver a cualquier lección cuando necesites repasar.</p><div className="academy__progresslabel"><span>LECCIONES COMPLETADAS</span><strong>{totalCompleted}/{TOTAL_LESSONS}</strong></div><div className="academy__progress"><span style={{ width: `${totalCompleted / TOTAL_LESSONS * 100}%` }}/></div><div className="academy__passportstats"><span><strong>{totalVisited}</strong> visitadas</span><span><strong>{totalPracticed}</strong> con práctica registrada</span></div></div><img src={chenRing} alt="Entrenamiento de combate de Striking Motion Lab"/></div>
      <div className="academy__moduleshead"><h2>Tu recorrido de aprendizaje</h2><p>{TOTAL_LESSONS} lecciones en {modules.length} módulos. Recomendación: avanza en orden para construir la base antes de integrar las técnicas.</p></div>
      <div className="academy__modules">{modules.map((module, mi) => <article className="academy__module" key={module.id}><div className="academy__moduleintro"><span>{module.id}</span><div><h3>{module.title}</h3><p>{module.description}</p></div><small>{module.duration}</small></div><div className="academy__lessons">{module.lessons.map((item, li) => { const done = completed.includes(`${mi}-${li}`); return <button className="academy__lessonrow" key={item.title} onClick={() => openLesson(mi, li)}><span className={done ? 'academy__check is-done' : 'academy__check'}>{done ? '✓' : String(lessonNumber(modules, item.title)).padStart(2, '0')}</span><span>{item.title}</span><span className="academy__lessonmeta">{done ? 'COMPLETADA' : visited.includes(`${mi}-${li}`) ? 'VISITADA' : 'EMPEZAR'} ↗</span></button>; })}</div></article>)}</div>
      <section className="academy__passport"><div className="academy__passporthead"><div><p className="academy__eyebrow">REGISTRO PERSONAL</p><h2>Movement Passport</h2><p>Una vista de las lecciones que has visitado, completado y practicado.</p></div><span className="academy__passportlocal">GUARDADO EN ESTE DISPOSITIVO</span></div><div className="academy__passportgrid">{movementPassport.map((item, i) => <div className="academy__passportrow" key={item.title}><span className="academy__passportnum">{String(i + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.moduleTitle}</small></div><span className={item.completed ? 'academy__passportstatus is-complete' : item.practiced ? 'academy__passportstatus is-practiced' : item.visited ? 'academy__passportstatus is-visited' : 'academy__passportstatus'}>{item.completed ? 'Completada' : item.practiced ? `Practicada ×${item.count}` : item.visited ? 'Visitada' : 'Pendiente'}</span></div>)}</div></section>
      <p className="academy__prototypeNote">Puedes aprender a tu ritmo y volver a las lecciones cuando lo necesites. Tu progreso y el registro de práctica se guardan en este dispositivo y no se sincronizan entre dispositivos.</p>
    </section>}

    {view === 'lesson' && lesson && <section className="academy__lessonpage">
      <button className="academy__back" onClick={() => setView('program')}>← Volver al temario</button>
      <div className="academy__lessonheading"><p className="academy__eyebrow">TEMA {activeModule.id} / LECCIÓN {String(lessonNumber(modules, lesson.title)).padStart(2, '0')}</p><h1>{lesson.title}</h1><p>{lesson.short}</p></div>
      <div className="academy__lessonlayout"><div className="academy__lessonmain">
        {(LESSON_VIDEOS[lesson.title] || []).length > 0 && <section className="academy__videoSection academy__videoSection--featured"><div className="academy__lessonstage"><span>02</span><div><p className="academy__eyebrow">OBSERVA</p><h2>Demostración</h2><p className="academy__stageintro">Mira la ejecución completa antes de practicar. Los subtítulos del vídeo marcan cada paso; puedes pausar y repetir las veces que necesites.</p></div></div><div className="academy__videogrid">{LESSON_VIDEOS[lesson.title].map((clip, videoIndex, list) => <figure className="academy__videoplace" key={clip.src}><video className="academy__video" controls playsInline preload="metadata" poster={clip.poster} src={clip.src} aria-label={clip.title} /><figcaption><span>{list.length > 1 ? `VÍDEO ${videoIndex + 1} DE ${list.length} · ` : ''}{clip.title.toUpperCase()}</span></figcaption></figure>)}</div></section>}
        <section className="academy__lessontext"><div className="academy__lessonstage"><span>01</span><div><p className="academy__eyebrow">COMPRENDE</p><h2>La idea clave</h2><p className="academy__stageintro">{lesson.short}</p></div></div><details className="academy__lessonmore"><summary>Entender la técnica a fondo <span>＋</span></summary><div className="academy__lessonmorebody"><p className="academy__eyebrow">FUNDAMENTO</p><h2>Por qué funciona</h2>{lesson.foundation.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {lesson.objective && <><h2 className="academy__subheading">Qué vas a aprender</h2><p>{lesson.objective}</p></>}
          {lesson.commonErrors?.length > 0 && <><h2 className="academy__subheading">Errores frecuentes y cómo corregirlos</h2><ul className="academy__stepList">{lesson.commonErrors.map((item, i) => <li key={i}><strong>{item.error}</strong><p>{item.correction}</p></li>)}</ul></>}
          {lesson.steps.length > 0 && <><h2 className="academy__subheading">Cómo se ejecuta</h2><ol className="academy__stepList">{lesson.steps.map((step, i) => <li key={step.title}><strong>{step.title}</strong><p>{step.text}</p></li>)}</ol></>}
          {lesson.rule && <div className="academy__callout"><strong>Regla principal</strong><p>{lesson.rule}</p></div>}
          {lesson.test && <div className="academy__callout academy__callout--test"><strong>Prueba práctica</strong><p>{lesson.test}</p></div>}
          {lesson.key && <div className="academy__callout academy__callout--key"><strong>Clave técnica</strong><p>{lesson.key}</p></div>}
          {lesson.practicePending && <div className="academy__callout"><strong>Práctica guiada</strong><p>La práctica específica de esta lección sigue pendiente de definición. No se presenta como una práctica guiada hasta que esté preparada.</p></div>}
          </div></details>
        </section>
        <LessonVisual lesson={lesson} />
        <section className="academy__practice"><div><div className="academy__lessonstage"><span>03</span><div><p className="academy__eyebrow">PRACTICA</p><h2>Práctica en casa</h2>
  {lesson.practice && <p className="academy__lesson-drill">{lesson.practice}</p>}<p className="academy__stageintro">Trabaja despacio y prioriza el control. Empieza sin impacto y deja espacio libre a tu alrededor. Si aparece dolor, detente.</p></div></div><p>Registra cada sesión. El botón suma una sesión y 5 minutos estimados manualmente; no mide la duración real. El temporizador es opcional y no sustituye la supervisión de un entrenador.</p><div className="academy__practiceLog"><p><strong>{currentPractice.count}</strong> prácticas registradas · <strong>{currentPractice.minutes}</strong> minutos estimados</p><button className="academy__button academy__button--accent" onClick={savePractice}>Registrar sesión (5 min estimados) <span>＋</span></button></div></div><div className="academy__timer"><div className="academy__timerlabels"><span>{rest ? 'DESCANSO' : `RONDA ${round} / 3`}</span><button onClick={toggleRest}>{rest ? 'Cambiar a ronda' : 'Cambiar a descanso'}</button></div><strong>{formatTime(seconds)}</strong><div className="academy__timeractions"><button onClick={() => setRunning((r) => !r)}>{running ? 'Pausar' : seconds === 0 ? 'Finalizado' : 'Iniciar'}</button><button onClick={resetTimer}>Reiniciar</button>{!rest && <button onClick={() => { setRound((r) => r >= 3 ? 1 : r + 1); setSeconds(120); setRunning(false); }}>Siguiente ronda</button>}</div></div></section>
        <section className="academy__selfcheck"><div className="academy__lessonstage"><span>04</span><div><p className="academy__eyebrow">COMPRUEBA</p><h2>¿Cómo te ha salido?</h2><p className="academy__stageintro">Compara tu ejecución con estos puntos (grábate con el móvil si puedes) y elige la opción que mejor describa tu práctica de hoy. Puedes cambiarla después.</p></div></div>{lesson.check && <ul className="academy__checklist">{lesson.check.map((item) => <li key={item}>{item}</li>)}</ul>}<div className="academy__selfcheckoptions">{[{value:'needs-work',label:'Necesito repasarlo'},{value:'getting-there',label:'Lo consigo despacio'},{value:'controlled',label:'Lo hago con control'}].map((option) => <label key={option.value} className={currentCheck === option.value ? 'is-selected' : ''}><input type="radio" name={`self-check-${lessonKey}`} checked={currentCheck === option.value} onChange={() => setSelfChecks((prev) => ({ ...prev, [lessonKey]: option.value }))}/><span>{option.label}</span></label>)}</div></section>
        <section className="academy__integrate"><div className="academy__lessonstage"><span>05</span><div><p className="academy__eyebrow">INTEGRA</p><h2>Conecta lo aprendido</h2>
  {lesson.integrate && <p>{lesson.integrate}</p>}
  {lesson.advanceWhen && <div className="academy__advance-check"><h3>Antes de avanzar</h3><p>{lesson.advanceWhen}</p></div>}{!lesson.integrate && <p className="academy__stageintro">Repite la técnica a baja velocidad y enlázala con la guardia o el desplazamiento. Mantén la postura y vuelve a la posición inicial antes de aumentar el ritmo.</p>}</div></div></section>
        <div className="academy__lessonbottom"><button className="academy__button" onClick={previousLesson}>← Anterior</button><button className="academy__button academy__button--accent" onClick={nextLesson}>Siguiente lección <span>→</span></button><button className="academy__button" onClick={() => { markComplete(); setView('program'); }}>Marcar lección como completada</button></div>
      </div><aside className="academy__lessonaside"><p className="academy__eyebrow">EN ESTE TEMA</p><h3>{activeModule.title}</h3>{activeModule.lessons.map((item, li) => <button key={item.title} className={`academy__asideitem ${li === active.lesson ? 'is-current' : ''}`} onClick={() => openLesson(active.module, li)}><span>{completed.includes(`${active.module}-${li}`) ? '✓' : String(lessonNumber(modules, item.title)).padStart(2, '0')}</span>{item.title}</button>)}<div className="academy__asideprogress"><span>LECCIONES COMPLETADAS</span><strong>{totalCompleted}/{TOTAL_LESSONS}</strong><div className="academy__progress"><span style={{ width: `${totalCompleted / TOTAL_LESSONS * 100}%` }}/></div></div></aside></div>
    </section>}
    <div className="academy__bottomline"><span>STRIKING MOTION LAB</span><span>CURSO ONLINE · PRINCIPIANTES · DESDE CASA</span></div>
  </main>;
}




function LessonVisual({ lesson }) {
  const steps = Array.isArray(lesson.steps) ? lesson.steps : [];
  const foundation = Array.isArray(lesson.foundation) ? lesson.foundation : [];
  const checks = Array.isArray(lesson.check) ? lesson.check : [];
  const mainIdea = lesson.key || lesson.rule || lesson.short || foundation[0] || 'Prioriza el control técnico antes de aumentar la velocidad.';
  const explanation = foundation.find((p) => p && p.length > 45 && p !== mainIdea) || foundation[0] || lesson.short || '';
  const title = lesson.title || 'Lección técnica';
  const label = (steps.length ? 'SECUENCIA DE EJECUCIÓN' : 'CLAVES DE APRENDIZAJE');
  const visualSteps = steps.slice(0, 5);
  const principles = checks.slice(0, 4);

  const lowerTitle = title.toLocaleLowerCase('es');
  const illustration = /sincronización de apoyos y rotación/.test(lowerTitle) ? 'sincronizacion.jpg'
    : /rutina técnica en solitario/.test(lowerTitle) ? 'rutina-solitario.jpg'
    : /transferencia de fuerza y escalera avanzada/.test(lowerTitle) ? 'transferencia-escalera.jpg'
    : /guardia|centro de gravedad|distribución del peso|colocación de los pies|pierna trasera/.test(lowerTitle) ? 'guard.jpg'
    : /desplazamiento|paso adelante|paso atrás|lateral|salida en diagonal|entrada y salida/.test(lowerTitle) ? 'footwork.jpg'
    : /jab|puño adelantado|salida con paso corto|impulso|mano de guardia|impacto|regreso/.test(lowerTitle) ? 'jab.jpg'
    : /cross|directo trasero|empuje del pie trasero|giro de cadera|rotación del torso|sale el hombro|extensión del brazo/.test(lowerTitle) ? 'cross.jpg'
    : /crochet|hook|gancho|empuje y giro|transferencia del peso|altura del brazo/.test(lowerTitle) ? 'hook.jpg'
    : /uppercut|ascendente/.test(lowerTitle) ? 'uppercut.jpg'
    : /low kick|patada baja/.test(lowerTitle) ? 'lowkick.jpg'
    : /middle kick|patada media/.test(lowerTitle) ? 'middlekick.jpg'
    : /rodillas|golpe de rodilla|rodillazo/.test(lowerTitle) ? 'rodillas.jpg'
    : /movilidad de cadera/.test(lowerTitle) ? 'movilidad.jpg'
    : /frontales|front kick|teep|patada frontal/.test(lowerTitle) ? 'teep.jpg'
    : /patada/.test(lowerTitle) ? 'teep.jpg'
    : /bloqueo|defensa/.test(lowerTitle) ? 'block.jpg'
    : /esquiva|evasión|slip/.test(lowerTitle) ? 'slip.jpg'
    : /clinch|rodilla/.test(lowerTitle) ? 'clinch.jpg'
    : /combinación|combinaciones|secuencia/.test(lowerTitle) ? 'combos.jpg'
    : 'guard.jpg';
  return <section className="academy__lessonboard" aria-label={`Lámina didáctica de ${title}`}>
    <div className="academy__lessonboardtop">
      <div className="academy__notebookbrand"><span>SML</span><div><strong>ACADEMY</strong><small>ESTUDIO DE MOVIMIENTO</small></div></div>
      <span className="academy__boardtag">CUADERNO BIOMECÁNICO · {String(visualSteps.length || principles.length || 1).padStart(2, '0')} CLAVES</span>
    </div>
    <div className="academy__boardtitle">
      <p className="academy__eyebrow">LECTURA TÉCNICA · {lesson.short || 'FUNDAMENTOS'}</p>
      <h2>{title}</h2>
      <p>{explanation}</p>
    </div>
    <figure className="academy__boardillustration">
      <img src={`/images/lesson-notebook/${illustration}`} alt={`Estudio visual de ${title}: postura, secuencia y mecánica del movimiento`} loading="lazy" />
      <figcaption><strong>LECTURA VISUAL</strong><span>Observa la postura, la trayectoria y la recuperación. Contrasta cada detalle con los pasos de esta lección.</span></figcaption>
    </figure>
    <div className="academy__boardgrid">
      <section className="academy__boardfocus">
        <span className="academy__boardsectionno">01 / PRINCIPIO</span>
        <h3>Qué debes entender</h3>
        <p>{mainIdea}</p>
        {lesson.test && <div className="academy__boardtest"><strong>PRUEBA DE CONTROL</strong><p>{lesson.test}</p></div>}
      </section>
      <section className="academy__boardsequence">
        <div className="academy__boardsectionhead"><span className="academy__boardsectionno">02 / MÉTODO</span><h3>{label}</h3></div>
        {visualSteps.length > 0 ? <ol className="academy__boardsteps">{visualSteps.map((step, i) => <li key={`${step.title}-${i}`}><span className="academy__boardstepnum">{String(i + 1).padStart(2, '0')}</span><div><h4>{step.title}</h4><p>{step.text}</p></div>{i < visualSteps.length - 1 && <span className="academy__boardarrow" aria-hidden="true">↘</span>}</li>)}</ol> : <p>Lee la idea clave y practica de forma lenta y controlada antes de aumentar el ritmo.</p>}
      </section>
      <section className="academy__boardchecks">
        <span className="academy__boardsectionno">03 / AUTOEVALUACIÓN</span><h3>Señales de una buena ejecución</h3>
        {principles.length > 0 ? <ul>{principles.map((item, i) => <li key={`${item}-${i}`}><span>✓</span>{item}</li>)}</ul> : <p>Busca estabilidad, respiración fluida y una vuelta controlada a la posición inicial.</p>}
      </section>
      <section className="academy__boardcoach">
        <span className="academy__boardsectionno">04 / APUNTE DEL ENTRENADOR</span>
        <h3>Corrige una cosa cada vez</h3>
        <p>{lesson.rule || (lesson.key ? lesson.key : 'Primero consolida la postura y la trayectoria. Después añade velocidad sin perder el control.')}</p>
        <div className="academy__boardnote"><span>CLAVE</span><p>Calidad de movimiento antes que potencia. Si aparece dolor, detén la práctica.</p></div>
      </section>
    </div>
    <div className="academy__boardfooter"><span>SML ACADEMY · APRENDER · OBSERVAR · CORREGIR</span><span>{title.toUpperCase()}</span></div>
  </section>;
}

