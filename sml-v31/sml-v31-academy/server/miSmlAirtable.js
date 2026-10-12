// MI SML · fuente privada Airtable. El navegador nunca recibe AIRTABLE_TOKEN.
const BASE_ID = () => String(process.env.AIRTABLE_BASE_ID || '').trim();
const TOKEN = () => String(process.env.AIRTABLE_TOKEN || '').trim();
const CONTACTOS = 'Contactos';
const PLANES = 'Bonos y planes';
const PAGOS = 'Pagos';
const SESIONES = 'Sesiones';
const ANALISIS = 'SML — Movement Analysis';
const AUTH0_FIELD = () =>
  String(process.env.AIRTABLE_AUTH0_FIELD || 'Auth0 ID').trim();
const EMAIL_FIELD = () =>
  String(process.env.AIRTABLE_EMAIL_FIELD || 'Email Mi SML').trim();
const api = (table, params = '') =>
  `https://api.airtable.com/v0/${encodeURIComponent(BASE_ID())}/${encodeURIComponent(table)}${params ? `?${params}` : ''}`;
async function airtableFetch(table, params = '') {
  const token = TOKEN();
  const base = BASE_ID();
  if (!token || !base) {
    throw Object.assign(new Error('Airtable no configurado'), {
      code: 'AIRTABLE_NOT_CONFIGURED',
    });
  }
  const res = await fetch(api(table, params), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error('MI SML Airtable diagnostic:', {
      status: res.status,
      table,
      response: body.slice(0, 1500),
    });
    throw Object.assign(new Error('Airtable request failed'), {
      code: `AIRTABLE_HTTP_${res.status}`,
    });
  }
  return JSON.parse(body);
}
async function airtableUpdate(table, recordId, fields) {
  const token = TOKEN();
  const base = BASE_ID();
  if (!token || !base) {
    throw Object.assign(new Error('Airtable no configurado'), {
      code: 'AIRTABLE_NOT_CONFIGURED',
    });
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    const response = await res.text();
    console.error('MI SML Airtable UPDATE diagnostic:', {
      status: res.status,
      table,
      response: response.slice(0, 1500),
    });
    throw Object.assign(new Error('Airtable update failed'), {
      code: `AIRTABLE_HTTP_${res.status}`,
    });
  }
  return res.json();
}
const esc = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const linkedIds = (x) =>
  Array.isArray(x)
    ? x.map(v => typeof v === 'string' ? v : v?.id).filter(Boolean)
    : [];
const num = (x) =>
  typeof x === 'number'
    ? x
    : Number(String(x ?? '').replace(',', '.')) || 0;
