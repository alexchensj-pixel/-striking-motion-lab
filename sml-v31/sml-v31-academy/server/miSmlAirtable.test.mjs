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

test('Airtable: primer acceso por email verificado vincula Auth0 ID', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const calls = [];
  const fake = async (table, query) => {
    calls.push({ table, query });
    if (table === 'Contactos') {
      if (String(query).includes('LOWER')) return { records: [{ id:'recM', fields:{Nombre:'María','Email Mi SML':'fergamaria@gmail.com','Auth0 ID':''} }] };
      return { records: [] };
    }
    return { records: [] };
  };
  let updated = null;
  const update = async (table, id, fields) => { updated = {table,id,fields}; return {id,fields}; };
  const r = await obtener({sub:'google-oauth2|123', email:'  Fergamaria@GMAIL.com  ', email_verified:true}, {fetchTable:fake, updateRecord:update});
  const emailLookup = calls.find(({table, query}) => table === 'Contactos' && String(query).includes('LOWER'));
  assert.equal(new URLSearchParams(emailLookup.query).get('filterByFormula'), "LOWER({Email Mi SML})='fergamaria@gmail.com'");
  assert.equal(r.estado, 'connected');
  assert.deepEqual(updated, {table:'Contactos', id:'recM', fields:{'Auth0 ID':'google-oauth2|123'}});
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

test('Airtable: alumnos del grupo Sanse ven su bono individual y el del grupo por separado', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const grupo = { id: 'rec22sBRdL96ODEMM', fields: { Registro: 'Sanse · siguiente bono', Tipo: 'Bono', 'Clases contratadas': 20, 'Clases realizadas': 11, 'Sesiones restantes (auto)': 9, Precio: 212, 'Estado pago': 'Pagado', Frecuencia: '1x semana',
    Cliente: [{id:'recSanse'},{id:'recJose'},{id:'recJess'},{id:'recVane'},{id:'recJavi'}] } };
  const casos = [
    { nombre: 'José', contacto: 'recJose', bono: 'rec9vBaGCBtfraoZA', hechas: 3, quedan: 2 },
    { nombre: 'Javi', contacto: 'recJavi', bono: 'recH0L3pP9cOwqXSx', hechas: 3, quedan: 2 },
    { nombre: 'Jess', contacto: 'recJess', bono: 'recNLoP3jNzgRjk9K', hechas: 3, quedan: 2 },
    { nombre: 'Vane', contacto: 'recVane', bono: 'recUpDLiGJFgct4pE', hechas: 2, quedan: 3 },
  ];
  for (const c of casos) {
    const individual = { id: c.bono, fields: { Registro: `Sanse · asignación individual · ${c.nombre} · 5 sesiones`, Tipo: 'Bono individual (grupo Sanse)', 'Clases contratadas': 5, 'Clases realizadas': c.hechas, 'Sesiones restantes (auto)': c.quedan, Precio: 53, 'Estado pago': 'Pagado', Cliente: [{id: c.contacto}] } };
    const fake = async (table) => {
      if (table === 'Contactos') return { records: [{ id: c.contacto, fields: { Nombre: `${c.nombre} (grupo Sanse)`, 'Auth0 ID': 'google-oauth2|x', 'Bonos y planes': [{id: grupo.id}, {id: c.bono}] } }] };
      // El grupo llega ANTES (más antiguo en la tabla): antes del arreglo eso lo convertía en el "plan".
      if (table === 'Bonos y planes') return { records: [grupo, individual] };
      return { records: [] };
    };
    const r = await obtener({ sub: 'google-oauth2|x' }, { fetchTable: fake });
    const { bonos, clases, plan } = r.client;
    assert.equal(bonos.length, 2, c.nombre);
    assert.equal(bonos[0].compartido, false, `${c.nombre}: el individual va primero`);
    assert.deepEqual(bonos[0].clases, { contratadas: 5, realizadas: c.hechas, restantes: c.quedan }, c.nombre);
    assert.equal(bonos[1].compartido, true, `${c.nombre}: el del grupo está marcado como compartido`);
    assert.deepEqual(bonos[1].clases, { contratadas: 20, realizadas: 11, restantes: 9 }, c.nombre);
    assert.deepEqual(clases, { contratadas: 5, realizadas: c.hechas, restantes: c.quedan }, `${c.nombre}: el resumen principal es el individual`);
    assert.equal(plan.tipo, 'Bono individual (grupo Sanse)');
    assert.equal(bonos[0].estadoPago, 'Pagado');
    const json = JSON.stringify(r.client);
    for (const otro of ['recSanse', 'recJose', 'recJess', 'recVane', 'recJavi']) assert.equal(json.includes(otro), false, `no se exponen IDs de otros clientes (${otro})`);
  }
});

test('Airtable: un alumno con un solo bono propio no cambia (compatibilidad)', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recM', fields: { Nombre: 'María', 'Auth0 ID': 'g|1', 'Bonos y planes': [{id:'recP'}] } }] };
    if (table === 'Bonos y planes') return { records: [{ id: 'recP', fields: { Tipo: 'Progresión', 'Clases contratadas': 8, 'Clases realizadas': 3, 'Estado pago': 'Pagado', Cliente: [{id:'recM'}] } }] };
    return { records: [] };
  };
  const r = await obtener({ sub: 'g|1' }, { fetchTable: fake });
  assert.equal(r.client.bonos.length, 1);
  assert.equal(r.client.bonos[0].compartido, false);
  assert.deepEqual(r.client.clases, { contratadas: 8, realizadas: 3, restantes: 5 });
});

test('Airtable: bonos cancelados o finalizados no se listan', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recM', fields: { Nombre: 'Ana', 'Auth0 ID': 'g|2', 'Bonos y planes': [{id:'a'},{id:'b'}] } }] };
    if (table === 'Bonos y planes') return { records: [
      { id: 'a', fields: { Tipo: 'Antiguo', 'Clases contratadas': 4, 'Clases realizadas': 4, 'Estado pago': 'Finalizado' } },
      { id: 'b', fields: { Tipo: 'Vigente', 'Clases contratadas': 8, 'Clases realizadas': 1, 'Estado pago': 'Pagado' } }] };
    return { records: [] };
  };
  const r = await obtener({ sub: 'g|2' }, { fetchTable: fake });
  assert.deepEqual(r.client.bonos.map(b => b.tipo), ['Vigente']);
});
