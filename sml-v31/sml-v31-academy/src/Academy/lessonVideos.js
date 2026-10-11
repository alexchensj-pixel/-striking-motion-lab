// Vídeos reales de cada lección. Para añadir uno nuevo: copia el MP4 (H.264, vertical) y su póster a Assets,
// impórtalo aquí y añádelo a la lista de la lección (la clave es el título de la lección en server/academyContent.mjs).
import v_guardia from '../Assets/Video/academy/guardia.mp4';
import p_guardia from '../Assets/Images/academy/guardia.jpg';
import v_desplazamientos from '../Assets/Video/academy/desplazamientos.mp4';
import p_desplazamientos from '../Assets/Images/academy/desplazamientos.jpg';
import v_jab_1 from '../Assets/Video/academy/jab-1.mp4';
import p_jab_1 from '../Assets/Images/academy/jab-1.jpg';
import v_jab_2 from '../Assets/Video/academy/jab-2.mp4';
import p_jab_2 from '../Assets/Images/academy/jab-2.jpg';
import v_cross_1 from '../Assets/Video/academy/cross-1.mp4';
import p_cross_1 from '../Assets/Images/academy/cross-1.jpg';
import v_cross_2 from '../Assets/Video/academy/cross-2.mp4';
import p_cross_2 from '../Assets/Images/academy/cross-2.jpg';
import v_crochet from '../Assets/Video/academy/crochet.mp4';
import p_crochet from '../Assets/Images/academy/crochet.jpg';
import v_low_kick from '../Assets/Video/academy/low-kick.mp4';
import p_low_kick from '../Assets/Images/academy/low-kick.jpg';
import v_middle_kick from '../Assets/Video/academy/middle-kick.mp4';
import p_middle_kick from '../Assets/Images/academy/middle-kick.jpg';
import v_rodillas from '../Assets/Video/academy/rodillas.mp4';
import p_rodillas from '../Assets/Images/academy/rodillas.jpg';
import v_teep from '../Assets/Video/academy/teep.mp4';
import p_teep from '../Assets/Images/academy/teep.jpg';
import v_movilidad from '../Assets/Video/academy/movilidad.mp4';
import p_movilidad from '../Assets/Images/academy/movilidad.jpg';
import v_sincronizacion from '../Assets/Video/academy/sincronizacion.mp4';
import p_sincronizacion from '../Assets/Images/academy/sincronizacion.jpg';
import v_rutina from '../Assets/Video/academy/rutina.mp4';
import p_rutina from '../Assets/Images/academy/rutina.jpg';
import v_transferencia from '../Assets/Video/academy/transferencia.mp4';
import p_transferencia from '../Assets/Images/academy/transferencia.jpg';

export const LESSON_VIDEOS = {
  'La guardia': [{ src: v_guardia, poster: p_guardia, title: 'Guardia: colocación en cuatro pasos' }],
  'Los desplazamientos': [{ src: v_desplazamientos, poster: p_desplazamientos, title: 'Desplazamientos: el pie más cercano primero' }],
  'Jab (puño adelantado)': [{ src: v_jab_1, poster: p_jab_1, title: 'Jab con pasito corto' }, { src: v_jab_2, poster: p_jab_2, title: 'Jab: trabajo de pies' }],
  'Cross (directo trasero)': [{ src: v_cross_1, poster: p_cross_1, title: 'Cross: secuencia completa' }, { src: v_cross_2, poster: p_cross_2, title: 'Cross: la cadena pie, cadera, torso y brazo' }],
  'Crochet (hook)': [{ src: v_crochet, poster: p_crochet, title: 'Crochet: giro y altura del brazo' }],
  'Low kick (patada baja)': [{ src: v_low_kick, poster: p_low_kick, title: 'Low kick: entrada y carga de peso' }],
  'Middle kick (patada media)': [{ src: v_middle_kick, poster: p_middle_kick, title: 'Middle kick: apoyo y giro de cintura' }],
  'Rodillas': [{ src: v_rodillas, poster: p_rodillas, title: 'Rodilla: entrada y proyección' }],
  'Frontales / Teep': [{ src: v_teep, poster: p_teep, title: 'Teep: de la carga al golpe seco' }],
  'Movilidad de cadera para patear': [{ src: v_movilidad, poster: p_movilidad, title: 'Movilidad de cadera para patear' }],
  'Sincronización de apoyos y rotación': [{ src: v_sincronizacion, poster: p_sincronizacion, title: 'Juego de pies: niveles 1 a 5' }],
  'Rutina técnica en solitario': [{ src: v_rutina, poster: p_rutina, title: 'Rutina de entrenamiento rápido sin material' }],
  'Transferencia de fuerza y escalera avanzada': [{ src: v_transferencia, poster: p_transferencia, title: 'Potencia, estabilidad y escalera' }],
};