async function listByIds(table, ids, fields, fetcher = airtableFetch) {
  if (!ids.length) return [];
  const unique = [...new Set(ids)];
  const rows = [];
  for (let i = 0; i < unique.length; i += 20) {
    const batch = unique.slice(i, i + 20);
    const formula = `OR(${batch.map(id => `RECORD_ID()='${esc(id)}'`).join(',')})`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      pageSize: '100',
    });
    for (const field of fields) {
      params.append('fields[]', field);
    }
    const data = await fetcher(table, params.toString());
    rows.push(...(data.records || []));
  }
  return rows;
}
export function configurado(env = process.env) {
  return Boolean(
    String(env.AIRTABLE_BASE_ID || '').trim() &&
    String(env.AIRTABLE_TOKEN || '').trim()
  );
}
async function buildClient(
  contacto,
  get = airtableFetch,
  { includeAdmin = false } = {}
) {
  const cf = contacto.fields || {};
  const planIds = linkedIds(cf['Bonos y planes']);
  const pagoIds = linkedIds(cf['Pagos']);
  const sesionIds = linkedIds(cf['Sesiones']);
  const analisisIds = linkedIds(cf['SML — Movement Analysis']);
  const [
    planes,
    pagos,
    sesiones,
    analisis,
  ] = await Promise.all([
    listByIds(PLANES, planIds, [
      'Registro',
      'Tipo',
      'Clases contratadas',
      'Clases realizadas',
      'Precio',
      'Estado pago',
      'Frecuencia',
      'Notas',
      'Sesiones registradas (auto)',
      'Sesiones restantes (auto)',
      'Progreso (auto)',
    ], get),
    listByIds(PAGOS, pagoIds, [
      'Pago',
      'Fecha',
      'Importe',
      'Estado',
      'Método',
      'Concepto',
      'Notas',
    ], get),
    listByIds(SESIONES, sesionIds, [
      'Sesión',
      'Fecha',
      'Disciplina',
      'Formato',
      'Precio cobrado',
      'Notas',
      'Plan asociado',
    ], get),
    listByIds(ANALISIS, analisisIds, [
      'Análisis',
      'Fecha evaluación',
      'Disciplina',
      'Objetivo del cliente',
      'Observación',
      'Evidencia',
      'Interpretación',
      'Hipótesis entrenador',
      'Prioridad',
      'Intervención',
      'Qué buscamos cambiar',
      'Respuesta',
      'Transferencia',
      'Antes',
      'Ahora',
      'Cambio observado',
      'Siguiente prueba',
      'Visible al cliente',
      'Texto cliente — Observación',
      'Texto cliente — Por qué importa',
      'Texto cliente — Qué trabajamos',
      'Texto cliente — Evolución',
      'Texto cliente — Siguiente objetivo',
      'Estado',
      'Fecha revisión',
    ], get),
  ]);
  const activePlans = planes.filter(record => {
    const estado = String(
      record.fields?.['Estado pago'] ?? ''
    ).toLowerCase();
    return estado !== 'cancelado' && estado !== 'finalizado';
  });
  const plan = activePlans[0]?.fields || planes[0]?.fields || {};
  const realizadas = num(
    plan['Clases realizadas'] ??
    plan['Sesiones registradas (auto)']
  );
  const contratadas = num(plan['Clases contratadas']);
  const restantes =
    plan['Sesiones restantes (auto)'] != null
      ? num(plan['Sesiones restantes (auto)'])
      : Math.max(0, contratadas - realizadas);
  const pendingPayments = pagos.filter(record => {
    const estado = String(
      record.fields?.['Estado'] ?? ''
    ).toLowerCase();
    return estado.includes('pend') ||
      estado.includes('adeud') ||
      estado.includes('no pag');
  });
  const importePendiente = pendingPayments.reduce(
    (sum, record) => sum + num(record.fields?.['Importe']),
    0
  );
  const visibleAnalysis = analisis.filter(record => {
    const visible = record.fields?.['Visible al cliente'];
    return visible === true ||
      String(visible ?? '').toLowerCase() === 'sí' ||
      String(visible ?? '').toLowerCase() === 'si';
  });
  const publicAnalysisFields = [
    'Fecha evaluación',
    'Disciplina',
    'Fecha revisión',
    'Texto cliente — Observación',
    'Texto cliente — Por qué importa',
    'Texto cliente — Qué trabajamos',
    'Texto cliente — Evolución',
    'Texto cliente — Siguiente objetivo',
  ];
  const movementAnalysis = visibleAnalysis.map(record => {
    const fields = record.fields || {};
    const safe = Object.fromEntries(
      publicAnalysisFields
        .filter(key => fields[key] !== undefined && fields[key] !== null)
        .map(key => [key, fields[key]])
    );
    return { id: record.id, ...safe };
  });
  const client = {
    nombre: String(cf['Nombre'] ?? '').trim(),
    plan: {
      tipo: plan['Tipo'] ?? plan['Registro'] ?? null,
      frecuencia: plan['Frecuencia'] ?? null,
      precio: plan['Precio'] ?? null,
    },
    pago: {
      estado: plan['Estado pago'] ?? null,
      importePendiente,
    },
    clases: {
      contratadas,
      realizadas,
      restantes,
    },
    movementAnalysis,
  };
  if (includeAdmin) {
    client._admin = {
      telefono: cf['Teléfono'] ?? null,
      estado: cf['Estado'] ?? null,
      zona: cf['Zona'] ?? null,
      formato: cf['Formato'] ?? null,
      frecuencia: cf['Frecuencia'] ?? null,
    };
    client.adminMovementAnalysis = visibleAnalysis.map(record => ({
      id: record.id,
      ...(record.fields || {}),
    }));
  }
  return client;
}
export async function obtener(identidad, deps = {}) {
  const sub = String(identidad?.sub || '').trim();
  if (!sub) {
    return { estado: 'forbidden' };
  }
  const get = deps.fetchTable || airtableFetch;
  const field = AUTH0_FIELD();
  if (!configurado()) {
    throw Object.assign(new Error('Airtable no configurado'), {
      code: 'AIRTABLE_NOT_CONFIGURED',
    });
  }
  const formula = `{${field}}='${esc(sub)}'`;
  const contactos = await get(
    CONTACTOS,
    new URLSearchParams({
      filterByFormula: formula,
      maxRecords: '2',
    }).toString()
  );
  let records = contactos.records || [];
  if (records.length > 1) {
    throw Object.assign(new Error('Identidad Auth0 duplicada'), {
      code: 'AUTH0_ID_NOT_UNIQUE',
    });
  }
  if (records.length === 0 && identidad.email && identidad.email_verified) {
    const emailField = EMAIL_FIELD();
    const emailFormula =
      `LOWER({${emailField}})='${esc(identidad.email)}'`;
    const byEmail = await get(
      CONTACTOS,
      new URLSearchParams({
        filterByFormula: emailFormula,
        maxRecords: '2',
      }).toString()
    );
    records = byEmail.records || [];
    if (records.length > 1) {
      throw Object.assign(new Error('Email Mi SML duplicado'), {
        code: 'EMAIL_NOT_UNIQUE',
      });
    }
    if (records.length === 1) {
      const record = records[0];
      const existingSub = String(
        record.fields?.[field] ?? ''
      ).trim();
      if (existingSub && existingSub !== sub) {
        throw Object.assign(
          new Error('Contacto ya vinculado a otra cuenta'),
          { code: 'AUTH0_ID_CONFLICT' }
        );
      }
      await (deps.updateRecord || airtableUpdate)(
        CONTACTOS,
        record.id,
        { [field]: sub }
      );
      records = [{
        ...record,
        fields: { ...record.fields, [field]: sub },
      }];
    }
  }
  if (records.length === 0) {
    return { estado: 'forbidden' };
  }
  return {
    estado: 'connected',
    client: await buildClient(records[0], get),
  };
}
export async function listarClientes(deps = {}) {
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) {
    throw Object.assign(new Error('Airtable no configurado'), {
      code: 'AIRTABLE_NOT_CONFIGURED',
    });
  }
  const params = new URLSearchParams({ pageSize: '100' });
  for (const field of [
    'Nombre',
    'Estado',
    'Zona',
    'Formato',
    'Frecuencia',
    'Bonos y planes',
    'Auth0 ID',
    'Email Mi SML',
  ]) {
    params.append('fields[]', field);
  }
  const data = await get(CONTACTOS, params.toString());
  const clients = (data.records || []).map(record => ({
    id: record.id,
    nombre: String(record.fields?.Nombre ?? '').trim(),
    estado: record.fields?.Estado ?? null,
    zona: record.fields?.Zona ?? null,
    formato: record.fields?.Formato ?? null,
    frecuencia: record.fields?.Frecuencia ?? null,
    tieneCuenta: Boolean(
      String(record.fields?.['Auth0 ID'] ?? '').trim()
    ),
  }));
  return { clients };
}
export async function obtenerPorContactoId(contactoId, deps = {}) {
  const id = String(contactoId || '').trim();
  if (!id) {
    return { estado: 'not-found' };
  }
  const get = deps.fetchTable || airtableFetch;
  if (!configurado()) {
    throw Object.assign(new Error('Airtable no configurado'), {
      code: 'AIRTABLE_NOT_CONFIGURED',
    });
  }
  const rows = await listByIds(CONTACTOS, [id], [
    'Nombre',
    'Teléfono',
    'Estado',
    'Zona',
    'Formato',
    'Frecuencia',
    'Auth0 ID',
    'Email Mi SML',
    'Bonos y planes',
    'Pagos',
    'Sesiones',
    'SML — Movement Analysis',
  ], get);
  if (!rows.length) {
    return { estado: 'not-found' };
  }
  return {
    estado: 'connected',
    client: await buildClient(
      rows[0],
      get,
      { includeAdmin: true }
    ),
  };
}
export const _internals = {
  airtableFetch,
  listByIds,
  buildClient,
};
