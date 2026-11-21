import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './credentials.css';

// Galería de acreditaciones WAKO + FEKM: nombre visible; identificadores personales y datos privados ocultos.
// Escritorio: lado a lado · móvil: apiladas · al tocar una, se amplía a pantalla completa (Esc, ✕ o toque fuera para cerrar).
export default function CredentialGallery({ items }) {
  const [open, setOpen] = useState(null);
  const overlay = useRef(null);

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    // El scroll de la web es la navegación: mientras la imagen está ampliada, la rueda no debe mover la escena de debajo.
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    const el = overlay.current;
    window.addEventListener('keydown', onKey);
    el?.addEventListener('wheel', stop, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      el?.removeEventListener('wheel', stop);
    };
  }, [open]);

  const current = open === null ? null : items[open];

  return (
    <>
      <div className="credential-gallery" role="list" aria-label="Acreditaciones deportivas y federativas">
        {items.map((it, i) => (
          <figure className={`credential-gallery__item credential-gallery__item--${it.id}`} role="listitem" key={it.id}>
            <div className="credential-gallery__proofhead"><span>{it.eyebrow}</span><strong>{it.stat}</strong><b>{it.detail}</b><small>{it.note}</small></div>
            <button type="button" className="credential-gallery__open" onClick={() => setOpen(i)} aria-label={`Ampliar: ${it.alt}`}>
              <img src={it.src} alt={it.alt} width={it.width} height={it.height} loading="lazy" decoding="async" />
              <span className="credential-gallery__zoom" aria-hidden="true">Ver documento ↗</span>
            </button>
            <figcaption>{it.caption}</figcaption>
          </figure>
        ))}
      </div>
      {current && createPortal(
        <div ref={overlay} className="credential-lightbox" role="dialog" aria-modal="true" aria-label={current.alt} onClick={() => setOpen(null)}>
          <button type="button" className="credential-lightbox__close" onClick={() => setOpen(null)} aria-label="Cerrar">×</button>
          <img src={current.src} alt={current.alt} onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  );
}
