// MI SML · fuente privada Airtable. El navegador nunca recibe AIRTABLE_TOKEN.
const BASE_ID = () => String(process.env.AIRTABLE_BASE_ID || '').trim();
const TOKEN = () => String(process.env.AIRTABLE_TOKEN || '').trim();
const CONTACTOS = 'Contactos';
const PLANES = 'Bonos y planes';
const PAGOS = 'Pagos';
const SESIONES = 'Sesiones';
const ANALISIS = 'SML — Movement Analysis';
const RUTINAS = 'Rutinas Mi SML';
const AUTH0_FIELD = () => String(process.env.AIRTABLE_AUTH0_FIELD || 'Auth0 ID').trim();
// Único conjunto de campos de «SML — Movement Analysis» que puede salir del servidor hacia el navegador (cliente o admin).
// Lo interno del entrenador (Observación, Evidencia, Interpretación, Hipótesis…) ni siquiera se pide a Airtable.
const ANALISIS_CAMPOS_CLIENTE = ['Fecha evaluación','Disciplina','Texto cliente — Observación','Texto cliente — Por qué importa','Texto cliente — Qué trabajamos','Texto cliente — Evolución','Texto cliente — Siguiente objetivo'];
const ID_CONTACTO = /^rec[A-Za-z0-9]{14}$/;
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

async function buildClient(contacto, get = airtableFetch, { admin = false } = {}) {
  const cf = contacto.fields || {};
  const planIds = linkedIds(cf['Bonos y planes']);
  const pagoIds = linkedIds(cf['Pagos']);
  const sesionIds = linkedIds(cf['Sesiones']);
  const analisisIds = linkedIds(cf['SML — Movement Analysis']);
  const rutinaIds = linkedIds(cf['Rutinas Mi SML']);
  const [planes, pagos, sesiones, analisis, rutinas] = await Promise.all([
    listByIds(PLANES, planIds, ['Registro','Tipo','Clases contratadas','Clases realizadas','Precio','Estado pago','Frecuencia','Notas','Sesiones registradas','Sesiones restantes','Progreso'], get),
    listByIds(PAGOS, pagoIds, ['Pago','Fecha','Importe','Estado','Método','Concepto','Notas'], get),
    listByIds(SESIONES, sesionIds, ['Sesión','Fecha','Disciplina','Formato','Precio cobrado','Notas','Plan asociado'], get),
    listByIds(ANALISIS, analisisIds, ['Visible al cliente', ...ANALISIS_CAMPOS_CLIENTE], get),
    listByIds(RUTINAS, rutinaIds, ['Rutina','Semana inicio','Semana fin','Estado','Objetivo','Nivel','Sesiones por semana','Contenido rutina','Visible al cliente','Fecha publicación','Origen'], get),
  ]);
  const activePlans = planes.filter(r => { const e = String(r.fields?.['Estado pago'] ?? '').toLowerCase(); return e !== 'cancelado' && e !== 'finalizado'; });
  const plan = activePlans[0]?.fields || planes[0]?.fields || {};
  const realizadas = num(plan['Clases realizadas'] ?? plan['Sesiones registradas']);
  const contratadas = num(plan['Clases contratadas']);
  const restantes = plan['Sesiones restantes'] != null ? num(plan['Sesiones restantes']) : Math.max(0, contratadas - realizadas);
  const pendingPayments = pagos.filter(r => { const e = String(r.fields?.['Estado'] ?? '').toLowerCase(); return e.includes('pend') || e.includes('adeud') || e.includes('no pag'); });
  const importePendiente = pendingPayments.reduce((sum, r) => sum + num(r.fields?.['Importe']), 0);
  const visibleAnalysis = analisis.filter(r => { const v = r.fields?.['Visible al cliente']; return v === true || String(v ?? '').toLowerCase() === 'sí' || String(v ?? '').toLowerCase() === 'si'; });
  const rutinasPublicadas = rutinas.filter(r => {
    const f = r.fields || {};
    const visible = f['Visible al cliente'] === true || ['sí', 'si', 'true'].includes(String(f['Visible al cliente'] ?? '').toLowerCase());
    const estado = typeof f['Estado'] === 'object' ? f['Estado']?.name : f['Estado'];
    return visible && String(estado || '').toLowerCase() === 'publicada';
  }).sort((a, b) => String(b.fields?.['Semana inicio'] || '').localeCompare(String(a.fields?.['Semana inicio'] || '')));
  return {
    nombre: String(cf['Nombre'] ?? '').trim(),
    plan: { tipo: plan['Tipo'] ?? plan['Registro'] ?? null, frecuencia: plan['Frecuencia'] ?? null, precio: plan['Precio'] ?? null, registro: plan['Registro'] ?? null },
    pago: { estado: plan['Estado pago'] ?? null, importePendiente },
    clases: { contratadas, realizadas, restantes },
    movementAnalysis: visibleAnalysis.map(r => ({ id: r.id, ...Object.fromEntries(ANALISIS_CAMPOS_CLIENTE.filter(k => r.fields?.[k] != null).map(k => [k, r.fields[k]])) })),
    rutinas: rutinasPublicadas.map(r => {
      const f = r.fields || {};
      return { id: r.id, titulo: f['Rutina'] || 'Rutina semanal', semanaInicio: f['Semana inicio'] || null, semanaFin: f['Semana fin'] || null, objetivo: f['Objetivo'] || null, nivel: f['Nivel'] || null, sesionesPorSemana: f['Sesiones por semana'] ?? null, contenido: f['Contenido rutina'] || '', fechaPublicacion: f['Fecha publicación'] || null, origen: f['Origen'] || null };
    }),
    ...(admin ? { _meta: { contactoId: contacto.id }, _admin: { telefono: cf['Teléfono'] ?? null, estado: cf['Estado'] ?? null, zona: cf['Zona'] ?? null, formato: cf['Formato'] ?? null, frecuencia: cf['Frecuencia'] ?? null } } : {}),
  };
}

