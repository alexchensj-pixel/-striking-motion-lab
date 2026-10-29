const CONTACT_ID = /^rec[A-Za-z0-9]{14}$/;
const LEVELS = new Set(['Inicial', 'Intermedio', 'Avanzado']);
const text = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const validDate = (value) => {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(value ?? ''))) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};
function weekDates(start) {
  const d = validDate(start) ? new Date(`${start}T00:00:00Z`) : new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  const end = new Date(d); end.setUTCDate(end.getUTCDate() + 6);
  return { semanaInicio: d.toISOString().slice(0, 10), semanaFin: end.toISOString().slice(0, 10) };
}
function validar(input) {
  const fields = [];
  if (!CONTACT_ID.test(text(input?.contactId, 32))) fields.push('contactId');
  if (text(input?.objetivo, 300).length < 3) fields.push('objetivo');
  if (!LEVELS.has(text(input?.nivel, 20))) fields.push('nivel');
  const sessions = Number(input?.sesionesPorSemana);
  if (!Number.isInteger(sessions) || sessions < 1 || sessions > 7) fields.push('sesionesPorSemana');
  const minutes = Number(input?.duracionMinutos ?? 30);
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 120) fields.push('duracionMinutos');
  if (input?.semanaInicio && !validDate(input.semanaInicio)) fields.push('semanaInicio');
  return fields;
}
export async function generarBorradorRutina(input, deps = {}) {
  const fields = validar(input);
  if (fields.length) return { estado: 'invalid-input', fields };
  const apiKey = String(deps.apiKey ?? process.env.OPENAI_API_KEY ?? '').trim();
  if (!apiKey) return { estado: 'not-configured' };
  if (typeof deps.persist !== 'function') throw new Error('Routine persistence unavailable');
  const fetchImpl = deps.fetchImpl || fetch;
  const objetivo = text(input.objetivo, 300), nivel = text(input.nivel, 20);
  const sesionesPorSemana = Number(input.sesionesPorSemana), duracionMinutos = Number(input.duracionMinutos ?? 30);
  const material = text(input.material, 300) || 'peso corporal y material básico si está disponible';
  const focoTecnico = text(input.focoTecnico, 500) || 'técnica, coordinación y biomecánica';
  const limitaciones = text(input.limitaciones, 500) || 'No indicadas; no asumir ausencia de lesiones o restricciones.';
  const { semanaInicio, semanaFin } = weekDates(input.semanaInicio);
  const system = [
    'Eres el asistente de planificación de Striking Motion Lab para adultos que entrenan boxeo, Muay Thai y kickboxing.',
    'Genera una propuesta prudente, progresiva, concreta y en español. No diagnostiques ni prescribas rehabilitación.',
    'Si se indican dolor, lesión, síntomas o restricción médica, no prescribas ejercicios que puedan empeorarlos; marca revisión obligatoria del entrenador y recomienda consultar al profesional sanitario apropiado cuando corresponda.',
    'No inventes datos ni afirmes que has evaluado el movimiento del alumno.',
    'Devuelve únicamente JSON válido con claves: titulo, contenido.',
    'Contenido: bloques por día, calentamiento, parte técnica, ejercicios, series/repeticiones o tiempo, descansos, claves técnicas y criterio para detener/reducir el trabajo.',
    'Respeta nivel, tiempo, material y limitaciones. No uses sparring de contacto como opción por defecto.'
  ].join(' ');
  const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: deps.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini', temperature: 0.4, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ marca:'Striking Motion Lab', semana:{inicio:semanaInicio,fin:semanaFin}, objetivo,nivel,sesionesPorSemana,duracionMinutos,material,focoTecnico,limitaciones }) }
    ] })
  });
  if (!response.ok) throw Object.assign(new Error('Routine generation provider failed'), { code: 'ROUTINE_PROVIDER_FAILED' });
  const data = await response.json();
  let generated;
  try { generated = JSON.parse(data?.choices?.[0]?.message?.content || '{}'); }
  catch { throw Object.assign(new Error('Invalid routine response'), { code: 'ROUTINE_INVALID_RESPONSE' }); }
  const titulo = text(generated.titulo, 120) || 'Rutina semanal SML';
  const contenido = text(generated.contenido, 18000);
  if (contenido.length < 80) throw Object.assign(new Error('Routine response incomplete'), { code: 'ROUTINE_INVALID_RESPONSE' });
  const saved = await deps.persist({ contactId:text(input.contactId,32), titulo, semanaInicio, semanaFin, objetivo, nivel, sesionesPorSemana, contenido });
  if (saved?.estado !== 'created') return saved || { estado: 'error' };
  return { estado: 'created', rutina: saved.rutina };
}
export const _rutinasInternals = { validar, weekDates };
