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
  return <div className="msml__data" aria-label={admin ? 'Ficha de cliente' : 'Datos de cliente'}>
    {client.nombre && <p className="msml__lead">{client.nombre}</p>}
    <p>Plan: {client.plan?.tipo || '—'}</p>
    <p>Pago: {client.pago?.estado || '—'}{client.pago?.importePendiente ? ` · Pendiente: ${client.pago.importePendiente} €` : ''}</p>
    <p>Clases: {client.clases?.realizadas ?? 0}/{client.clases?.contratadas ?? 0} · Restantes: {client.clases?.restantes ?? 0}</p>
    {admin && client._admin && <p>Zona: {client._admin.zona || '—'} · Formato: {client._admin.formato || '—'} · Frecuencia: {client._admin.frecuencia || '—'}</p>}
  </div>;
}
