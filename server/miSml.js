// MI SML · núcleo privado. La identidad siempre sale del token Auth0 validado.
export const RUTA_ME = '/api/mi-sml/me';
export const RUTA_ADMIN_CLIENTES = '/api/mi-sml/admin/clients';
export const sinFuenteDeDatos = { async obtener() { return { estado: 'not-connected' }; } };

export function tokenDe(authorization) {
  const m = /^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/.exec(String(authorization ?? '').trim());
  return m ? m[1] : null;
}

const cuerpo = (status, body, extra = {}) => ({ status, body, headers: extra });
const NO_AUTH = { 'www-authenticate': 'Bearer' };

export async function atender({ method, pathname, authorization }, { verify, fuente = sinFuenteDeDatos, log = console.error, adminSub = '' }) {
  if (method !== 'GET') return cuerpo(405, { error: 'method-not-allowed' }, { allow: 'GET' });
  const token = tokenDe(authorization);
  if (!token) return cuerpo(401, { error: 'unauthenticated' }, NO_AUTH);

  let identidad;
  try {
    const v = await verify(token);
    if (!v || typeof v.sub !== 'string' || !v.sub) return cuerpo(401, { error: 'invalid-session' }, NO_AUTH);
    identidad = { sub: v.sub };
  } catch (e) {
    if (e?.kind === 'expired') return cuerpo(401, { error: 'session-expired' }, NO_AUTH);
    if (e?.kind === 'invalid') return cuerpo(401, { error: 'invalid-session' }, NO_AUTH);
    log('mi-sml: no se pudo validar la sesión', e?.kind || e?.code || e?.name || 'desconocido');
    return cuerpo(500, { error: 'internal' });
  }

  const isAdmin = Boolean(String(adminSub || '').trim()) && identidad.sub === String(adminSub).trim();
  try {
    if (pathname === RUTA_ME) {
      const r = await fuente.obtener(identidad);
      if (r?.estado === 'forbidden') return cuerpo(403, { error: 'forbidden' });
      if (r?.estado === 'connected' && r.client) return cuerpo(200, { session: 'valid', data: 'connected', client: r.client });
      return cuerpo(200, { session: 'valid', data: 'not-connected' });
    }

    if (pathname === RUTA_ADMIN_CLIENTES) {
      if (!isAdmin) return cuerpo(403, { error: 'forbidden' });
      const r = await fuente.listarClientes();
      return cuerpo(200, { session: 'valid', data: 'admin', clients: r.clients || [] });
    }

    const m = /^\/api\/mi-sml\/admin\/clients\/([^/]+)$/.exec(pathname || '');
    if (m) {
      if (!isAdmin) return cuerpo(403, { error: 'forbidden' });
      const r = await fuente.obtenerPorContactoId(m[1]);
      if (r?.estado === 'not-found') return cuerpo(404, { error: 'not-found' });
      if (r?.estado === 'connected' && r.client) return cuerpo(200, { session: 'valid', data: 'connected', client: r.client });
      return cuerpo(404, { error: 'not-found' });
    }

    if (pathname && pathname.startsWith('/api/mi-sml/')) return cuerpo(404, { error: 'not-found' });
    return cuerpo(404, { error: 'not-found' });
  } catch (e) {
    log('mi-sml: fallo en la fuente de datos', e?.code || e?.name || 'desconocido');
    return cuerpo(500, { error: 'internal' });
  }
}

export const cabeceras = (extra = {}) => ({
  'content-type': 'application/json',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  vary: 'Authorization',
  ...extra,
});
