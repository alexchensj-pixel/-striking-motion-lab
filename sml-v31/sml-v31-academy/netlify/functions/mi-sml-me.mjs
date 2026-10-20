import { atender, cabeceras } from '../../server/miSml.js';
import { configurado as authConfigurado, crearVerificador } from '../../server/miSmlAuth.js';
import * as airtable from '../../server/miSmlAirtable.js';
import { generarBorradorRutina } from '../../server/miSmlRutinas.js';
let verify = null;
const responder = (r) => new Response(JSON.stringify(r.body), { status: r.status, headers: cabeceras(r.headers) });
export default async (req) => {
  try {
    if (!authConfigurado()) return responder({ status: 500, body: { error: 'internal' } });
    verify ||= crearVerificador();
    const pathname = new URL(req.url).pathname;
    let body;
    if (req.method === 'POST' && pathname === '/api/mi-sml/admin/routines/generate') {
      try { body = await req.json(); } catch { return responder({ status: 400, body: { error: 'invalid-input' } }); }
    }
    return responder(await atender(
      { method: req.method, pathname, authorization: req.headers.get('authorization'), body },
      { verify, adminSub: process.env.ADMIN_AUTH0_SUB, fuente: {
        obtener: airtable.obtener, listarClientes: airtable.listarClientes, obtenerPorContactoId: airtable.obtenerPorContactoId,
        generarRutina: (input) => generarBorradorRutina(input, { persist: airtable.crearBorradorRutina }),
      } },
    ));
  } catch (err) {
    console.error('mi-sml: error interno', err?.name || 'desconocido');
    return responder({ status: 500, body: { error: 'internal' } });
  }
};