export async function obtener(identidad, deps = {}) {
  const sub = String(identidad?.sub || '').trim();
  if (!sub) return { estado: 'forbidden' };
  const get = deps.fetchTable || airtableFetch;
  const field = AUTH0_FIELD();
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });

  // First preference: stable Auth0 subject already linked to this contact.
  const bySub = await get(CONTACTOS, new URLSearchParams({
    filterByFormula: `{${field}}='${esc(sub)}'`, maxRecords: '2',
  }).toString());
  const linked = bySub.records || [];
  if (linked.length > 1) throw Object.assign(new Error('Identidad Auth0 duplicada'), { code: 'AUTH0_ID_NOT_UNIQUE' });
  if (linked.length === 1) return { estado: 'connected', client: await buildClient(linked[0], get) };

  // Safe first-login linking: only a signed, explicitly verified email from the validated Auth0 token.
  const email = String(identidad?.email || '').trim().toLowerCase();
  if (identidad?.email_verified !== true || !email || !email.includes('@')) return { estado: 'forbidden' };
  const emailField = String(process.env.AIRTABLE_EMAIL_FIELD || 'Email Mi SML').trim();
  const byEmail = await get(CONTACTOS, new URLSearchParams({
    filterByFormula: `LOWER({${emailField}})='${esc(email)}'`, maxRecords: '3',
  }).toString());
  const matches = byEmail.records || [];
  if (matches.length !== 1) return { estado: 'forbidden' };
  const contact = matches[0];
  const existingSub = String(contact.fields?.[field] || '').trim();
  if (existingSub && existingSub !== sub) return { estado: 'forbidden' };

  const save = deps.updateRecord || (async (table, id, fields) => {
    const token = TOKEN(); const base = BASE_ID();
    if (!token || !base) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
    const response = await fetch(api(table, encodeURIComponent(id)), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) throw Object.assign(new Error('Airtable update failed'), { code: `AIRTABLE_HTTP_${response.status}` });
    return response.json();
  });
  if (!existingSub) {
    await save(CONTACTOS, contact.id, { [field]: sub });
    const check = await get(CONTACTOS, new URLSearchParams({
      filterByFormula: `{${field}}='${esc(sub)}'`, maxRecords: '2',
    }).toString());
    const confirmed = check.records || [];
    if (confirmed.length !== 1 || confirmed[0].id !== contact.id) return { estado: 'forbidden' };
    return { estado: 'connected', client: await buildClient(confirmed[0], get) };
  }
  return { estado: 'connected', client: await buildClient(contact, get) };
}

