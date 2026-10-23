import test from 'node:test';
import assert from 'node:assert/strict';
import { obtener, crearBorradorRutina } from './miSmlAirtable.js';

test('Airtable: una identidad Auth0 devuelve solo sus datos y filtra análisis visibles', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest';
  process.env.AIRTABLE_TOKEN = 'pat_test';
  const calls = [];
  const fake = async (table, query) => {
    calls.push({ table, query });
    if (table === 'Contactos') return { records: [{ id: 'recC', fields: { Nombre: 'Ana', 'Auth0 ID': 'auth0|A', 'Bonos y planes': [{id:'recP'}], Pagos: [{id:'recG'}], Sesiones: [{id:'recS'}], 'SML — Movement Analysis': [{id:'recM1'},{id:'recM2'}] } }] };
    if (table === 'Bonos y planes') return { records: [{id:'recP', fields: {'Tipo':'Progresión','Clases contratadas':8,'Clases realizadas':3,'Estado pago':'Pagado','Precio':185,'Sesiones restantes':5}}] };
    if (table === 'Pagos') return { records: [{id:'recG', fields: {'Importe':0,'Estado':'Pagado'}}] };
    if (table === 'Sesiones') return { records: [{id:'recS', fields: {'Sesión':'S1'}}] };
    if (table === 'SML — Movement Analysis') return { records: [
      {id:'recM1', fields: {'Análisis':'Visible','Visible al cliente':true}},
      {id:'recM2', fields: {'Análisis':'Privado','Visible al cliente':false}},
    ] };
    throw new Error(table);
  };
  const r = await obtener({sub:'auth0|A'}, {fetchTable:fake});
  assert.equal(r.estado, 'connected');
  assert.deepEqual(r.client.clases, {contratadas:8, realizadas:3, restantes:5});
  assert.equal(r.client.nombre, 'Ana');
  assert.equal(r.client.movementAnalysis.length, 1);
  assert.equal(calls[0].table, 'Contactos');
});

test('Airtable: sin correspondencia no devuelve datos', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest';
  process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async () => ({records: []});
  assert.deepEqual(await obtener({sub:'auth0|NO'}, {fetchTable:fake}), {estado:'forbidden'});
});

// ── V29.1 · seguridad de campos y de fichas ajenas ──
import { obtenerPorContactoId, listarClientes } from './miSmlAirtable.js';

const contactoFake = { id: 'recAAAAAAAAAAAAAA', fields: { Nombre: 'Ana', Teléfono: '600', Estado: 'Activo', Zona: 'Centro', 'Auth0 ID': 'auth0|A', 'SML — Movement Analysis': [{ id: 'recM1' }] } };
const fakeCompleto = async (table) => {
  if (table === 'Contactos') return { records: [contactoFake] };
  if (table === 'SML — Movement Analysis') return { records: [{ id: 'recM1', fields: {
    'Análisis': 'X', 'Visible al cliente': true, 'Disciplina': 'Boxeo',
    'Interpretación': 'INTERNO', 'Hipótesis entrenador': 'INTERNO', 'Evidencia': 'INTERNO', 'Observación': 'INTERNO',
    'Texto cliente — Observación': 'Para el cliente',
  } }] };
  return { records: [] };
};

test('Cliente: /me NO incluye _admin, _meta ni campos internos del análisis', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const r = await obtener({ sub: 'auth0|A' }, { fetchTable: fakeCompleto });
  assert.equal(r.client._admin, undefined);
  assert.equal(r.client._meta, undefined);
  const texto = JSON.stringify(r.client);
  assert.ok(!texto.includes('INTERNO'));
  assert.ok(!texto.includes('600'));
  assert.equal(r.client.movementAnalysis[0]['Texto cliente — Observación'], 'Para el cliente');
});

test('Airtable: a Airtable ni se le piden los campos internos del análisis', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const consultas = [];
  await obtener({ sub: 'auth0|A' }, { fetchTable: async (t, q) => { consultas.push({ t, q }); return fakeCompleto(t); } });
  const q = decodeURIComponent(consultas.find(c => c.t === 'SML — Movement Analysis').q);
  assert.ok(!q.includes('Interpretación') && !q.includes('Hipótesis') && !q.includes('Evidencia'));
});

