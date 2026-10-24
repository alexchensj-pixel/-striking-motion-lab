// MI SML · CAPA DE DATOS Y SESIÓN DEL CLIENTE
//
// CLIENTE → AUTH0 → API PRIVADA MI SML → AIRTABLE
//
// Este archivo gestiona la autenticación y las peticiones a la API privada.
// No accede directamente a Airtable ni guarda tokens en localStorage o sessionStorage.
//
// VARIABLES DE ENTORNO:
// VITE_AUTH0_DOMAIN
// VITE_AUTH0_CLIENT_ID
// VITE_AUTH0_AUDIENCE
//
// La API debe usar el mismo dominio y audience en el servidor.
const env = import.meta.env || {};
const DOMAIN = (env.VITE_AUTH0_DOMAIN || '').trim();
const CLIENT_ID = (env.VITE_AUTH0_CLIENT_ID || '').trim();
const AUDIENCE = (env.VITE_AUTH0_AUDIENCE || '').trim();
export const API_BASE = '/api/mi-sml';
const RUTA = '/mi-sml';
const LOGGED_OUT_KEY = 'sml-mi-sml-logged-out';
const hasExplicitLogout = () => {
  try {
    return window.sessionStorage.getItem(LOGGED_OUT_KEY) === '1';
  } catch {
    return false;
  }
};
const clearExplicitLogout = () => {
  try {
    window.sessionStorage.removeItem(LOGGED_OUT_KEY);
  } catch {
    // El almacenamiento puede no estar disponible.
  }
};
export const isAuthConfigured = () => Boolean(DOMAIN && CLIENT_ID);
export class ClientApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'ClientApiError';
    this.code = code;
  }
}
// ------------------------------------------------------------
// AUTH0
// ------------------------------------------------------------
let ready = null;
const volvemosDeAuth0 = () => {
  const q = new URLSearchParams(window.location.search);
  return q.has('state') && (q.has('code') || q.has('error'));
};
const limpiarUrl = () => {
  try {
    window.history.replaceState({}, '', RUTA);
  } catch {
    // La limpieza de URL no debe ocultar el resultado de Auth0.
  }
};
function iniciar() {
  if (!isAuthConfigured()) {
    return Promise.reject(
      new ClientApiError('auth-not-configured')
    );
  }
  if (!ready) {
    ready = (async () => {
      // Usamos Auth0Client directamente para evitar la comprobación
      // silenciosa automática que realiza createAuth0Client().
      // Primero procesamos el callback, si lo hay.
      const { Auth0Client } = await import('@auth0/auth0-spa-js');
      const client = new Auth0Client({
        domain: DOMAIN,
        clientId: CLIENT_ID,
        cacheLocation: 'memory',
        authorizationParams: {
          redirect_uri: `${window.location.origin}${RUTA}`,
          ...(AUDIENCE ? { audience: AUDIENCE } : {}),
        },
      });
      if (volvemosDeAuth0()) {
        let destino = RUTA;
        try {
          const callback = await client.handleRedirectCallback();
          const returnTo = callback?.appState?.returnTo;
          if (
            typeof returnTo === 'string' &&
            returnTo.startsWith('/') &&
            !returnTo.startsWith('//')
          ) {
            destino = returnTo;
          }
        } finally {
          limpiarUrl();
        }
        // No recargamos la página si Auth0 ya nos ha devuelto
        // a la ruta correcta. Así evitamos perder la caché en memoria.
        if (destino !== window.location.pathname) {
          window.location.replace(destino);
        }
      }
      return client;
    })().catch((error) => {
      ready = null;
      if (error instanceof ClientApiError) {
        throw error;
      }
      throw new ClientApiError('auth-failed');
    });
  }
  return ready;
}
// ------------------------------------------------------------
// ESTADO DE SESIÓN
// ------------------------------------------------------------
export async function getSession() {
  if (!isAuthConfigured() || hasExplicitLogout()) {
    return { authenticated: false };
  }
  const client = await iniciar();
  return {
    authenticated: await client.isAuthenticated(),
  };
}
// ------------------------------------------------------------
// INICIAR SESIÓN
// ------------------------------------------------------------
export async function signIn(returnTo = RUTA) {
  clearExplicitLogout();
  const client = await iniciar();
  const destino =
    typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//')
      ? returnTo
      : RUTA;
  try {
    await client.loginWithRedirect({
      appState: {
        returnTo: destino,
      },
    });
  } catch {
    throw new ClientApiError('auth-failed');
  }
}
// ------------------------------------------------------------
// CERRAR SESIÓN
// ------------------------------------------------------------
export async function closeSession() {
  if (!isAuthConfigured()) {
    throw new ClientApiError('auth-not-configured');
  }
  const client = await iniciar();
  try {
    window.sessionStorage.setItem(LOGGED_OUT_KEY, '1');
  } catch {
    // Auth0 seguirá intentando cerrar la sesión.
  }
  try {
    await client.logout({
      logoutParams: {
        returnTo: `${window.location.origin}${RUTA}`,
      },
    });
  } catch {
    clearExplicitLogout();
    throw new ClientApiError('auth-failed');
  }
}
export const signOut = closeSession;
// ------------------------------------------------------------
// VIGILANCIA DE SESIÓN
// ------------------------------------------------------------
export function watchSession(onEnded) {
  if (!isAuthConfigured()) {
    return () => {};
  }
  let parado = false;
  const comprobar = async () => {
    if (parado || document.visibilityState !== 'visible') {
      return;
    }
    try {
      const client = await iniciar();
      await client.getTokenSilently();
    } catch (error) {
      if (
        !parado &&
        [
          'login_required',
          'consent_required',
          'missing_refresh_token',
        ].includes(error?.error)
      ) {
        onEnded();
      }
    }
  };
  document.addEventListener('visibilitychange', comprobar);
  const id = window.setInterval(
    comprobar,
    5 * 60 * 1000
  );
  return () => {
    parado = true;
    document.removeEventListener(
      'visibilitychange',
      comprobar
    );
    window.clearInterval(id);
  };
}
// ------------------------------------------------------------
// TOKEN DE ACCESO A LA API
// ------------------------------------------------------------
export async function getAccessToken() {
  if (!AUDIENCE) {
    throw new ClientApiError('api-not-configured');
  }
  const client = await iniciar();
  try {
    return await client.getTokenSilently();
  } catch {
    throw new ClientApiError('unauthenticated');
  }
}
// ------------------------------------------------------------
// DATOS DEL CLIENTE AUTENTICADO
// ------------------------------------------------------------
export async function getCurrentClient() {
  const session = await getSession();
  if (!session.authenticated) {
    throw new ClientApiError('unauthenticated');
  }
  const token = await getAccessToken();
  let res;
  try {
    res = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      credentials: 'omit',
    });
  } catch {
    throw new ClientApiError('request-failed');
  }
  if (res.status === 401) {
    throw new ClientApiError('unauthenticated');
  }
  if (res.status === 403) {
    throw new ClientApiError('forbidden');
  }
  if (!res.ok) {
    throw new ClientApiError('request-failed');
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    // La API debe devolver JSON.
  }
  if (body?.session !== 'valid') {
    throw new ClientApiError('request-failed');
  }
  if (body.data === 'connected' && body.client) {
    return body.client;
  }
  throw new ClientApiError('not-connected');
}
// ------------------------------------------------------------
// FUNCIONES DE ADMINISTRACIÓN
// ------------------------------------------------------------
export async function getAdminClients() {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/admin/clients`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    credentials: 'omit',
  });
  if (res.status === 403) {
    throw new ClientApiError('forbidden');
  }
  if (!res.ok) {
    throw new ClientApiError('request-failed');
  }
  const body = await res.json();
  if (body?.data !== 'admin') {
    throw new ClientApiError('request-failed');
  }
  return body.clients || [];
}
export async function getAdminClient(contactoId) {
  if (!contactoId) {
    throw new ClientApiError('request-failed');
  }
  const token = await getAccessToken();
  const res = await fetch(
    `${API_BASE}/admin/clients/${encodeURIComponent(contactoId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      credentials: 'omit',
    }
  );
  if (res.status === 403) {
    throw new ClientApiError('forbidden');
  }
  if (res.status === 404) {
    throw new ClientApiError('not-found');
  }
  if (!res.ok) {
    throw new ClientApiError('request-failed');
  }
  const body = await res.json();
  if (body?.data !== 'connected' || !body.client) {
    throw new ClientApiError('request-failed');
  }
  return body.client;
}

export async function generateAdminRoutine(payload) {
  const token = await getAccessToken();
  let res;
  try {
    res = await fetch(`${API_BASE}/admin/routines/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store', credentials: 'omit',
    });
  } catch { throw new ClientApiError('request-failed'); }
  if (res.status === 401) throw new ClientApiError('unauthenticated');
  if (res.status === 403) throw new ClientApiError('forbidden');
  if (res.status === 400) throw new ClientApiError('invalid-input');
  if (res.status === 404) throw new ClientApiError('not-found');
  if (res.status === 503) throw new ClientApiError('routine-generator-unavailable');
  if (!res.ok) throw new ClientApiError('request-failed');
  const body = await res.json().catch(() => null);
  if (body?.data !== 'routine-draft-created' || !body.routine) throw new ClientApiError('request-failed');
  return body.routine;
}
