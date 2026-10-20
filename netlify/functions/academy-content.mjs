import { configurado as authConfigurado, crearVerificador } from '../../server/miSmlAuth.js';
import { tokenDe } from '../../server/miSml.js';
import { MODULES } from '../../sml-v31/sml-v31-academy/server/academyContent.mjs';

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, private', 'x-content-type-options': 'nosniff', vary: 'Authorization', ...extra },
});
let verify = null;

export default async (req) => {
  if (req.method !== 'GET') return json(405, { error: 'method-not-allowed' }, { allow: 'GET' });
  if (!authConfigurado()) return json(503, { error: 'access-not-configured' });
  const token = tokenDe(req.headers.get('authorization'));
  if (!token) return json(401, { error: 'unauthenticated' }, { 'www-authenticate': 'Bearer' });
  try {
    verify ||= crearVerificador();
    const identity = await verify(token);
    if (!identity?.sub) return json(401, { error: 'invalid-session' }, { 'www-authenticate': 'Bearer' });
    const allowed = new Set(String(process.env.ACADEMY_ALLOWED_SUBS || '').split(',').map((v) => v.trim()).filter(Boolean));
    if (!allowed.has(identity.sub)) return json(403, { error: 'access-not-granted' });
    return json(200, { access: 'granted', modules: MODULES });
  } catch (err) {
    if (err?.kind === 'expired' || err?.kind === 'invalid') return json(401, { error: 'invalid-session' }, { 'www-authenticate': 'Bearer' });
    console.error('academy: no se pudo verificar el acceso', err?.kind || err?.name || 'unknown');
    return json(500, { error: 'internal' });
  }
};
