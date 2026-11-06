# Nuevo esqueleto de navegación comercial — Striking Motion Lab

## Objetivo

Reducir la fricción para consultar servicios, precios, conocer al entrenador y reservar, sin recortar contenido, escenas, duración ni profundidad de la experiencia 3D.

La web conserva una única experiencia y dos intenciones de recorrido:
- **Recorrido comercial:** entrar, entender la oferta, consultar precios, conocer a Alex y reservar.
- **Recorrido de exploración:** descubrir disciplinas y conocer el método con todo el contenido actual.

No se crean dos webs ni dos sistemas de navegación paralelos.

## Esqueleto funcional

### 1. Inicio
- Mantener la escena y su contenido íntegros.
- Dos salidas claras: **Ver entrenamiento y precios** y **Explorar SML**.
- Mantener el acceso a reserva y a la vía B2B donde ya corresponda.

### 2. Recorrido comercial
1. **Entrenamiento y precios** — modalidades, formatos, opciones y tarifas.
2. **Sobre Alex** — persona, trayectoria, experiencia y prueba social ya existentes.
3. **Reserva** — acceso directo al calendario/contacto y explicación del siguiente paso.

El indicador de pasos muestra dónde está la persona dentro de este recorrido, pero no bloquea la navegación. «Siguiente paso» lleva al destino comercial siguiente sin obligar a atravesar escenas intermedias.

### 3. Recorrido de exploración
- **Descubrir** — disciplinas y posibilidades de entrenamiento.
- **Método** — proceso de trabajo y profundidad metodológica.
- Mantener todos los bloques, escenas y transiciones actuales.

Desde cualquier punto debe seguir siendo posible saltar a Entrenamiento/precios, Sobre Alex o Reserva.

## Mapeo con la arquitectura existente

La implementación debe reutilizar el modelo actual, no duplicarlo:
- `SECTIONS` y `SECTION_CHAPTER` en `src/App/sections.js`.
- `goToSection()` en `src/Scene/Transitions/navigation.js` para saltos directos.
- `activeSection` del store como estado de navegación.
- Componentes existentes de navegación y CTA contextual.

Correspondencias actuales:
- Inicio: `home` / capítulo `entrada`.
- Descubrir: `explore` / capítulo `character-select`.
- Método: `method` / capítulo `asesoria-lab`.
- Entrenamiento y precios: `training` / capítulo `slot`.
- Sobre Alex: sección `founder` / capítulo `proof-chen` (el copy y la denominación visibles se revisarán sin alterar el contenido biográfico aprobado).
- Reserva: `book` / capítulo `reserva`.

## Restricciones técnicas

- No cambiar el orden físico de `chapters`.
- No modificar waypoints, trayectorias de cámara, coordenadas de iluminación, salas, Bridge ni umbrales 3D para implementar este recorrido.
- No reducir los valores de duración de capítulos ni la longitud de las escenas.
- No eliminar ni resumir contenido.
- No duplicar el menú, los CTA contextuales ni la lógica de salto que ya existe.
- Mantener hash, historial, navegación atrás/adelante, overlays y estados de selección.
- Conservar los accesos a Empresas, Academy y Mi SML.

## Criterios de aceptación

1. Desde Inicio se puede entrar directamente a Entrenamiento/precios, Explorar o Reserva.
2. Desde Entrenamiento se puede ir a Sobre Alex o Reserva con un salto directo.
3. Desde Sobre Alex se puede volver a Entrenamiento o ir a Reserva.
4. Descubrir y Método siguen siendo accesibles y completos, sin ser pasos obligatorios del recorrido comercial.
5. El indicador y «Siguiente paso» orientan; nunca impiden saltar o explorar.
6. No aparecen CTA duplicados ni dos menús que compitan.
7. Los enlaces con hash y los controles atrás/adelante conservan su comportamiento.
8. El recorrido 3D original se mantiene intacto; comprobarlo visualmente en preview en escritorio y móvil antes de darlo por terminado.

## Secuencia de trabajo

1. Auditar los CTA actuales y asignar a cada uno un único destino.
2. Definir la jerarquía visual del recorrido comercial y la entrada a exploración.
3. Implementar el indicador y «Siguiente paso» reutilizando `goToSection()`.
4. Revisar responsive, accesibilidad, historial y estados de navegación.
5. Verificar el preview completo, tanto recorrido comercial como exploración 3D.

Este documento define el esqueleto. No autoriza a reordenar las salas ni a tocar la arquitectura física 3D.
