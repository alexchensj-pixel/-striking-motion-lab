import { useEffect, useState } from 'react';
import { generateAdminRoutine, getAdminClient, getAdminClients, getCurrentClient, signOut } from './clientApi.js';

export default function MiSMLDashboard({ onSessionEnded }) {
  const [mode, setMode] = useState('loading');
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const list = await getAdminClients();
        if (vivo) { setMode('admin'); setClients(list); }
      } catch (e) {
        if (e?.code === 'forbidden') {
          try { const client = await getCurrentClient(); if (vivo) { setMode('client'); setSelected(client); } }
          catch (inner) { if (inner?.code === 'unauthenticated') onSessionEnded?.(); else if (vivo) setError(true); }
        } else if (e?.code === 'unauthenticated') onSessionEnded?.();
        else if (vivo) setError(true);
      }
    })();
    return () => { vivo = false; };
  }, [onSessionEnded]);

  const abrir = async (id) => {
    setSelected(null); setMode('admin-loading'); setError(false);
    try { setSelected(await getAdminClient(id)); setMode('admin-detail'); }
    catch (e) { if (e?.code === 'unauthenticated') onSessionEnded?.(); else { setError(true); setMode('admin'); } }
  };
  const salir = async () => { try { await signOut(); } catch {} };

  return <section className="msml__panel" aria-label="Mi SML">
    <h1 className="msml__title">Mi SML</h1>
    {mode === 'loading' && <p className="msml__status">Cargando…</p>}
    {error && <p className="msml__note" role="alert">No hemos podido cargar tus datos.</p>}
    {mode === 'admin' && <>
      <p className="msml__lead">Panel de administración</p>
      <div className="msml__admin-list">{clients.map(c => <button key={c.id} type="button" className="msml__admin-client" onClick={() => abrir(c.id)}><strong>{c.nombre || 'Sin nombre'}</strong><span>{[c.estado, c.zona].filter(Boolean).join(' · ') || '—'}</span></button>)}</div>
    </>}
    {(mode === 'admin-loading' || mode === 'admin-detail') && <>
      {mode === 'admin-loading' && <p className="msml__status">Cargando cliente…</p>}
      {mode === 'admin-detail' && selected && <ClientView client={selected} admin />}
      <button type="button" className="msml__btn msml__btn--ghost" onClick={() => { setSelected(null); setError(false); setMode('admin'); }}>Volver a clientes</button>
    </>}
    {mode === 'client' && selected && <ClientView client={selected} />}
    <button type="button" className="msml__btn msml__btn--ghost" onClick={salir}>Salir</button>
  </section>;
}

