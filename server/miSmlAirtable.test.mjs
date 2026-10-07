import test from 'node:test';
import assert from 'node:assert/strict';
import { obtener } from './miSmlAirtable.js';

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
