import test from 'node:test';
import assert from 'node:assert/strict';
import { extraerIdentidad } from './miSmlAuth.js';

const ns = 'https://strikingmotionlab.com/';

test('lee email y verificación de los claims namespaced de la acción Auth0 de MI SML', () => {
  assert.deepEqual(extraerIdentidad({
    sub: 'auth0|alumno',
    [ns + 'email']: 'alumno@example.com',
    [ns + 'email_verified']: true,
  }), {
    sub: 'auth0|alumno',
    email: 'alumno@example.com',
    email_verified: true,
  });
});

test('mantiene compatibilidad con claims OIDC estándar', () => {
  assert.deepEqual(extraerIdentidad({
    sub: 'auth0|alumno',
    email: 'alumno@example.com',
    email_verified: true,
  }), {
    sub: 'auth0|alumno',
    email: 'alumno@example.com',
    email_verified: true,
  });
});

test('prioriza claims estándar cuando ambos formatos están presentes', () => {
  assert.deepEqual(extraerIdentidad({
    sub: 'auth0|alumno',
    email: 'standard@example.com',
    email_verified: true,
    [ns + 'email']: 'namespaced@example.com',
    [ns + 'email_verified']: false,
  }), {
    sub: 'auth0|alumno',
    email: 'standard@example.com',
    email_verified: true,
  });
});

test('no considera verificado un email si el claim es false, ausente o no booleano true', () => {
  assert.deepEqual(extraerIdentidad({
    sub: 'auth0|alumno',
    [ns + 'email']: 'alumno@example.com',
    [ns + 'email_verified']: 'true',
  }), {
    sub: 'auth0|alumno',
    email: 'alumno@example.com',
    email_verified: false,
  });
});
