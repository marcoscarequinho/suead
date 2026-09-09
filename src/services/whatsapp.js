// Camada de envio no WhatsApp.
//
// A API oficial da Meta nao envia mensagem para GRUPO, entao o disparo passa por
// um gateway nao-oficial. Os dois suportados aqui falam quase a mesma lingua:
//
//   WHATSAPP_PROVIDER=zapi       -> Z-API (SaaS, https://z-api.io)
//   WHATSAPP_PROVIDER=evolution  -> Evolution API (self-hosted)
//
// Sem provedor configurado o servico roda em MODO SIMULADO: registra no log o
// que seria enviado e devolve sucesso, dando para testar a rota, o cron e o
// relatorio sem gastar mensagem nem arriscar o numero.

const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? '').trim().toLowerCase();

// Z-API
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE ?? '';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN ?? '';
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN ?? '';

// Evolution API
const EVOLUTION_URL = (process.env.EVOLUTION_URL ?? '').replace(/\/+$/, '');
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? '';

export const whatsappConfigurado =
  (PROVIDER === 'zapi' && Boolean(ZAPI_INSTANCE && ZAPI_TOKEN)) ||
  (PROVIDER === 'evolution' && Boolean(EVOLUTION_URL && EVOLUTION_INSTANCE && EVOLUTION_API_KEY));

export const modoWhatsapp = whatsappConfigurado ? 'produção' : 'simulado';

const TEMPO_LIMITE_MS = 20000;

function urlZapi(caminho) {
  return `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/${caminho}`;
}

/** fetch com timeout — sem isso um gateway travado seguraria a funcao ate o limite da Vercel. */
async function requisitar(url, opcoes = {}) {
  const cancelar = AbortSignal.timeout(TEMPO_LIMITE_MS);
  const resposta = await fetch(url, { ...opcoes, signal: cancelar });
  const texto = await resposta.text();

  let corpo = texto;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    // Alguns erros do gateway voltam em HTML — mantemos o texto cru.
  }

  if (!resposta.ok) {
    const erro = new Error(
      `Gateway respondeu ${resposta.status}: ${typeof corpo === 'string' ? corpo.slice(0, 300) : JSON.stringify(corpo).slice(0, 300)}`
    );
    erro.status = resposta.status;
    throw erro;
  }

  return corpo;
}

/**
 * Envia uma mensagem de texto para um numero ou grupo.
 * `para` e' o id do destino: 5522999999999 para pessoa, 120363...@g.us para grupo.
 */
export async function enviarTexto({ para, mensagem }) {
  if (!para) throw new Error('Destino do envio não informado.');
  if (!mensagem?.trim()) throw new Error('Mensagem vazia.');

  if (!whatsappConfigurado) {
    console.log(`[whatsapp:simulado] -> ${para}\n${mensagem}`);
    return { modo: 'simulado', destino: para, id: null };
  }

  if (PROVIDER === 'zapi') {
    const dados = await requisitar(urlZapi('send-text'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Obrigatorio quando a conta tem token de seguranca ligado no painel.
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {})
      },
      body: JSON.stringify({ phone: para, message: mensagem })
    });

    return { modo: 'produção', destino: para, id: dados?.messageId ?? dados?.id ?? null };
  }

  // Evolution API (v2). O corpo do v1 usava textMessage:{text} — se a sua
  // instancia for antiga, troque `text` por `textMessage: { text: mensagem }`.
  const dados = await requisitar(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ number: para, text: mensagem })
  });

  return { modo: 'produção', destino: para, id: dados?.key?.id ?? null };
}

/**
 * Lista os grupos da instancia conectada, para descobrir o id de cada nome.
 * Usado por `npm run whatsapp:grupos` — nao entra no caminho do disparo.
 */
export async function listarGrupos() {
  if (!whatsappConfigurado) {
    throw new Error(
      'Nenhum gateway configurado. Defina WHATSAPP_PROVIDER (zapi ou evolution) e as chaves no .env.'
    );
  }

  if (PROVIDER === 'zapi') {
    const dados = await requisitar(urlZapi('groups?page=1&pageSize=200'), {
      headers: ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}
    });

    const lista = Array.isArray(dados) ? dados : (dados?.groups ?? []);
    return lista.map((g) => ({
      nome: g.name ?? g.subject ?? g.title ?? '(sem nome)',
      id: g.phone ?? g.id ?? g.groupId ?? ''
    }));
  }

  const dados = await requisitar(
    `${EVOLUTION_URL}/group/fetchAllGroups/${EVOLUTION_INSTANCE}?getParticipants=false`,
    { headers: { apikey: EVOLUTION_API_KEY } }
  );

  const lista = Array.isArray(dados) ? dados : (dados?.groups ?? []);
  return lista.map((g) => ({ nome: g.subject ?? g.name ?? '(sem nome)', id: g.id ?? '' }));
}
