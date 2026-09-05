// Conciliacao de pagamentos.
//
// O webhook do Mercado Pago só chega em URL pública. Em desenvolvimento
// (localhost) ele nunca chega, e um pagamento aprovado ficaria eternamente
// "pendente" no banco. Aqui o site inverte o fluxo: em vez de esperar o aviso,
// pergunta ao gateway pela referência da assinatura.
//
// Roda em três lugares:
//   • ao abrir /painel        — o aluno vê o acesso liberado sem fazer nada
//   • no retorno do checkout  — quando a URL volta sem payment_id
//   • npm run pagamentos:conciliar — varredura manual ou agendada

import {
  buscarPagamentoPorReferencia,
  traduzirStatus,
  pagamentoConfigurado
} from './pagamento.js';
import {
  pendentesParaConciliar,
  atualizarPorReferencia,
  marcarVerificada
} from '../repositories/assinaturas.js';

/**
 * Consulta o gateway para as assinaturas pendentes e atualiza o que mudou.
 * Devolve quantas foram verificadas e quantas mudaram de status.
 */
export async function conciliarPendentes(opcoes = {}) {
  if (!pagamentoConfigurado) return { verificadas: 0, atualizadas: 0 };

  const pendentes = await pendentesParaConciliar(opcoes);
  let atualizadas = 0;

  for (const assinatura of pendentes) {
    // Marca antes de consultar: se a API falhar, não insistimos em loop.
    await marcarVerificada(assinatura.referencia);

    const pagamento = await buscarPagamentoPorReferencia(assinatura.referencia);
    if (!pagamento) continue;

    const novoStatus = traduzirStatus(pagamento.status);
    if (novoStatus === assinatura.status) continue;

    await atualizarPorReferencia(assinatura.referencia, {
      status: novoStatus,
      pagamentoId: String(pagamento.id),
      meioPagamento: pagamento.payment_method_id ?? null,
      detalhe: { status: pagamento.status, detalhe: pagamento.status_detail }
    });

    atualizadas++;
    console.log(
      `[conciliação] ${assinatura.referencia}: pendente -> ${novoStatus} (pagamento ${pagamento.id})`
    );
  }

  return { verificadas: pendentes.length, atualizadas };
}
