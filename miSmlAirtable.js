// MI SML · fuente privada Airtable. El navegador nunca recibe AIRTABLE_TOKEN.
const BASE_ID = () => String(process.env.AIRTABLE_BASE_ID || '').trim();
const TOKEN = () => String(process.env.AIRTABLE_TOKEN || '').trim();
const CONTACTOS = 'Contactos';
const PLANES = 'Bonos y planes';
const PAGOS = 'Pagos';
const SESIONES = 'Sesiones';
const ANALISIS = 'SML — Movement Analysis';
const AUTH0_FIELD = () => String(process.env.AIRTABLE_AUTH0_FIELD || 'Auth0 ID').trim();
const api = (table, params = '') => `https://api.airtable.com/v0/${encodeURIComponent(BASE_ID())}/${encodeURIComponent(table)}${params ? `?${params}` : ''}`;

async function airtableFetch(table, params = '') {
  const token = TOKEN(); const base = BASE_ID();
  if (!token || !base) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const res = await fetch(api(table, params), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) throw Object.assign(new Error('Airtable request failed'), { code: `AIRTABLE_HTTP_${res.status}` });
  return res.json();
}
const esc = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const linkedIds = (x) => Array.isArray(x) ? x.map(v => typeof v === 'string' ? v : v?.id).filter(Boolean) : [];
const num = (x) => typeof x === 'number' ? x : Number(String(x ?? '').replace(',', '.')) || 0;

async function listByIds(table, ids, fields, fetcher = airtableFetch) {
  if (!ids.length) return [];
  const unique = [...new Set(ids)]; const rows = [];
  for (let i = 0; i < unique.length; i += 20) {
    const batch = unique.slice(i, i + 20);
    const formula = `OR(${batch.map(id => `RECORD_ID()='${esc(id)}'`).join(',')})`;
    const p = new URLSearchParams({ filterByFormula: formula, pageSize: '100' });
    for (const f of fields) p.append('fields[]', f);
    const data = await fetcher(table, p.toString()); rows.push(...(data.records || []));
  }
  return rows;
}

export function configurado(env = process.env) {
  return Boolean(String(env.AIRTABLE_BASE_ID || '').trim() && String(env.AIRTABLE_TOKEN || '').trim());
}

