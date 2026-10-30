// Presentación de un bono en Mi SML. Lógica pura (sin React) para poder probarla con node --test.
// Un bono compartido (de grupo) nunca muestra precio ni estado de pago: no son datos individuales del alumno,
// aunque la API los enviara por error.
export function describirBono(bono, hayCompartidos = false) {
  const compartido = bono?.compartido === true;
  const clases = bono?.clases || {};
  const frecuencia = bono?.frecuencia || null;
  return {
    compartido,
    etiqueta: compartido ? 'BONO DE GRUPO · COMPARTIDO' : hayCompartidos ? 'BONO INDIVIDUAL' : 'PLAN ACTUAL',
    titulo: bono?.tipo || (compartido ? 'Bono de grupo' : 'Plan por confirmar'),
    detalle: compartido
      ? (frecuencia || 'Sesiones compartidas con el grupo')
      : `${frecuencia ? `${frecuencia} · ` : ''}${bono?.precio != null ? `${bono.precio} €` : 'Consulta los detalles con tu entrenador'}`,
    restantes: clases.restantes ?? '—',
    resumenClases: `${clases.realizadas ?? 0} realizadas de ${clases.contratadas ?? '—'} contratadas`,
    aviso: compartido
      ? 'Estas sesiones son del grupo: el consumo que ves es el de todo el grupo, no solo el tuyo. El precio y el pago del grupo no se muestran aquí.'
      : null,
    pago: compartido ? null : `Pago: ${bono?.estadoPago || 'Por confirmar'}`,
  };
}
