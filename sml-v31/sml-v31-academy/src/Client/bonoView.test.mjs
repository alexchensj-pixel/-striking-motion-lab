import test from 'node:test';
import assert from 'node:assert/strict';
import { describirBono } from './bonoView.js';

test('bono compartido: sin precio ni estado de pago, aunque la API los enviara', () => {
  const v = describirBono({ tipo: 'Bono', compartido: true, frecuencia: '1x semana', precio: 212, estadoPago: 'Pagado', clases: { contratadas: 20, realizadas: 11, restantes: 9 } }, true);
  assert.equal(v.etiqueta, 'BONO DE GRUPO · COMPARTIDO');
  assert.equal(v.detalle, '1x semana');
  assert.equal(v.pago, null);
  assert.match(v.aviso, /del grupo/);
  const visible = JSON.stringify(v);
  assert.equal(visible.includes('212'), false);
  assert.equal(visible.includes('Pagado'), false);
  assert.equal(visible.includes('€'), false);
  assert.equal(v.restantes, 9);
  assert.equal(v.resumenClases, '11 realizadas de 20 contratadas');
});

test('bono individual junto a uno compartido: etiqueta, precio y pago propios', () => {
  const v = describirBono({ tipo: 'Bono individual', compartido: false, frecuencia: '1x semana', precio: 53, estadoPago: 'Pagado', clases: { contratadas: 5, realizadas: 3, restantes: 2 } }, true);
  assert.equal(v.etiqueta, 'BONO INDIVIDUAL');
  assert.equal(v.detalle, '1x semana · 53 €');
  assert.equal(v.pago, 'Pago: Pagado');
  assert.equal(v.aviso, null);
});

test('alumno con un solo bono propio: se muestra como plan actual', () => {
  const v = describirBono({ tipo: 'Progresión', compartido: false, precio: 185, estadoPago: null, clases: { contratadas: 8, realizadas: 3, restantes: 5 } }, false);
  assert.equal(v.etiqueta, 'PLAN ACTUAL');
  assert.equal(v.detalle, '185 €');
  assert.equal(v.pago, 'Pago: Por confirmar');
});

test('alumno con solo bono compartido: identificado como compartido y sin datos económicos', () => {
  const v = describirBono({ tipo: null, compartido: true, frecuencia: null, clases: { contratadas: 20, realizadas: 11, restantes: 9 } }, true);
  assert.equal(v.etiqueta, 'BONO DE GRUPO · COMPARTIDO');
  assert.equal(v.titulo, 'Bono de grupo');
  assert.equal(v.detalle, 'Sesiones compartidas con el grupo');
  assert.equal(v.pago, null);
  assert.ok(v.aviso);
});

test('datos incompletos no rompen la presentación', () => {
  const v = describirBono({});
  assert.equal(v.titulo, 'Plan por confirmar');
  assert.equal(v.restantes, '—');
  assert.equal(v.resumenClases, '0 realizadas de — contratadas');
});
