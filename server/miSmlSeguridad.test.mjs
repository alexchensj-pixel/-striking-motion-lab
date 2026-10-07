// Pruebas de integración (sin red): token → atender() → fuente Airtable (con Airtable simulado). Cubren aislamiento entre clientes,
// rol de administrador y que lo interno de «SML — Movement Analysis» nunca llega a la respuesta. Ejecutar: npm run test:mi-sml
import test from 'node:test';
import assert from 'node:assert/strict';
import { atender } from './miSml.js';
import * as airtable from './miSmlAirtable.js';

process.env.AIRTABLE_BASE_ID = 'appTest';
process.env.AIRTABLE_TOKEN = 'pat_test';

const ID_A = 'recAAAAAAAAAAAAAA', ID_B = 'recBBBBBBBBBBBBBB';
const INTERNO = ['INTERNO-observacion', 'INTERNO-evidencia', 'INTERNO-interpretacion', 'INTERNO-hipotesis', 'INTERNO-notas'];
const contactos = {
  [ID_A]: { id: ID_A, fields: { Nombre: 'Ana', Teléfono: '600111222', Estado: 'Activo', Zona: 'Centro', 'Auth0 ID': 'auth0|A', 'Bonos y planes': ['recPA'], Pagos: ['recGA'], 'SML — Movement Analysis': ['recMA1', 'recMA2'] } },
  [ID_B]: { id: ID_B, fields: { Nombre: 'Berta', Teléfono: '699333444', Estado: 'Activo', Zona: 'Norte', 'Auth0 ID': 'auth0|B', 'Bonos y planes': ['recPB'], Pagos: ['recGB'], 'SML — Movement Analysis': ['recMB1'] } },
};
const tablas = {
  'Bonos y planes': { recPA: { 'Tipo': 'Progresión', 'Clases contratadas': 8, 'Clases realizadas': 3, 'Estado pago': 'Pagado', 'Notas': INTERNO[4] }, recPB: { 'Tipo': 'BONO-DE-BERTA', 'Clases contratadas': 4, 'Clases realizadas': 1 } },
  Pagos: { recGA: { Importe: 0, Estado: 'Pagado' }, recGB: { Importe: 99, Estado: 'Pendiente' } },
  Sesiones: {},
  'SML — Movement Analysis': {
    recMA1: { 'Visible al cliente': true, Disciplina: 'Boxeo', 'Texto cliente — Observación': 'Texto para Ana', 'Observación': INTERNO[0], 'Evidencia': INTERNO[1], 'Interpretación': INTERNO[2], 'Hipótesis entrenador': INTERNO[3] },
    recMA2: { 'Visible al cliente': false, 'Texto cliente — Observación': 'BORRADOR-NO-VISIBLE' },
    recMB1: { 'Visible al cliente': true, 'Texto cliente — Observación': 'TEXTO-DE-BERTA' },
  },
};
// Airtable simulado: respeta filterByFormula ({Auth0 ID}='…' y RECORD_ID()='…') y fields[] (solo devuelve los campos pedidos), como el real.
const consultas = [];
const fetchTable = async (table, query) => {
  consultas.push({ table, query });
  const p = new URLSearchParams(query);
  const formula = p.get('filterByFormula') || '';
  const pedidos = p.getAll('fields[]');
  const recorta = (fields) => (pedidos.length ? Object.fromEntries(Object.entries(fields).filter(([k]) => pedidos.includes(k))) : fields);
  if (table === 'Contactos') {
    const m = /^\{Auth0 ID\}='(.*)'$/.exec(formula);
    if (m) return { records: Object.values(contactos).filter((c) => c.fields['Auth0 ID'] === m[1].replace(/\\(.)/g, '$1')).map((c) => ({ id: c.id, fields: recorta(c.fields) })) };
    if (formula.startsWith('OR(')) { const ids = [...formula.matchAll(/RECORD_ID\(\)='([^']+)'/g)].map((x) => x[1]); return { records: ids.filter((i) => contactos[i]).map((i) => ({ id: i, fields: recorta(contactos[i].fields) })) }; }
    return { records: Object.values(contactos).map((c) => ({ id: c.id, fields: recorta(c.fields) })) };
  }
  const ids = [...formula.matchAll(/RECORD_ID\(\)='([^']+)'/g)].map((x) => x[1]);
  return { records: ids.filter((i) => tablas[table]?.[i]).map((i) => ({ id: i, fields: recorta(tablas[table][i]) })) };
};
const fuente = {
  obtener: (id) => airtable.obtener(id, { fetchTable }),
  listarClientes: () => airtable.listarClientes({ fetchTable }),
  obtenerPorContactoId: (id) => airtable.obtenerPorContactoId(id, { fetchTable }),
};
const verify = async (t) => ({ tokenA: { sub: 'auth0|A' }, tokenB: { sub: 'auth0|B' }, tokenAdmin: { sub: 'auth0|ADMIN' }, tokenQuote: { sub: "auth0|x' OR '1'='1" } }[t.replace('Bearer ', '')] ?? (() => { throw { kind: 'invalid' }; })());
const pet = (pathname, token, ...resto) => atender({ method: 'GET', pathname, authorization: `Bearer ${token}` }, { verify, fuente, adminSub: resto.length ? resto[0] : 'auth0|ADMIN', log: () => {} });

test('Aislamiento: el cliente A recibe solo lo suyo y nada de B (ni nombre, ni plan, ni análisis)', async () => {
  const r = await pet('/api/mi-sml/me', 'tokenA');
  assert.equal(r.status, 200);
  const txt = JSON.stringify(r.body);
  assert.equal(r.body.client.nombre, 'Ana');
  for (const ajeno of ['Berta', 'BONO-DE-BERTA', 'TEXTO-DE-BERTA', '699333444', 'recPB', 'recMB1']) assert.ok(!txt.includes(ajeno), `fuga: ${ajeno}`);
  const rb = await pet('/api/mi-sml/me', 'tokenB');
  assert.equal(rb.body.client.nombre, 'Berta');
  assert.ok(!JSON.stringify(rb.body).includes('Texto para Ana'));
  assert.ok(!JSON.stringify(rb.body).includes('auth0|A'));
});

test('Datos internos de Movement Analysis, teléfono y notas NO llegan al cliente (respuesta completa de /me)', async () => {
  const r = await pet('/api/mi-sml/me', 'tokenA');
  const txt = JSON.stringify(r.body);
  for (const x of [...INTERNO, 'BORRADOR-NO-VISIBLE', '600111222', '_admin', '_meta', 'Visible al cliente']) assert.ok(!txt.includes(x), `fuga: ${x}`);
  assert.equal(r.body.client.movementAnalysis.length, 1);
  assert.equal(r.body.client.movementAnalysis[0]['Texto cliente — Observación'], 'Texto para Ana');
});

test('Airtable nunca recibe petición de campos internos del análisis (ni en cliente ni en ficha admin)', async () => {
  consultas.length = 0;
  await pet('/api/mi-sml/me', 'tokenA');
  await pet(`/api/mi-sml/admin/clients/${ID_A}`, 'tokenAdmin');
  const q = consultas.filter((c) => c.table === 'SML — Movement Analysis').map((c) => decodeURIComponent(c.query));
  assert.ok(q.length >= 2);
  for (const s of q) {
    const pedidos = new URLSearchParams(s).getAll('fields[]');
    for (const interno of ['Observación', 'Evidencia', 'Interpretación', 'Hipótesis entrenador', 'Hipótesis']) assert.ok(!pedidos.includes(interno), `se pidió ${interno}`);
    assert.ok(pedidos.includes('Texto cliente — Observación'));
  }
});

test('Un cliente no puede usar las rutas de administración (listado ni ficha de otro cliente)', async () => {
  assert.equal((await pet('/api/mi-sml/admin/clients', 'tokenA')).status, 403);
  const ajena = await pet(`/api/mi-sml/admin/clients/${ID_B}`, 'tokenA');
  assert.equal(ajena.status, 403);
  assert.ok(!JSON.stringify(ajena.body).includes('Berta'));
});

test('Admin: ve el listado y la ficha de cualquier cliente; el listado no expone Auth0 ID ni teléfono', async () => {
  const lista = await pet('/api/mi-sml/admin/clients', 'tokenAdmin');
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.body.clients.map((c) => c.nombre).sort(), ['Ana', 'Berta']);
  const txt = JSON.stringify(lista.body);
  for (const x of ['auth0|', '600111222', '699333444']) assert.ok(!txt.includes(x));
  const ficha = await pet(`/api/mi-sml/admin/clients/${ID_B}`, 'tokenAdmin');
  assert.equal(ficha.status, 200);
  assert.equal(ficha.body.client.nombre, 'Berta');
  assert.equal(ficha.body.client._admin.telefono, '699333444');
  for (const x of INTERNO) assert.ok(!JSON.stringify(ficha.body).includes(x), `fuga en ficha admin: ${x}`);
});

