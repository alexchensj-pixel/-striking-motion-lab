import { useEffect, useState } from 'react';
import { getAdminClient, getAdminClients, getCurrentClient, signOut } from './clientApi.js';

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
    {admin && client._admin && <p>Zona: {client._admin.zona || '—'} · Formato: {client._admin.formato || '—'} · Frecuencia: {client._admin.frecuencia || '—'}</p>}
  </div>;
}