test('Admin: la ficha por ID sí incluye _admin; un ID mal formado → not-found sin llamar a Airtable', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const ok = await obtenerPorContactoId('recAAAAAAAAAAAAAA', { fetchTable: fakeCompleto });
  assert.equal(ok.client._admin.zona, 'Centro');
  let llamadas = 0;
  const r = await obtenerPorContactoId("x') OR ('1'='1", { fetchTable: async () => { llamadas++; return { records: [] }; } });
  assert.deepEqual(r, { estado: 'not-found' });
  assert.equal(llamadas, 0);
});

test('Admin: el listado pagina (más de 100 contactos)', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  let n = 0;
  const fake = async () => (++n === 1
    ? { records: [{ id: 'rec1', fields: { Nombre: 'A' } }], offset: 'itrNEXT' }
    : { records: [{ id: 'rec2', fields: { Nombre: 'B' } }] });
  const { clients } = await listarClientes({ fetchTable: fake });
  assert.equal(clients.length, 2);
});

test('Airtable: las rutinas generadas quedan pendientes de revisión y no visibles', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  let savedTable, savedPayload;
  const result = await crearBorradorRutina({
    contactId: 'recAAAAAAAAAAAAAA', titulo: 'Base técnica', semanaInicio: '2026-10-19', semanaFin: '2026-10-25',
    objetivo: 'Mejorar coordinación', nivel: 'Inicial', sesionesPorSemana: 2, contenido: 'Día 1: técnica básica.',
  }, {
    fetchTable: async (table) => table === 'Contactos' ? { records: [{ id: 'recAAAAAAAAAAAAAA', fields: { Nombre: 'Ana' } }] } : { records: [] },
    createRecord: async (table, payload) => { savedTable = table; savedPayload = payload; return { id: 'recBBBBBBBBBBBBBB' }; },
  });
  assert.equal(savedTable, 'Rutinas Mi SML');
  assert.deepEqual(savedPayload.fields.Cliente, ['recAAAAAAAAAAAAAA']);
  assert.equal(savedPayload.fields.Estado, 'Pendiente revisión');
  assert.equal(savedPayload.fields['Visible al cliente'], false);
  assert.equal(result.estado, 'created');
  assert.equal(result.rutina.visible, false);
});


test('Vinculación automática: solo correo verificado, único y ficha sin Auth0 ID', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  delete process.env.ADMIN_AUTH0_SUB;
  const calls = []; let linked = false;
  const fetchTable = async (table, query) => {
    calls.push({table, query});
    const decodedQuery = decodeURIComponent((query || '').replaceAll('+', ' '));
    if (table !== 'Contactos') return {records: []};
    if (decodedQuery.includes('LOWER(TRIM')) return {records: [{id:'recAAAAAAAAAAAAAA', fields:{Nombre:'Ana', 'Email Mi SML':'ana@example.com'}}]};
    if (decodedQuery.includes('RECORD_ID()')) return {records: [{id:'recAAAAAAAAAAAAAA', fields:{Nombre:'Ana', 'Email Mi SML':'ana@example.com'}}]};
    if (decodedQuery.includes("{Auth0 ID}='auth0|A'")) return {records: linked ? [{id:'recAAAAAAAAAAAAAA', fields:{Nombre:'Ana', 'Auth0 ID':'auth0|A'}}] : []};
    return {records: []};
  };
  const r = await obtener({sub:'auth0|A', email:'ANA@example.com', emailVerified:true}, {
    fetchTable,
    updateContact: async (id, fields) => { assert.equal(id, 'recAAAAAAAAAAAAAA'); assert.deepEqual(fields, {'Auth0 ID':'auth0|A'}); linked = true; return {}; },
  });
  assert.equal(r.estado, 'connected');
  assert.equal(r.client.nombre, 'Ana');
  assert.ok(calls.some(c => decodeURIComponent(c.query.replaceAll('+', ' ')).includes('LOWER(TRIM')));
});

test('Vinculación automática: correo no verificado o ambiguo no escribe nada', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  let writes = 0;
  const fetchTable = async (table, query) => {
    if (table === 'Contactos' && query.includes('LOWER(TRIM')) return {records:[
      {id:'recAAAAAAAAAAAAAA',fields:{'Email Mi SML':'ana@example.com'}},
      {id:'recBBBBBBBBBBBBBB',fields:{'Email Mi SML':'ana@example.com'}},
    ]};
    return {records:[]};
  };
  await obtener({sub:'auth0|A',email:'ana@example.com',emailVerified:false},{fetchTable,updateContact:async()=>{writes++;}});
  await obtener({sub:'auth0|A',email:'ana@example.com',emailVerified:true},{fetchTable,updateContact:async()=>{writes++;}});
  assert.equal(writes,0);
});
