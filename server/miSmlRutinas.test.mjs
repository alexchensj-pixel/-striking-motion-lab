import test from 'node:test';
import assert from 'node:assert/strict';
import { generarBorradorRutina, _rutinasInternals } from './miSmlRutinas.js';
const input = { contactId: 'recAAAAAAAAAAAAAA', objetivo: 'Mejorar coordinación y guardia', nivel: 'Inicial', sesionesPorSemana: 2, duracionMinutos: 30 };
test('routine generator validates input before external calls', async () => {
  let called = false;
  const r = await generarBorradorRutina({ ...input, contactId: 'x', sesionesPorSemana: 9 }, { apiKey: 'test', fetchImpl: async () => { called = true; }, persist: async () => ({ estado: 'created' }) });
  assert.equal(r.estado, 'invalid-input'); assert.ok(r.fields.includes('contactId')); assert.ok(r.fields.includes('sesionesPorSemana')); assert.equal(called, false);
});
test('routine generator reports missing provider configuration', async () => {
  const r = await generarBorradorRutina(input, { apiKey: '', persist: async () => ({ estado: 'created' }) });
  assert.deepEqual(r, { estado: 'not-configured' });
});
test('routine generator stores generated content as a draft', async () => {
  let request, saved;
  const fetchImpl = async (url, options) => { request = { url, options }; return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ titulo: 'Base técnica', contenido: 'Día 1\\nCalentamiento 5 min.\\nGuardia y desplazamientos 3 x 2 min, descanso 60 s.\\nDía 2\\nSombra técnica 4 x 2 min, descanso 60 s.\\nReduce la intensidad si pierdes el control técnico.' }) } }] }) }; };
  const persist = async (routine) => { saved = routine; return { estado: 'created', rutina: { id: 'recBBBBBBBBBBBBBB', ...routine, estado: 'Pendiente revisión', visible: false } }; };
  const r = await generarBorradorRutina(input, { apiKey: 'test-key', fetchImpl, persist, model: 'test-model' });
  assert.equal(r.estado, 'created'); assert.equal(saved.contactId, input.contactId); assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(JSON.parse(request.options.body).model, 'test-model'); assert.equal(r.rutina.estado, 'Pendiente revisión'); assert.equal(r.rutina.visible, false);
});
test('week dates normalize to Monday–Sunday', () => {
  assert.deepEqual(_rutinasInternals.weekDates('2026-10-21'), { semanaInicio: '2026-10-19', semanaFin: '2026-10-25' });
});
