// Hash de senha com scrypt (nativo do Node — sem dependencia externa).
//
// Formato guardado no banco: scrypt$<N>$<salt-hex>$<hash-hex>
// A comparacao usa timingSafeEqual para nao vazar informacao pelo tempo.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const CUSTO = 16384; // N do scrypt
const TAMANHO = 64; // bytes do hash

export async function gerarHash(senha) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha.normalize('NFKC'), salt, TAMANHO, { N: CUSTO });
  return `scrypt$${CUSTO}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function conferirSenha(senha, guardado) {
  if (!guardado) return false;

  const [algoritmo, custo, saltHex, hashHex] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !saltHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scryptAsync(
    senha.normalize('NFKC'),
    Buffer.from(saltHex, 'hex'),
    esperado.length,
    { N: Number(custo) || CUSTO }
  );

  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Regras minimas de senha, usadas no cadastro. */
export function validarSenha(senha) {
  if (!senha || senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return 'A senha precisa misturar letras e números.';
  }
  return null;
}

export function validarEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
