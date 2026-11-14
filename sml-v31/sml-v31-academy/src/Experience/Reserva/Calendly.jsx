import { useCallback, useEffect, useMemo, useState } from "react";
import "./Calendly.css";

const MADRID = "Europe/Madrid";
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const monthLabel = (date) => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: MADRID }).format(date);
const dateKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: MADRID, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const localDate = (key) => new Date(`${key}T12:00:00+01:00`);
const timeLabel = (iso) => new Intl.DateTimeFormat("es-ES", { timeZone: MADRID, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const startOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(12, 0, 0, 0); return d; };

async function loadRange(start, end, signal) {
  const response = await fetch(`/api/calendly/availability?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`, { signal, headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo cargar la disponibilidad.");
  return payload.collection || [];
}

export default function Calendly() {
  const [month, setMonth] = useState(() => new Date(new Date().toLocaleString("en-US", { timeZone: MADRID })));
  const [slots, setSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
    const start = startOfWeek(first);
    const count = Math.ceil(((last - start) / 86400000 + 1) / 7) * 7;
    return Array.from({ length: count }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const rangeStart = monthDays[0];
  const rangeEnd = new Date(monthDays[monthDays.length - 1]); rangeEnd.setDate(rangeEnd.getDate() + 1);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError(""); setSlots([]); setSelectedDay(""); setSelectedSlot(""); setSuccess("");
    (async () => {
      try {
        const all = [];
        // Saltar semanas históricas y comenzar siempre en un instante futuro.
        for (let cursor = new Date(Math.max(rangeStart.getTime(), Date.now() + 60_000)); cursor < rangeEnd;) {
          const next = new Date(cursor); next.setDate(next.getDate() + 7);
          const end = next < rangeEnd ? next : rangeEnd;
          all.push(...await loadRange(cursor, end, controller.signal));
          cursor = end;
        }
        if (active) setSlots(all.filter(x => x.status === "available" && new Date(x.start_time) > new Date()).sort((a,b) => new Date(a.start_time)-new Date(b.start_time)));
      } catch (e) { if (active && e.name !== "AbortError") setError(e.message || "No se pudo cargar el calendario."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [rangeStart.getTime(), rangeEnd.getTime()]);

  const slotsByDay = useMemo(() => {
    const map = new Map();
    slots.forEach(slot => { const key = dateKey(new Date(slot.start_time)); map.set(key, [...(map.get(key) || []), slot]); });
    return map;
  }, [slots]);
  const daySlots = slotsByDay.get(selectedDay) || [];

  const changeMonth = (delta) => {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12));
    setSelectedDay(""); setSelectedSlot("");
  };
  const book = useCallback(async (event) => {
    event.preventDefault();
    if (!selectedSlot || booking) return;
    setBooking(true); setError("");
    try {
      const response = await fetch("/api/calendly/book", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, start_time: selectedSlot })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo completar la reserva.");
      setSuccess(payload.message || "Reserva confirmada. Revisa tu correo.");
      setSelectedSlot(""); setSlots(current => current.filter(slot => slot.start_time !== selectedSlot));
    } catch (e) { setError(e.message || "No se pudo completar la reserva."); }
    finally { setBooking(false); }
  }, [selectedSlot, booking, name, email]);

  return (
    <section className="sml-booking" aria-label="Calendario de reserva">
      <div className="sml-booking__intro">
        <span className="sml-booking__eyebrow">SESIÓN PRIVADA · 60 MIN</span>
        <p>Elige el día y la hora que mejor te encajen.</p>
      </div>
      {success && <div className="sml-booking__success" role="status">{success}</div>}
      <div className="sml-booking__layout">
        <div className="sml-booking__calendar">
          <div className="sml-booking__month">
            <button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)} disabled={loading && slots.length === 0}>‹</button>
            <h3>{monthLabel(month)}</h3>
            <button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="sml-booking__grid" role="grid" aria-label={monthLabel(month)}>
            {WEEKDAYS.map(day => <span className="sml-booking__weekday" key={day}>{day}</span>)}
            {monthDays.map(day => {
              const key = dateKey(day), inMonth = day.getMonth() === month.getMonth();
              const available = (slotsByDay.get(key) || []).length > 0;
              const selected = key === selectedDay;
              return <button key={key} type="button" role="gridcell" className={`sml-booking__day ${inMonth ? "" : "is-outside"} ${available ? "is-available" : ""} ${selected ? "is-selected" : ""}`} disabled={!available || loading} aria-pressed={selected} onClick={() => { setSelectedDay(key); setSelectedSlot(""); setSuccess(""); }}>
                {day.getDate()}{available && <i aria-hidden="true" />}
              </button>;
            })}
          </div>
          <div className="sml-booking__legend"><i /> Días con horas disponibles</div>
          {loading && <p className="sml-booking__muted">Consultando disponibilidad real…</p>}
          {!loading && !error && slots.length === 0 && <p className="sml-booking__muted">No hay horas libres este mes. Prueba el siguiente.</p>}
        </div>
        <div className="sml-booking__times">
          <h3>{selectedDay ? new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: MADRID }).format(localDate(selectedDay)) : "Selecciona un día"}</h3>
          {!selectedDay && <p className="sml-booking__muted">Las horas disponibles aparecerán aquí.</p>}
          {selectedDay && daySlots.length === 0 && <p className="sml-booking__muted">No quedan horas para este día.</p>}
          <div className="sml-booking__time-list">
            {daySlots.map(slot => <button key={slot.start_time} type="button" className={selectedSlot === slot.start_time ? "is-picked" : ""} onClick={() => { setSelectedSlot(slot.start_time); setSuccess(""); }}>{timeLabel(slot.start_time)}</button>)}
          </div>
          {selectedSlot && <form className="sml-booking__form" onSubmit={book}>
            <p className="sml-booking__chosen">{new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: MADRID }).format(new Date(selectedSlot))} · {timeLabel(selectedSlot)} · 60 min</p>
            <label>Nombre<input autoComplete="name" required maxLength="120" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" /></label>
            <label>Correo electrónico<input type="email" autoComplete="email" required maxLength="254" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
            <button className="sml-booking__submit" type="submit" disabled={booking}>{booking ? "Confirmando…" : "Confirmar reserva"}</button>
          </form>}
        </div>
      </div>
      {error && <p className="sml-booking__error" role="alert">{error}</p>}
      <p className="sml-booking__foot">Horario de Madrid · La reserva queda confirmada al finalizar el proceso.</p>
    </section>
  );
}