export async function listarClientes(deps = {}) {
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const params = new URLSearchParams({ pageSize: '100' });
  for (const f of ['Nombre','Estado','Zona','Formato','Frecuencia','Bonos y planes','Auth0 ID']) params.append('fields[]', f);
  const records = []; let offset = null;
  do {
    const p = new URLSearchParams(params); if (offset) p.set('offset', offset);
    const data = await get(CONTACTOS, p.toString());
    records.push(...(data.records || [])); offset = data.offset || null;
  } while (offset && records.length < 5000);
  const clients = records.map(r => ({ id: r.id, nombre: String(r.fields?.Nombre ?? '').trim(), estado: r.fields?.Estado ?? null, zona: r.fields?.Zona ?? null, formato: r.fields?.Formato ?? null, frecuencia: r.fields?.Frecuencia ?? null, tieneCuenta: Boolean(String(r.fields?.['Auth0 ID'] ?? '').trim()) }));
  return { clients };
}

export async function obtenerPorContactoId(contactoId, deps = {}) {
  const id = String(contactoId || '').trim(); if (!ID_CONTACTO.test(id)) return { estado: 'not-found' };
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const rows = await listByIds(CONTACTOS, [id], ['Nombre','Teléfono','Estado','Zona','Formato','Frecuencia','Auth0 ID','Bonos y planes','Pagos','Sesiones','SML — Movement Analysis','Rutinas Mi SML'], get);
  if (!rows.length) return { estado: 'not-found' };
  return { estado: 'connected', client: await buildClient(rows[0], get, { admin: true }) };
}

export async function crearBorradorRutina(input, deps = {}) {
  const contactId = String(input?.contactId || '').trim();
  if (!ID_CONTACTO.test(contactId)) return { estado: 'not-found' };
  if (!configurado()) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
  const get = deps.fetchTable || airtableFetch;
  const contacts = await listByIds(CONTACTOS, [contactId], ['Nombre'], get);
  if (!contacts.length) return { estado: 'not-found' };
  const fields = {
    'Rutina': String(input.titulo || 'Rutina semanal').slice(0, 120),
    'Cliente': [contactId], 'Semana inicio': input.semanaInicio, 'Semana fin': input.semanaFin,
    'Estado': 'Pendiente revisión', 'Objetivo': String(input.objetivo || '').slice(0, 1000),
    'Nivel': input.nivel, 'Sesiones por semana': Number(input.sesionesPorSemana),
    'Contenido rutina': String(input.contenido || '').slice(0, 18000), 'Visible al cliente': false,
  };
  const createRecord = deps.createRecord || (async (table, payload) => {
    const token = TOKEN(); const base = BASE_ID();
    if (!token || !base) throw Object.assign(new Error('Airtable no configurado'), { code: 'AIRTABLE_NOT_CONFIGURED' });
    const response = await fetch(api(table), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw Object.assign(new Error('Airtable create failed'), { code: `AIRTABLE_HTTP_${response.status}` });
    return response.json();
  });
  const created = await createRecord(RUTINAS, { fields });
  return { estado: 'created', rutina: { id: created.id, ...fields, estado: 'Pendiente revisión', visible: false } };
}

export const _internals = { airtableFetch, listByIds, buildClient };
