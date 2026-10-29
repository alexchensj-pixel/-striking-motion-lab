// MI SML · VALIDACIÓN DE SESIÓN en servidor (Auth0). Verifica el token de acceso con las CLAVES PÚBLICAS del tenant (JWKS): no hay secretos.
// Usa la librería `jose` (estándar, mantenida): no se escribe ninguna criptografía a mano. Solo RS256 (el algoritmo de Auth0).
//
// Variables de entorno del SERVIDOR (Netlify → Environment variables; NO llevan prefijo VITE_, no llegan al navegador):
//   AUTH0_DOMAIN     el MISMO dominio que VITE_AUTH0_DOMAIN (si se usa dominio propio de Auth0, ese; el emisor del token debe coincidir)
//   AUTH0_AUDIENCE   el MISMO identificador de API que VITE_AUTH0_AUDIENCE (la «API» registrada en Auth0 para MI SML)
//   AUTH0_CLAIMS_NAMESPACE opcional; por defecto usa el namespace configurado en la Action de MI SML.
// No son secretos, pero se leen solo en servidor para que la API no dependa de lo que el navegador diga.

const limpiarDominio = (d) => String(d ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');

const EXPIRADO = new Set(['ERR_JWT_EXPIRED']);
const INVALIDO = new Set([
  'ERR_JWT_INVALID', 'ERR_JWT_CLAIM_VALIDATION_FAILED', 'ERR_JWS_INVALID', 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JOSE_ALG_NOT_ALLOWED', 'ERR_JWKS_NO_MATCHING_KEY', 'ERR_JWK_INVALID',
]);
export const clasificar = (e) => ({ kind: EXPIRADO.has(e?.code) ? 'expired' : INVALIDO.has(e?.code) ? 'invalid' : 'unavailable', code: e?.code });

export function configurado(env = process.env) {
  return Boolean(limpiarDominio(env.AUTH0_DOMAIN) && String(env.AUTH0_AUDIENCE ?? '').trim());
}

export function crearVerificador(env = process.env) {
  const dominio = limpiarDominio(env.AUTH0_DOMAIN);
  const audience = String(env.AUTH0_AUDIENCE ?? '').trim();
  if (!dominio || !audience) throw new Error('AUTH0_DOMAIN / AUTH0_AUDIENCE no configuradas');
  const issuer = `https://${dominio}/`;
  // Coincide con la Action actual: https://strikingmotionlab.com/email_verified.
  // Se puede sobreescribir mediante AUTH0_CLAIMS_NAMESPACE en Netlify.
  const ns = String(env.AUTH0_CLAIMS_NAMESPACE || 'https://strikingmotionlab.com').trim().replace(/\/+$/, '');
  let jwks = null;
  return async (token) => {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    jwks ||= createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));
    try {
      const { payload } = await jwtVerify(token, jwks, { issuer, audience, algorithms: ['RS256'] });
      const email = payload.email || payload[`${ns}/email`];
      const email_verified = payload.email_verified === true || payload[`${ns}/email_verified`] === true;
      return { sub: payload.sub, email: typeof email === 'string' ? email.trim() : '', email_verified };
    } catch (e) {
      throw clasificar(e);
    }
  };
}
