// Executa o disparo da divulgacao na hora, sem esperar o cron.
//
//   npm run whatsapp:disparar
//
// Respeita WHATSAPP_PROVIDER: sem gateway configurado roda em modo simulado e
// so' imprime o que seria enviado.

import 'dotenv/config';

const { dispararDivulgacao } = await import('../src/services/divulgacao.js');

const relatorio = await dispararDivulgacao();

console.log(`\nModo: ${relatorio.modo}`);
console.log(`Mensagem:\n${relatorio.mensagem}\n`);
console.log(`Enviados: ${relatorio.enviados}/${relatorio.total} — falhas: ${relatorio.falhas}`);
if (relatorio.pendentes.length) {
  console.log(`\nSem id preenchido (pulados): ${relatorio.pendentes.join(', ')}`);
}
for (const r of relatorio.resultados.filter((r) => !r.ok)) {
  console.log(`  falhou — ${r.grupo}: ${r.erro}`);
}
