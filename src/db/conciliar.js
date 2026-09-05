// Varredura de conciliacao de pagamentos.
//   npm run pagamentos:conciliar
//
// Consulta o Mercado Pago para todas as assinaturas pendentes recentes e
// atualiza as que ja foram pagas. Util quando o webhook nao chegou — em
// localhost ele nunca chega — e como tarefa agendada em producao.

import 'dotenv/config';
import { encerrar } from './pool.js';
import { conciliarPendentes } from '../services/conciliacao.js';
import { pagamentoConfigurado, modoPagamento } from '../services/pagamento.js';

async function main() {
  if (!pagamentoConfigurado) {
    console.error('MP_ACCESS_TOKEN não configurado — nada a conciliar.');
    process.exit(1);
  }

  console.log(`Conciliando pagamentos (modo ${modoPagamento})...`);

  const { verificadas, atualizadas } = await conciliarPendentes({
    janelaDias: 30,
    intervaloMinutos: 0,
    limite: 100
  });

  console.log(`\nVerificadas: ${verificadas}  |  Atualizadas: ${atualizadas}`);
  await encerrar();
}

main().catch(async (erro) => {
  console.error('Falha na conciliação:', erro);
  await encerrar();
  process.exit(1);
});
