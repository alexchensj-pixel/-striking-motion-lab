import { useEffect, useState } from 'react';
import { getAdminClient, getAdminClients, getCurrentClient, closeSession } from './clientApi.js';

export default function MiSMLDashboard({ onSessionEnded }) {
  const [mode, setMode] = useState('loading');
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const list = await getAdminClients();
        if (vivo) { setMode('admin'); setClients(list); }
      } catch (e) {
        // La petición administrativa es solo para el panel de gestión. Un fallo en ella
        // no debe impedir que un cliente normal cargue sus propios datos por /me.
        if (e?.code === 'unauthenticated') { onSessionEnded?.(); return; }
        try {
          const client = await getCurrentClient();
          if (vivo) { setMode('client'); setSelected(client); }
        } catch (inner) {
          if (inner?.code === 'unauthenticated') onSessionEnded?.();
          else if (vivo) setError(true);
        }
      }
    })();
    return () => { vivo = false; };
  }, [onSessionEnded]);

  const abrir = async (id) => {
    setSelected(null); setMode('admin-loading'); setError(false);
    try { setSelected(await getAdminClient(id)); setMode('admin-detail'); }
    catch (e) { if (e?.code === 'unauthenticated') onSessionEnded?.(); else setError(true); }
  };
  const cerrarSesion = async () => {
    setClosingSession(true);
    setLogoutError(false);
    try { await closeSession(); }
    catch { setLogoutError(true); setClosingSession(false); }
  };

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
      <button type="button" className="msml__btn msml__btn--ghost" onClick={() => { setSelected(null); setMode('admin'); }}>Volver a clientes</button>
    </>}
    {mode === 'client' && selected && <ClientView client={selected} />}
    {logoutError && <p className="msml__note" role="alert">No se ha podido cerrar la sesión. Sigues conectado; inténtalo de nuevo.</p>}
    <div className="msml__actions msml__session-actions">
      <a className="msml__btn msml__btn--ghost" href="/">Salir</a>
      <button type="button" className="msml__btn" onClick={cerrarSesion} disabled={closingSession}>{closingSession ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
    </div>
  </section>;
}

function ClientView({ client, admin = false }) {
  const analyses = Array.isArray(client.movementAnalysis) ? client.movementAnalysis : [];
  const adminAnalyses = admin && Array.isArray(client.adminMovementAnalysis) ? client.adminMovementAnalysis : analyses;
  return <div className="msml__data" aria-label={admin ? 'Ficha de cliente' : 'Datos de cliente'}>
    {client.nombre && <p className="msml__lead">{client.nombre}</p>}
    <section className="msml__summary" aria-label="Resumen del plan">
      <p>Plan: {client.plan?.tipo || '—'}</p>
      {client.plan?.frecuencia && <p>Frecuencia: {client.plan.frecuencia}</p>}
      {client.plan?.precio != null && client.plan.precio !== '' && <p>Precio del plan: {client.plan.precio} €</p>}
      <p>Pago: {client.pago?.estado || '—'}{client.pago?.importePendiente ? ` · Pendiente: ${client.pago.importePendiente} €` : ''}</p>
      <p>Clases: {client.clases?.realizadas ?? 0}/{client.clases?.contratadas ?? 0} · Restantes: {client.clases?.restantes ?? 0}</p>
    </section>
    {analyses.length > 0 && <section className="msml__analysis" aria-label="Análisis de movimiento">
      <h2 className="msml__section-title">Análisis de movimiento</h2>
      {adminAnalyses.map((item, index) => {
        const fields = item || {};
        const details = [
          ['Fecha de evaluación', fields['Fecha evaluación']],
          ['Disciplina', fields['Disciplina']],
          ['Por qué importa', fields['Texto cliente — Por qué importa']],
          ['Qué trabajamos', fields['Texto cliente — Qué trabajamos']],
          ['Evolución', fields['Texto cliente — Evolución']],
          ['Siguiente objetivo', fields['Texto cliente — Siguiente objetivo']],
          ['Fecha de revisión', fields['Fecha revisión']],
        ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
        const observation = fields['Texto cliente — Observación'];
        return <article className="msml__analysis-card" key={item.id || `${index}-${fields['Fecha evaluación'] || 'analisis'}`}>
          <h3>{observation || (admin ? fields['Análisis'] : '') || 'Seguimiento de movimiento'}</h3>
          {details.map(([label, value]) => <p key={label}><strong>{label}:</strong> {String(value)}</p>)}
        </article>;
      })}
    </section>}
    {admin && client._admin && <p>Zona: {client._admin.zona || '—'} · Formato: {client._admin.formato || '—'} · Frecuencia: {client._admin.frecuencia || '—'}</p>}
  </div>;
}