async function buildClient(contacto, get = airtableFetch) {
  const cf = contacto.fields || {};
  const planIds = linkedIds(cf['Bonos y planes']);
  const pagoIds = linkedIds(cf['Pagos']);
  const sesionIds = linkedIds(cf['Sesiones']);
  const analisisIds = linkedIds(cf['SML — Movement Analysis']);
  const [planes, pagos, sesiones, analisis] = await Promise.all([
    listByIds(PLANES, planIds, ['Registro','Tipo','Clases contratadas','Clases realizadas','Precio','Estado pago','Frecuencia','Notas','Sesiones registradas','Sesiones restantes','Progreso'], get),
    listByIds(PAGOS, pagoIds, ['Pago','Fecha','Importe','Estado','Método','Concepto','Notas'], get),
    listByIds(SESIONES, sesionIds, ['Sesión','Fecha','Disciplina','Formato','Precio cobrado','Notas','Plan asociado'], get),
    listByIds(ANALISIS, analisisIds, ['Análisis','Fecha evaluación','Disciplina','Objetivo del cliente','Observación','Evidencia','Interpretación','Hipótesis entrenador','Prioridad','Intervención','Qué buscamos cambiar','Respuesta','Transferencia','Antes','Ahora','Cambio observado','Siguiente prueba','Visible al cliente','Texto cliente — Observación','Texto cliente — Por qué importa','Texto cliente — Qué trabajamos','Texto cliente — Evolución','Texto cliente — Siguiente objetivo','Estado','Fecha revisión'], get),
  ]);
  const activePlans = planes.filter(r => { const e = String(r.fields?.['Estado pago'] ?? '').toLowerCase(); return e !== 'cancelado' && e !== 'finalizado'; });
  const plan = activePlans[0]?.fields || planes[0]?.fields || {};
  const realizadas = num(plan['Clases realizadas'] ?? plan['Sesiones registradas']);
  const contratadas = num(plan['Clases contratadas']);
  const restantes = plan['Sesiones restantes'] != null ? num(plan['Sesiones restantes']) : Math.max(0, contratadas - realizadas);
  const pendingPayments = pagos.filter(r => { const e = String(r.fields?.['Estado'] ?? '').toLowerCase(); return e.includes('pend') || e.includes('adeud') || e.includes('no pag'); });
  const importePendiente = pendingPayments.reduce((sum, r) => sum + num(r.fields?.['Importe']), 0);
  const visibleAnalysis = analisis.filter(r => { const v = r.fields?.['Visible al cliente']; return v === true || String(v ?? '').toLowerCase() === 'sí' || String(v ?? '').toLowerCase() === 'si'; });
  return {
    nombre: String(cf['Nombre'] ?? '').trim(),
    plan: { tipo: plan['Tipo'] ?? plan['Registro'] ?? null, frecuencia: plan['Frecuencia'] ?? null, precio: plan['Precio'] ?? null, registro: plan['Registro'] ?? null },
    pago: { estado: plan['Estado pago'] ?? null, importePendiente },
    clases: { contratadas, realizadas, restantes },
    movementAnalysis: visibleAnalysis.map(r => ({ id: r.id, ...r.fields })),
    _meta: { contactoId: contacto.id },
    _admin: { telefono: cf['Teléfono'] ?? null, estado: cf['Estado'] ?? null, zona: cf['Zona'] ?? null, formato: cf['Formato'] ?? null, frecuencia: cf['Frecuencia'] ?? null },
  };
}

export async function obtener(identidad, deps = {}) {
  const sub = String(identidad?.sub || '').trim(); if (!sub) return { estado: 'forbidden' };
  const get = deps.fetchTable || airtableFetch; const field = AUTH0_FIELD();
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const formula = `{${field}}='${esc(sub)}'`;
  const contactos = await get(CONTACTOS, new URLSearchParams({ filterByFormula: formula, maxRecords: '2' }).toString());
  const records = contactos.records || [];
  if (records.length === 0) return { estado: 'forbidden' };
  if (records.length > 1) throw Object.assign(new Error('Identidad Auth0 duplicada'), { code: 'AUTH0_ID_NOT_UNIQUE' });
  return { estado: 'connected', client: await buildClient(records[0], get) };
}

export async function listarClientes(deps = {}) {
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const params = new URLSearchParams({ pageSize: '100' });
  for (const f of ['Nombre','Estado','Zona','Formato','Frecuencia','Bonos y planes','Auth0 ID']) params.append('fields[]', f);
  const data = await get(CONTACTOS, params.toString());
  const clients = (data.records || []).map(r => ({ id: r.id, nombre: String(r.fields?.Nombre ?? '').trim(), estado: r.fields?.Estado ?? null, zona: r.fields?.Zona ?? null, formato: r.fields?.Formato ?? null, frecuencia: r.fields?.Frecuencia ?? null, tieneCuenta: Boolean(String(r.fields?.['Auth0 ID'] ?? '').trim()) }));
  return { clients };
}

export async function obtenerPorContactoId(contactoId, deps = {}) {
  const id = String(contactoId || '').trim(); if (!id) return { estado: 'not-found' };
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const rows = await listByIds(CONTACTOS, [id], ['Nombre','Teléfono','Estado','Zona','Formato','Frecuencia','Auth0 ID','Bonos y planes','Pagos','Sesiones','SML — Movement Analysis'], get);
  if (!rows.length) return { estado: 'not-found' };
  return { estado: 'connected', client: await buildClient(rows[0], get) };
}

export const _internals = { airtableFetch, listByIds, buildClient };
