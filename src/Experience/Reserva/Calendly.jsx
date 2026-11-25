import { useEffect } from 'react';

// Iframe nativo: evita depender de la inicialización dinámica del widget.js de terceros en Safari/iOS.
export default function Calendly({ url, fallbackHref }) {
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== 'https://calendly.com') return;
      if (e.data?.event === 'calendly.event_scheduled') {
        window.dispatchEvent(new CustomEvent('sml:calendly-booked'));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <div className="rs__calendly">
      <iframe className="rs__calendly-frame" src={url}
        title="Calendario para reservar la evaluación inicial"
        loading="lazy" allow="payment"
        referrerPolicy="strict-origin-when-cross-origin" />
      <p className="rs__calendly-fallback">
        ¿No aparece el calendario? <a className="link" href={fallbackHref} target="_blank" rel="noopener noreferrer">Abrir Calendly en otra pestaña</a>
      </p>
    </div>
  );
}
