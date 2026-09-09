// Lista os grupos da instancia de WhatsApp conectada e casa cada um com os
// nomes de src/data/grupos-whatsapp.js, imprimindo o array pronto para colar.
//
//   npm run whatsapp:grupos
//
// O WhatsApp so' aceita envio por id (JID), nunca por nome — este script existe
// para voce nao ter que descobrir os ids na mao.

import 'dotenv/config';

const { listarGrupos } = await import('../src/services/whatsapp.js');
const { gruposWhatsapp } = await import('../src/data/grupos-whatsapp.js');

// Compara ignorando caixa, acento, pontuacao e espaco repetido — os nomes de
// grupo costumam vir com variacao ("Arraial do  Cabo" com dois espacos, etc.).
function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const grupos = await listarGrupos();
console.log(`\n${grupos.length} grupo(s) encontrados na instância.\n`);

const encontrados = [];
const naoEncontrados = [];

for (const alvo of gruposWhatsapp) {
  const chave = normalizar(alvo.nome);
  const achado =
    grupos.find((g) => normalizar(g.nome) === chave) ??
    grupos.find((g) => normalizar(g.nome).includes(chave) || chave.includes(normalizar(g.nome)));

  if (achado) encontrados.push({ ...alvo, id: achado.id, nomeReal: achado.nome });
  else naoEncontrados.push(alvo.nome);
}

console.log('--- Cole isto em src/data/grupos-whatsapp.js ---\n');
console.log('export const gruposWhatsapp = [');
for (const g of encontrados) {
  console.log(`  { nome: '${g.nome.replace(/'/g, "\'")}', id: '${g.id}', ativo: true },`);
}
for (const nome of naoEncontrados) {
  console.log(`  { nome: '${nome.replace(/'/g, "\'")}', id: '', ativo: true }, // NÃO ENCONTRADO`);
}
console.log('];\n');

if (naoEncontrados.length) {
  console.log('Sem correspondência (confira o nome exato na lista abaixo):');
  for (const nome of naoEncontrados) console.log(`  - ${nome}`);
  console.log('\nTodos os grupos da instância:');
  for (const g of grupos) console.log(`  ${g.id}  ${g.nome}`);
}
