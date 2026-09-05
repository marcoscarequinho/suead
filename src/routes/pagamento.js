// Rotas de assinatura: inicio do checkout, retorno do aluno e webhook.

import { Router } from 'express';
import { listarPlanos } from '../repositories/conteudo.js';
import {
  criarAssinatura,
  buscarPorReferencia,
  atualizarPorReferencia
} from '../repositories/assinaturas.js';
import {
  criarPreferencia,
  consultarPagamento,
  traduzirStatus,
  validarAssinaturaWebhook,
  novaReferencia,
  pagamentoConfigurado,
  calcularCobranca
} from '../services/pagamento.js';
import { conciliarPendentes } from '../services/conciliacao.js';
import { exigirLogin } from '../middleware/auth.js';

const router = Router();

/* ---------------- Início do checkout ---------------- */

router.post('/assinar/:plano', exigirLogin, async (req, res, next) => {
  try {
    const planos = await listarPlanos();
    const plano = planos.find((p) => p.id === req.params.plano);
    if (!plano) return res.status(404).redirect('/#planos');

    if (!pagamentoConfigurado) {
      return res.status(503).render('assinatura', {
        titulo: 'Pagamento indisponível — EducaAI',
        descricao: 'O meio de pagamento ainda não está configurado.',
        pagina: 'assinatura',
        estado: 'erro',
        mensagem: 'O pagamento ainda não está configurado nesta instalação (falta MP_ACCESS_TOKEN).',
        assinatura: null
      });
    }

    const referencia = novaReferencia(req.aluno.id, plano.id);
    const cobranca = calcularCobranca(plano);

    const preferencia = await criarPreferencia({ plano, aluno: req.aluno, referencia });

    await criarAssinatura({
      alunoId: req.aluno.id,
      planoCodigo: plano.id,
      planoNome: plano.nome,
      valor: cobranca.valor,
      parcelas: cobranca.parcelas,
      ciclo: cobranca.ciclo,
      referencia,
      preferenceId: preferencia.preferenceId
    });

    // Guarda a referência para reconhecer o aluno quando ele voltar do gateway.
    req.session.assinaturaEmCurso = referencia;

    res.redirect(preferencia.url);
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Retorno do aluno ---------------- */

router.get('/assinatura/retorno', async (req, res, next) => {
  try {
    const referencia = req.query.external_reference || req.session?.assinaturaEmCurso || null;
    const pagamentoId = req.query.payment_id || req.query.collection_id || null;

    // A URL pode voltar sem payment_id (Pix, boleto, auto_return desligado):
    // nesse caso perguntamos ao gateway pela referência.
    if (referencia && !pagamentoId) {
      await conciliarPendentes({ intervaloMinutos: 0, limite: 3, alunoId: req.aluno?.id ?? null });
    }

    let assinatura = referencia ? await buscarPorReferencia(referencia) : null;

    // Confere direto na API do Mercado Pago — não confia no que veio na URL.
    if (pagamentoId) {
      const pagamento = await consultarPagamento(pagamentoId);
      if (pagamento && (!referencia || pagamento.external_reference === referencia)) {
        assinatura = await atualizarPorReferencia(pagamento.external_reference, {
          status: traduzirStatus(pagamento.status),
          pagamentoId: String(pagamento.id),
          meioPagamento: pagamento.payment_method_id ?? null,
          detalhe: { status: pagamento.status, detalhe: pagamento.status_detail }
        });
      }
    }

    const estado =
      assinatura?.status === 'ativa'
        ? 'sucesso'
        : assinatura?.status === 'recusada'
          ? 'falha'
          : req.query.status === 'falha'
            ? 'falha'
            : 'pendente';

    const mensagens = {
      sucesso: 'Pagamento aprovado! Seu acesso já está liberado.',
      pendente: 'Recebemos seu pedido. Assim que o pagamento for confirmado, liberamos o acesso — em boleto ou Pix isso pode levar algumas horas.',
      falha: 'O pagamento não foi aprovado. Nenhuma cobrança foi feita — você pode tentar de novo com outro meio.'
    };

    delete req.session.assinaturaEmCurso;

    res.render('assinatura', {
      titulo: 'Sua assinatura — EducaAI',
      descricao: 'Situação do seu pagamento na EducaAI.',
      pagina: 'assinatura',
      estado,
      mensagem: mensagens[estado],
      assinatura
    });
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Webhook ---------------- */

router.post('/api/webhooks/mercadopago', async (req, res) => {
  // Responde rápido: o Mercado Pago reenvia se demorarmos.
  res.status(200).json({ recebido: true });

  try {
    const tipo = req.body?.type ?? req.query.type ?? req.body?.topic;
    const dataId = req.body?.data?.id ?? req.query['data.id'] ?? req.query.id;
    if (tipo !== 'payment' || !dataId) return;

    const assinaturaValida = validarAssinaturaWebhook({
      cabecalhoAssinatura: req.get('x-signature'),
      requestId: req.get('x-request-id'),
      dataId
    });

    if (assinaturaValida === false) {
      console.warn('[webhook] assinatura x-signature inválida — ignorado');
      return;
    }

    // Fonte da verdade: a própria API do Mercado Pago.
    const pagamento = await consultarPagamento(dataId);
    if (!pagamento?.external_reference) return;

    const atualizada = await atualizarPorReferencia(pagamento.external_reference, {
      status: traduzirStatus(pagamento.status),
      pagamentoId: String(pagamento.id),
      meioPagamento: pagamento.payment_method_id ?? null,
      detalhe: { status: pagamento.status, detalhe: pagamento.status_detail }
    });

    console.log(
      `[webhook] ${pagamento.external_reference} -> ${pagamento.status}` +
        (atualizada ? '' : ' (assinatura não encontrada)')
    );
  } catch (erro) {
    console.error('[webhook] falha ao processar:', erro.message);
  }
});

export default router;
