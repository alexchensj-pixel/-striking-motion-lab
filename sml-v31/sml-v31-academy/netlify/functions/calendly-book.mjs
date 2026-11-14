const EVENT_TYPE = "https://api.calendly.com/event_types/f186c458-fd6d-46cc-bcc3-9992e7d7e3c5";
const API = "https://api.calendly.com";

export default async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Método no permitido." }, { status: 405 });
  const token = Netlify.env.get("CALENDLY_API_TOKEN");
  if (!token) return Response.json({ error: "La conexión de reservas no está configurada." }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Solicitud no válida." }, { status: 400 }); }
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const start = new Date(body?.start_time || "");
  if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !Number.isFinite(start.getTime()) || start <= new Date()) {
    return Response.json({ error: "Revisa tu nombre, correo y hora seleccionada." }, { status: 400 });
  }

  const response = await fetch(`${API}/invitees`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: EVENT_TYPE,
      start_time: start.toISOString(),
      invitee: { name, email, timezone: "Europe/Madrid" }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.title || "No se ha podido confirmar la reserva. Prueba con otra hora.";
    return Response.json({ error: message }, { status: response.status >= 500 ? 502 : response.status });
  }
  return Response.json({
    ok: true,
    event: payload?.resource?.event || null,
    invitee: payload?.resource?.uri || null,
    message: "Tu sesión está reservada. Recibirás la confirmación en tu correo."
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
};