test('Sin ADMIN_AUTH0_SUB configurado, nadie es administrador (ni siquiera el sub «admin»)', async () => {
  for (const adminSub of ['', undefined, '   ']) assert.equal((await pet('/api/mi-sml/admin/clients', 'tokenAdmin', adminSub)).status, 403);
});

test('Ficha admin: ID inexistente → 404, ID con inyección → 404 sin consultar Airtable', async () => {
  assert.equal((await pet('/api/mi-sml/admin/clients/recZZZZZZZZZZZZZZ', 'tokenAdmin')).status, 404);
  consultas.length = 0;
  const r = await pet(`/api/mi-sml/admin/clients/${encodeURIComponent("x') OR ('1'='1")}`, 'tokenAdmin');
  assert.equal(r.status, 404);
  assert.equal(consultas.length, 0);
});

test('Inyección en la fórmula: un sub con comillas no devuelve el contacto de otra persona', async () => {
  const r = await pet('/api/mi-sml/me', 'tokenQuote');
  assert.equal(r.status, 403);
});

test('Token ausente o inválido → 401 y Airtable no se consulta', async () => {
  consultas.length = 0;
  for (const rutas of ['/api/mi-sml/me', '/api/mi-sml/admin/clients', `/api/mi-sml/admin/clients/${ID_A}`]) {
    assert.equal((await atender({ method: 'GET', pathname: rutas, authorization: undefined }, { verify, fuente, adminSub: 'auth0|ADMIN', log: () => {} })).status, 401);
    assert.equal((await pet(rutas, 'basura')).status, 401);
  }
  assert.equal(consultas.length, 0);
});

test('Identidad duplicada en Airtable (dos contactos con el mismo Auth0 ID) → 500 controlado, sin datos', async () => {
  const dup = async (t) => (t === 'Contactos' ? { records: [{ id: ID_A, fields: {} }, { id: ID_B, fields: {} }] } : { records: [] });
  const r = await atender({ method: 'GET', pathname: '/api/mi-sml/me', authorization: 'Bearer tokenA' }, { verify, fuente: { obtener: (i) => airtable.obtener(i, { fetchTable: dup }) }, log: () => {} });
  assert.deepEqual([r.status, r.body], [500, { error: 'internal' }]);
});