function ClientView({ client, admin = false }) {
  const [routineForm, setRoutineForm] = useState({ objetivo: '', nivel: 'Inicial', sesionesPorSemana: '2', duracionMinutos: '30', material: 'Sombra, cuerda y manoplas si están disponibles', focoTecnico: 'Técnica, coordinación y biomecánica', limitaciones: '' });
  const [routineBusy, setRoutineBusy] = useState(false);
  const [routineMessage, setRoutineMessage] = useState('');
  const [routineError, setRoutineError] = useState('');
  const [createdRoutine, setCreatedRoutine] = useState(null);
  const rutinas = Array.isArray(client.rutinas) ? client.rutinas : [];
  const analysis = Array.isArray(client.movementAnalysis)
    ? [...client.movementAnalysis].sort((a, b) => String(b['Fecha evaluación'] || '').localeCompare(String(a['Fecha evaluación'] || '')))
    : [];
  return <div className="msml__data" aria-label={admin ? 'Ficha de cliente' : 'Datos de cliente'}>
    {client.nombre && <p className="msml__lead">{client.nombre}</p>}
    <p>Plan: {client.plan?.tipo || '—'}</p>
    <p>Pago: {client.pago?.estado || '—'}{client.pago?.importePendiente ? ` · Pendiente: ${client.pago.importePendiente} €` : ''}</p>
    <p>Clases: {client.clases?.realizadas ?? 0}/{client.clases?.contratadas ?? 0} · Restantes: {client.clases?.restantes ?? 0}</p>
    <div className="msml__overview">
      <article className="msml__metric"><span className="msml__eyebrow">PLAN ACTUAL</span><strong>{client.plan?.tipo || 'Plan por confirmar'}</strong><small>{client.plan?.frecuencia ? `${client.plan.frecuencia} · ` : ''}{client.plan?.precio != null ? `${client.plan.precio} €` : 'Consulta los detalles con tu entrenador'}</small></article>
      <article className="msml__metric"><span className="msml__eyebrow">SESIONES RESTANTES</span><strong>{client.clases?.restantes ?? '—'}</strong><small>{client.clases?.realizadas ?? 0} realizadas de {client.clases?.contratadas ?? '—'} contratadas</small></article>
      <article className="msml__metric"><span className="msml__eyebrow">ESTADO DEL PAGO</span><strong>{client.pago?.estado || 'Por confirmar'}</strong><small>{Number(client.pago?.importePendiente || 0) > 0 ? `Pendiente: ${Number(client.pago.importePendiente).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}` : 'Consulta aquí cualquier actualización con tu entrenador'}</small></article>
    </div>
    <section className="msml__section" aria-labelledby="msml-analysis-title">
      <div className="msml__section-heading"><div><span className="msml__eyebrow">SEGUIMIENTO TÉCNICO</span><h2 id="msml-analysis-title">Movement Analysis</h2></div><span className="msml__count">{analysis.length} {analysis.length === 1 ? 'registro' : 'registros'}</span></div>
      {analysis.length ? <div className="msml__analysis-list">{analysis.map((entry, index) => {
        const date = entry['Fecha evaluación'];
        const dateLabel = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : date;
        const fields = [['Observación', 'Texto cliente — Observación'], ['Por qué importa', 'Texto cliente — Por qué importa'], ['Qué trabajamos', 'Texto cliente — Qué trabajamos'], ['Evolución', 'Texto cliente — Evolución'], ['Siguiente objetivo', 'Texto cliente — Siguiente objetivo']].filter(([, key]) => entry[key] != null && String(entry[key]).trim());
        return <article className="msml__analysis-card" key={entry.id || `${date || 'registro'}-${index}`}>
          <div className="msml__analysis-meta"><span>{entry.Disciplina || 'Evaluación técnica'}</span>{dateLabel && <time>{dateLabel}</time>}</div>
          {fields.length ? <div className="msml__analysis-fields">{fields.map(([label, key]) => <div className="msml__analysis-field" key={key}><h3>{label}</h3><p>{String(entry[key])}</p></div>)}</div> : <p className="msml__empty">Este registro todavía no tiene un resumen visible para el alumno.</p>}
        </article>;
      })}</div> : <div className="msml__empty-state"><span className="msml__empty-mark" aria-hidden="true">+</span><h3>Tu seguimiento empieza aquí</h3><p>Cuando tu entrenador publique una evaluación para ti, encontrarás aquí los puntos trabajados, tu evolución y el siguiente objetivo.</p></div>}
    </section>
    <section className="msml__section" aria-labelledby="msml-routines-title">
      <div className="msml__section-heading">
        <div><span className="msml__eyebrow">PLANIFICACIÓN SEMANAL</span><h2 id="msml-routines-title">Tus rutinas</h2></div>
        <span className="msml__count">{rutinas.length} {rutinas.length === 1 ? 'rutina' : 'rutinas'}</span>
      </div>
      {rutinas.length ? <div className="msml__routine-list">{rutinas.map((routine) => {
        const inicio = routine.semanaInicio && !Number.isNaN(Date.parse(routine.semanaInicio)) ? new Date(routine.semanaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : routine.semanaInicio;
        const fin = routine.semanaFin && !Number.isNaN(Date.parse(routine.semanaFin)) ? new Date(routine.semanaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : routine.semanaFin;
        return <article className="msml__routine-card" key={routine.id}>
          <div className="msml__analysis-meta"><span>{routine.nivel || 'Plan SML'}</span><time>{inicio ? `${inicio}${fin ? ` — ${fin}` : ''}` : 'Plan semanal'}</time></div>
          <h3>{routine.titulo}</h3>
          {routine.objetivo && <p className="msml__routine-goal"><strong>Objetivo</strong>{routine.objetivo}</p>}
          <div className="msml__routine-meta">{routine.sesionesPorSemana != null && <span>{routine.sesionesPorSemana} sesiones/semana</span>}{routine.origen && <span>{routine.origen === 'IA revisada' ? 'Preparada con IA · revisada por el entrenador' : routine.origen === 'Plantilla SML' ? 'Sistema SML' : 'Planificación del entrenador'}</span>}</div>
          {routine.contenido && <div className="msml__routine-content">{routine.contenido}</div>}
        </article>;
      })}</div> : <div className="msml__empty-state"><span className="msml__empty-mark" aria-hidden="true">+</span><h3>Tu próxima rutina aparecerá aquí</h3><p>Las rutinas se mostrarán cuando estén publicadas por tu entrenador. Así tendrás el trabajo semanal, su objetivo y las indicaciones en un único lugar.</p></div>}
    </section>
    {admin && client._admin && <p>Zona: {client._admin.zona || '—'} · Formato: {client._admin.formato || '—'} · Frecuencia: {client._admin.frecuencia || '—'}</p>}
    {admin && <section className="msml__section" aria-labelledby="msml-routine-create-title">
      <div className="msml__section-heading"><div><span className="msml__eyebrow">HERRAMIENTAS DEL ENTRENADOR</span><h2 id="msml-routine-create-title">Preparar rutina semanal</h2></div></div>
      <p className="msml__routine-help">Genera una propuesta para este alumno. Se guardará como borrador privado para revisarla antes de publicarla.</p>
      <form className="msml__routine-form" onSubmit={async (event) => {
        event.preventDefault(); setRoutineBusy(true); setRoutineError(''); setRoutineMessage(''); setCreatedRoutine(null);
        try {
          const draft = await generateAdminRoutine({
            contactId: client.id || client._admin?.contactoId,
            objetivo: routineForm.objetivo, nivel: routineForm.nivel,
            sesionesPorSemana: Number(routineForm.sesionesPorSemana),
            duracionMinutos: Number(routineForm.duracionMinutos),
            material: routineForm.material, focoTecnico: routineForm.focoTecnico, limitaciones: routineForm.limitaciones,
          });
          setCreatedRoutine(draft); setRoutineMessage('Borrador guardado en Airtable. Sigue privado hasta su revisión.');
        } catch (e) {
          setRoutineError(e?.code === 'routine-generator-unavailable' ? 'La generación todavía no está configurada en el servidor.' : e?.code === 'forbidden' ? 'Tu cuenta no tiene permiso para generar rutinas.' : e?.code === 'unauthenticated' ? 'La sesión ha caducado. Vuelve a entrar.' : 'No se ha podido crear la rutina. Comprueba los datos y la configuración del servidor.');
        } finally { setRoutineBusy(false); }
      }}>
        <label>Objetivo de la semana<input required minLength="3" maxLength="300" value={routineForm.objetivo} onChange={e => setRoutineForm(v => ({ ...v, objetivo: e.target.value }))} placeholder="Ej. Mejorar guardia, desplazamientos y coordinación" /></label>
        <div className="msml__routine-form-grid">
          <label>Nivel<select value={routineForm.nivel} onChange={e => setRoutineForm(v => ({ ...v, nivel: e.target.value }))}><option>Inicial</option><option>Intermedio</option><option>Avanzado</option></select></label>
          <label>Sesiones/semana<select value={routineForm.sesionesPorSemana} onChange={e => setRoutineForm(v => ({ ...v, sesionesPorSemana: e.target.value }))}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          <label>Duración por sesión<select value={routineForm.duracionMinutos} onChange={e => setRoutineForm(v => ({ ...v, duracionMinutos: e.target.value }))}>{[15,20,30,40,45,60,90,120].map(n => <option key={n} value={n}>{n} min</option>)}</select></label>
        </div>
        <label>Material disponible<input value={routineForm.material} maxLength="300" onChange={e => setRoutineForm(v => ({ ...v, material: e.target.value }))} /></label>
        <label>Foco técnico<input value={routineForm.focoTecnico} maxLength="500" onChange={e => setRoutineForm(v => ({ ...v, focoTecnico: e.target.value }))} /></label>
        <label>Limitaciones relevantes (opcional)<textarea value={routineForm.limitaciones} maxLength="500" onChange={e => setRoutineForm(v => ({ ...v, limitaciones: e.target.value }))} rows={3} placeholder="Molestias, restricciones o aspectos que el entrenador debe comprobar" /></label>
        <button className="msml__btn" type="submit" disabled={routineBusy}>{routineBusy ? 'Generando borrador…' : 'Generar borrador con IA'}</button>
      </form>
      {routineError && <p className="msml__note" role="alert">{routineError}</p>}
      {routineMessage && <p className="msml__routine-success" role="status">{routineMessage}</p>}
      {createdRoutine && <article className="msml__routine-card"><div className="msml__analysis-meta"><span>BORRADOR PRIVADO</span><span>{createdRoutine.estado || 'Pendiente revisión'}</span></div><h3>{createdRoutine.titulo || 'Rutina semanal SML'}</h3>{createdRoutine.objetivo && <p><strong>Objetivo:</strong> {createdRoutine.objetivo}</p>}<div className="msml__routine-content">{createdRoutine.contenido}</div></article>}
    </section>}
  </div>;
}
