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

test('Airtable: el bono compartido no expone precio, pago, id ni nombres de otros alumnos', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const grupo = { id: 'rec22sBRdL96ODEMM', fields: { Registro: 'Sanse · José, Javi, Jess y Vane · 20 sesiones', Tipo: 'Bono de grupo', 'Clases contratadas': 20, 'Clases realizadas': 11, 'Sesiones restantes (auto)': 9, Precio: 212, 'Estado pago': 'Pagado', Frecuencia: '1x semana',
    Cliente: [{id:'recSanse'},{id:'recJose'},{id:'recJess'},{id:'recVane'},{id:'recJavi'}] } };
  const individual = { id: 'rec9vBaGCBtfraoZA', fields: { Registro: 'Sanse · asignación individual · José · 5 sesiones', Tipo: 'Bono individual (grupo Sanse)', 'Clases contratadas': 5, 'Clases realizadas': 3, 'Sesiones restantes (auto)': 2, Precio: 53, 'Estado pago': 'Pendiente', Cliente: [{id:'recJose'}] } };
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recJose', fields: { Nombre: 'José', 'Auth0 ID': 'g|jose', 'Bonos y planes': [{id: grupo.id}, {id: individual.id}] } }] };
    if (table === 'Bonos y planes') return { records: [grupo, individual] };
    return { records: [] };
  };
  const r = await obtener({ sub: 'g|jose' }, { fetchTable: fake });
  const [propio, delGrupo] = r.client.bonos;
  assert.deepEqual(Object.keys(delGrupo).sort(), ['clases', 'compartido', 'frecuencia', 'tipo'], 'el bono compartido solo lleva lo necesario');
  assert.deepEqual(Object.keys(propio).sort(), ['clases', 'compartido', 'estadoPago', 'frecuencia', 'precio', 'tipo'], 'el individual no lleva id ni nombre de registro');
  assert.equal(delGrupo.tipo, 'Bono de grupo');
  assert.equal(propio.precio, 53);
  assert.equal(propio.estadoPago, 'Pendiente');
  const json = JSON.stringify(r.client);
  assert.equal(json.includes('212'), false, 'el precio del grupo no sale por la API');
  assert.equal(json.includes('rec22sBRdL96ODEMM'), false, 'el id del bono de grupo no sale por la API');
  assert.equal(json.includes('rec9vBaGCBtfraoZA'), false, 'tampoco el id del bono individual');
  for (const nombre of ['Javi', 'Jess', 'Vane']) assert.equal(json.includes(nombre), false, `no se expone el nombre de otro alumno (${nombre})`);
  assert.equal(r.client.plan.precio, 53, 'los campos antiguos siguen apuntando al individual');
  assert.equal(r.client.pago.estado, 'Pendiente');
  assert.equal(r.client.plan.compartido, false);
});

test('Airtable: alumno con solo un bono compartido: marcado como compartido y sin datos económicos', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const grupo = { id: 'recGrupoSolo', fields: { Registro: 'Sanse · Javi y Vane', 'Clases contratadas': 20, 'Clases realizadas': 11, 'Sesiones restantes (auto)': 9, Precio: 212, 'Estado pago': 'Pagado', Frecuencia: '1x semana',
    Cliente: [{id:'recJavi'},{id:'recVane'}] } };
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recJavi', fields: { Nombre: 'Javi', 'Auth0 ID': 'g|javi', 'Bonos y planes': [{id: grupo.id}] } }] };
    if (table === 'Bonos y planes') return { records: [grupo] };
    return { records: [] };
  };
  const r = await obtener({ sub: 'g|javi' }, { fetchTable: fake });
  const { bonos, plan, pago, clases } = r.client;
  assert.equal(bonos.length, 1);
  assert.equal(bonos[0].compartido, true);
  assert.equal('precio' in bonos[0], false);
  assert.equal('estadoPago' in bonos[0], false);
  assert.equal(bonos[0].tipo, null, 'sin Tipo no se usa Registro, que puede nombrar a otros alumnos');
  assert.equal(plan.compartido, true, 'los campos antiguos también lo marcan como compartido');
  assert.equal(plan.precio, null, 'el precio del grupo no se atribuye al alumno');
  assert.equal(plan.tipo, null);
  assert.equal(pago.estado, null, 'el estado de pago del grupo no se atribuye al alumno');
  assert.deepEqual(clases, { contratadas: 20, realizadas: 11, restantes: 9 });
  const json = JSON.stringify(r.client);
  assert.equal(json.includes('212'), false);
  assert.equal(json.includes('Vane'), false);
});

test('Airtable: orden estable (individuales primero) y bono de dos clientes (Parejas) cuenta como compartido', async () => {
  process.env.AIRTABLE_BASE_ID = 'appTest'; process.env.AIRTABLE_TOKEN = 'pat_test';
  const bono = (id, tipo, clientes) => ({ id, fields: { Tipo: tipo, 'Clases contratadas': 4, 'Clases realizadas': 1, Precio: 10, 'Estado pago': 'Pagado', Cliente: clientes.map(c => ({id: c})) } });
  const fake = async (table) => {
    if (table === 'Contactos') return { records: [{ id: 'recA', fields: { Nombre: 'Ana', 'Auth0 ID': 'g|ana', 'Bonos y planes': ['g1','i1','g2','i2'].map(id => ({id})) } }] };
    if (table === 'Bonos y planes') return { records: [
      bono('g1', 'Pareja 1', ['recA', 'recB']), bono('i1', 'Propio 1', ['recA']),
      bono('g2', 'Pareja 2', ['recA', 'recC']), bono('i2', 'Propio 2', ['recA']) ] };
    return { records: [] };
  };
  const r = await obtener({ sub: 'g|ana' }, { fetchTable: fake });
  assert.deepEqual(r.client.bonos.map(b => b.tipo), ['Propio 1', 'Propio 2', 'Pareja 1', 'Pareja 2']);
  assert.deepEqual(r.client.bonos.map(b => b.compartido), [false, false, true, true]);
  assert.equal(r.client.plan.tipo, 'Propio 1');
  for (const b of r.client.bonos.filter(x => x.compartido)) { assert.equal('precio' in b, false); assert.equal('estadoPago' in b, false); }
});
