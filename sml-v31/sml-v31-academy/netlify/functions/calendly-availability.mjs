const EVENT_TYPE = "https://api.calendly.com/event_types/f186c458-fd6d-46cc-bcc3-9992e7d7e3c5";
const API = "https://api.calendly.com";
const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;

export default async (request) => {
  if (request.method !== "GET") {
    return Response.json({ error: "Método no permitido." }, { status: 405 });
  }

  const token = Netlify.env.get("CALENDLY_API_TOKEN");
  if (!token) {
    return Response.json(
      { error: "La conexión de reservas no está configurada." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const requestedStart = new Date(url.searchParams.get("start") || "");
  const end = new Date(url.searchParams.get("end") || "");
  const now = Date.now();

  if (
    !Number.isFinite(requestedStart.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= requestedStart ||
    end.getTime() - requestedStart.getTime() > MAX_RANGE_MS
  ) {
    return Response.json(
      { error: "Rango de fechas no válido." },
      { status: 400 }
    );
  }

  // El calendario dibuja semanas completas, incluidas las que ya han pasado.
  // Esas semanas deben devolver una lista vacía, no un error para todo el mes.
  if (end.getTime() <= now) {
    return Response.json(
      { collection: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Si el intervalo empieza en el pasado pero termina en el futuro,
  // consulta Calendly desde un minuto después de ahora.
  const start = new Date(Math.max(requestedStart.getTime(), now + 60_000));
  if (end <= start) {
    return Response.json(
      { collection: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const params = new URLSearchParams({
    event_type: EVENT_TYPE,
    start_time: start.toISOString(),
    end_time: end.toISOString()
  });

  const response = await fetch(`${API}/event_type_available_times?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return Response.json(
      { error: payload?.message || "No se pudo consultar la disponibilidad." },
      { status: response.status >= 500 ? 502 : response.status }
    );
  }

  return Response.json(
    {
      collection: (payload.collection || []).map(({ start_time, status }) => ({
        start_time,
        status
      }))
    },
    { headers: { "Cache-Control": "no-store" } }
  );
};
