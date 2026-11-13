import { useEffect, useRef, useState } from 'react';

const SRC = 'https://assets.calendly.com/assets/external/widget.js';

// Reutiliza la carga en curso y también reconoce un script que ya terminó de cargar.
function loadCalendly() {
  if (window.Calendly?.initInlineWidget) return Promise.resolve(window.Calendly);

  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${SRC}"]`);
    const finish = () => {
      if (window.Calendly?.initInlineWidget) resolve(window.Calendly);
      else reject(new Error('Calendly no ha inicializado su widget.'));
    };
    const fail = () => reject(new Error('No se pudo cargar Calendly.'));

    if (!script) {
      script = document.createElement('script');
      script.src = SRC;
      script.async = true;
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', fail, { once: true });
      document.head.appendChild(script);
      return;
    }

    // Si ya terminó, no esperamos un evento load que nunca volverá a dispararse.
    if (script.readyState === 'complete' || script.dataset.loaded === 'true') {
      finish();
      return;
    }
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });
  });
}

export default function Calendly({ url, fallbackHref }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadCalendly()
      .then((C) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = '';
        C.initInlineWidget({ url, parentElement: ref.current });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="rs__calendly">
      <div ref={ref} className="rs__calendly-frame" />
      {failed && <p className="ph-text">No se ha podido cargar el calendario. <a className="link" href={fallbackHref} target="_blank" rel="noopener noreferrer">Abrir calendario y reservar</a></p>}
    </div>
  );
}
