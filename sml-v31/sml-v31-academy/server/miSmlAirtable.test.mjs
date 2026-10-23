import test from 'node:test';
import assert from 'node:assert/strict';
import { obtener, obtenerPorContactoId } from './miSmlAirtable.js';

test('Airtable: identidad Auth0 devuelve solo sus datos y filtra análisis visibles', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const calls = [];
  const fake = async (table, query) => {
    calls.push({ table, query });
    if (table === 'Contactos') return { records: [{ id: 'recC', fields: { Nombre: 'Ana', 'Auth0 ID': 'auth0|A', 'Bonos y planes': [{id:'recP'}], Pagos: [{id:'recG'}], Sesiones: [{id:'recS'}], 'SML — Movement Analysis': [{id:'recM1'},{id:'recM2'}] } }] };
    if (table === 'Bonos y planes') return { records: [{id:'recP', fields: {'Tipo':'Progresión','Clases contratadas':8,'Clases realizadas':3,'Estado pago':'Pagado','Precio':185,'Sesiones restantes':5}}] };
    if (table === 'Pagos') return { records: [{id:'recG', fields: {'Importe':0,'Estado':'Pagado'}}] };
    if (table === 'Sesiones') return { records: [{id:'recS', fields: {'Sesión':'S1'}}] };
    if (table === 'SML — Movement Analysis') return { records: [{id:'recM1', fields: {'Análisis':'Visible interno','Visible al cliente':true,'Texto cliente — Observación':'Control de distancia','Hipótesis entrenador':'NO MOSTRAR','Prioridad':'NO MOSTRAR'}},{id:'recM2', fields: {'Análisis':'Privado','Visible al cliente':false,'Texto cliente — Observación':'Oculto'}}] };
    throw new Error(table);
  };
  const r = await obtener({sub:'auth0|A'}, {fetchTable:fake});
  assert.equal(r.estado, 'connected');
  assert.deepEqual(r.client.clases, {contratadas:8, realizadas:3, restantes:5});
  assert.equal(r.client.nombre, 'Ana');
  assert.equal(r.client.movementAnalysis.length, 1);
  assert.equal(calls[0].table, 'Contactos');
  assert.equal('_admin' in r.client, false, 'el cliente no debe recibir metadatos internos');
  assert.equal('_meta' in r.client, false, 'el cliente no debe recibir IDs internos del contacto');
  assert.equal('adminMovementAnalysis' in r.client, false, 'el cliente no debe recibir análisis de administración');
  assert.deepEqual(r.client.movementAnalysis[0], {
    id: 'recM1',
    'Texto cliente — Observación': 'Control de distancia',
  }, 'solo se serializan los campos expresamente preparados para el cliente');
  const serialized = JSON.stringify(r.client);
  for (const internal of ['Hipótesis entrenador', 'NO MOSTRAR', 'Visible interno', 'Prioridad', 'Intervención', 'Evidencia', 'Interpretación', 'Cambio observado', 'Siguiente prueba', 'Notas', 'adminMovementAnalysis', 'Teléfono', 'Zona']) {
    assert.equal(serialized.includes(internal), false, `el cliente no debe recibir ${internal}`);
  }
});

test('Airtable: primer acceso por email verificado vincula y confirma Auth0 ID', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  let updatedSub = '';
  const fake = async (table, query) => {
    if (table !== 'Contactos') return { records: [] };
    const q = String(query);
    if (q.includes('LOWER')) return { records: [{ id:'recM', fields:{Nombre:'María','Email Mi SML':'fergamaria@gmail.com','Auth0 ID':''} }] };
    if (updatedSub) return { records: [{ id:'recM', fields:{Nombre:'María','Email Mi SML':'fergamaria@gmail.com','Auth0 ID':updatedSub} }] };
    return { records: [] };
  };
  let updated = null;
  const update = async (table, id, fields) => { updated = {table,id,fields}; updatedSub = fields['Auth0 ID']; return {id,fields}; };
  const r = await obtener({sub:'google-oauth2|123', email:'  FERGaMaria@gmail.com ', email_verified:true}, {fetchTable:fake, updateRecord:update});
  assert.equal(r.estado, 'connected');
  assert.deepEqual(updated, {table:'Contactos', id:'recM', fields:{'Auth0 ID':'google-oauth2|123'}});
});

test('Airtable: no concede acceso si Airtable no confirma el vínculo recién escrito', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async (table, query) => String(query).includes('LOWER')
    ? { records: [{ id:'recM', fields:{Nombre:'María','Email Mi SML':'maria@example.com','Auth0 ID':''} }] }
    : { records: [] };
  const update = async () => ({ id:'recM' });
  const r = await obtener({sub:'google-oauth2|123', email:'maria@example.com', email_verified:true}, {fetchTable:fake, updateRecord:update});
  assert.deepEqual(r, { estado: 'forbidden' });
});

test('Airtable: email no verificado no vincula', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async () => ({records: []});
  let called = false;
  const update = async () => { called = true; };
  assert.deepEqual(await obtener({sub:'auth0|NO', email:'x@gmail.com', email_verified:false}, {fetchTable:fake, updateRecord:update}), {estado:'forbidden'});
  assert.equal(called, false);
});

test('Airtable: email duplicado no vincula ambiguamente', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async (table, query) => table === 'Contactos' && String(query).includes('LOWER') ? {records:[{id:'a',fields:{}},{id:'b',fields:{}}]} : {records:[]};
  await assert.rejects(() => obtener({sub:'auth0|X', email:'x@gmail.com', email_verified:true}, {fetchTable:fake}), /Email Mi SML duplicado/);
});


test('Airtable: campos internos del análisis solo salen por la ruta de detalle administrativa', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recAdmin', fields: {
      Nombre: 'Ana', Teléfono: '600000000', Estado: 'Cliente activo', Zona: 'Centro', Formato: '1:1', Frecuencia: '2x',
      'Bonos y planes': [{ id: 'recP' }], Pagos: [], Sesiones: [], 'SML — Movement Analysis': [{ id: 'recM' }],
    } }] };
    if (table === 'Bonos y planes') return { records: [{ id: 'recP', fields: { Tipo: 'Progresión', 'Clases contratadas': 8, 'Clases realizadas': 2, 'Estado pago': 'Pagado' } }] };
    if (table === 'SML — Movement Analysis') return { records: [{ id: 'recM', fields: { 'Visible al cliente': true, 'Texto cliente — Observación': 'Control', 'Hipótesis entrenador': 'Solo administración', 'Análisis': 'Detalle interno' } }] };
    return { records: [] };
  };
  const r = await obtenerPorContactoId('recAdmin', { fetchTable: fake });
  assert.equal(r.estado, 'connected');
  assert.equal(r.client._admin.zona, 'Centro');
  assert.equal(r.client.adminMovementAnalysis[0]['Hipótesis entrenador'], 'Solo administración');
  assert.equal(r.client.movementAnalysis[0]['Hipótesis entrenador'], undefined);
});
