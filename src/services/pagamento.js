// Integracao de pagamento — Mercado Pago (Checkout Pro).
//
// Fluxo:
//   1. O aluno escolhe um plano  -> criarPreferencia() devolve a URL do checkout
//   2. Ele paga no Mercado Pago  -> volta para /assinatura/retorno
//   3. O Mercado Pago avisa      -> POST /api/webhooks/mercadopago
//      O webhook NUNCA confia no corpo recebido: consulta o pagamento pela API
//      antes de liberar qualquer acesso.

import crypto from 'node:crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? '';
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET ?? '';
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const pagamentoConfigurado = Boolean(ACCESS_TOKEN);

export const modoPagamento = !ACCESS_TOKEN
  ? 'desligado'
  : ACCESS_TOKEN.startsWith('TEST-')
    ? 'sandbox'
    : 'produção';

const cliente = pagamentoConfigurado
  ? new MercadoPagoConfig({ accessToken: ACCESS_TOKEN, options: { timeout: 10_000 } })
  : null;

/**
 * Converte o plano no valor efetivamente cobrado.
 * Os preços exibidos são mensais; o plano anual é cobrado de uma vez,
 * parcelado em 12x sem alterar o valor da parcela.
 */
export function calcularCobranca(plano) {
  const anual = plano.id === 'anual';
  const parcelas = anual ? 12 : 1;
  const valor = Number((Number(plano.preco) * parcelas).toFixed(2));

  return {
    valor,
    parcelas,
    ciclo: anual ? 'anual' : 'mensal',
    descricao: anual
      ? `${plano.nome} — 12 meses (12x de R$ ${Number(plano.preco).toFixed(2).replace('.', ',')})`
      : `${plano.nome} — acesso mensal`
  };
}

/** Cria a preferencia de checkout e devolve a URL para onde redirecionar o aluno. */
export async function criarPreferencia({ plano, aluno, referencia }) {
  if (!pagamentoConfigurado) {
    throw new Error('Pagamento indisponível: MP_ACCESS_TOKEN não configurado.');
  }

  const cobranca = calcularCobranca(plano);
  const httpsPublico = BASE_URL.startsWith('https://');

  const corpo = {
    items: [
      {
        id: plano.id,
        title: `EducaAI — ${plano.nome}`,
        description: cobranca.descricao,
        category_id: 'learnings',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: cobranca.valor
      }
    ],
    payer: {
      name: aluno.nome ?? undefined,
      email: aluno.email
    },
    external_reference: referencia,
    statement_descriptor: 'EDUCAAI',
    back_urls: {
      success: `${BASE_URL}/assinatura/retorno?status=sucesso`,
      pending: `${BASE_URL}/assinatura/retorno?status=pendente`,
      failure: `${BASE_URL}/assinatura/retorno?status=falha`
    },
    // auto_return exige URL pública em https; em localhost o aluno volta pelo botão.
    ...(httpsPublico ? { auto_return: 'approved' } : {}),
    ...(httpsPublico ? { notification_url: `${BASE_URL}/api/webhooks/mercadopago` } : {}),
    payment_methods: {
      installments: cobranca.parcelas,
      default_installments: cobranca.parcelas
    }
  };

  const resposta = await new Preference(cliente).create({ body: corpo });

  return {
    preferenceId: resposta.id,
    url: resposta.init_point ?? resposta.sandbox_init_point,
    urlSandbox: resposta.sandbox_init_point ?? null,
    cobranca
  };
}

/** Consulta um pagamento na API oficial — fonte da verdade para liberar acesso. */
export async function consultarPagamento(pagamentoId) {
  if (!pagamentoConfigurado) return null;
  try {
    return await new Payment(cliente).get({ id: String(pagamentoId) });
  } catch (erro) {
    console.error('[pagamento] falha ao consultar', pagamentoId, '-', erro.message);
    return null;
  }
}

/**
 * Procura o pagamento de uma assinatura pela referencia enviada ao gateway.
 *
 * E o caminho de CONCILIACAO: quando o webhook nao chega (tipico em localhost,
 * onde nao ha URL publica), e o site que pergunta ao Mercado Pago em vez de
 * esperar o aviso. Devolve o aprovado, se houver, ou o mais recente.
 */
export async function buscarPagamentoPorReferencia(referencia) {
  if (!pagamentoConfigurado || !referencia) return null;

  try {
    const url =
      'https://api.mercadopago.com/v1/payments/search?external_reference=' +
      encodeURIComponent(referencia);
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    if (!resposta.ok) return null;

    const dados = await resposta.json();
    const lista = dados.results ?? [];
    return lista.find((p) => p.status === 'approved') ?? lista[0] ?? null;
  } catch (erro) {
    console.error('[conciliação] falha ao buscar', referencia, '-', erro.message);
    return null;
  }
}

/** Traduz o status do Mercado Pago para o status da assinatura. */
export function traduzirStatus(status) {
  switch (status) {
    case 'approved':
      return 'ativa';
    case 'in_process':
    case 'pending':
    case 'authorized':
      return 'pendente';
    case 'rejected':
      return 'recusada';
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'cancelada';
    default:
      return 'pendente';
  }
}

/**
 * Valida a assinatura x-signature do webhook, quando MP_WEBHOOK_SECRET esta definido.
 * Sem o segredo devolve null (indefinido) — a rota entao se apoia so na consulta a API.
 */
export function validarAssinaturaWebhook({ cabecalhoAssinatura, requestId, dataId }) {
  if (!WEBHOOK_SECRET || !cabecalhoAssinatura) return null;

  const partes = Object.fromEntries(
    cabecalhoAssinatura.split(',').map((p) => p.split('=').map((x) => x.trim()))
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const base = `id:${dataId};request-id:${requestId ?? ''};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', WEBHOOK_SECRET).update(base).digest('hex');

  const a = Buffer.from(esperado, 'hex');
  const b = Buffer.from(v1, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Referencia unica por tentativa de assinatura. */
export function novaReferencia(alunoId, planoCodigo) {
  return `educaai-${alunoId}-${planoCodigo}-${crypto.randomBytes(6).toString('hex')}`;
}
