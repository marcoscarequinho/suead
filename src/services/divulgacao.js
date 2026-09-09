// Divulgacao diaria nos grupos de WhatsApp.
//
// Monta a mensagem (uma chamada curta + o link do site) e percorre os grupos de
// src/data/grupos-whatsapp.js com um intervalo entre os envios. O intervalo nao
// e' cosmetico: disparar 12 grupos no mesmo segundo e' o padrao que os gateways
// e o proprio WhatsApp usam para marcar o numero como automacao.

import { enviarTexto, modoWhatsapp, whatsappConfigurado } from './whatsapp.js';
import { gruposParaDisparo, gruposPendentes } from '../data/grupos-whatsapp.js';

const LINK = process.env.DIVULGACAO_LINK || 'https://www.suead.com.br/';
const CHAMADA =
  process.env.DIVULGACAO_TEXTO ||
  'Estude online com professores de Inteligência Artificial: Trânsito, Medicina, Advocacia e mais. Matrículas abertas 👇';

// Espera entre um grupo e o seguinte. 8s x 12 grupos = ~1min40 de execucao,
// bem dentro do limite da funcao na Vercel.
const INTERVALO_MS = Number(process.env.DIVULGACAO_INTERVALO_MS || 8000);

export const divulgacaoConfigurada = whatsappConfigurado;

export function mensagemDiaria() {
  return `${CHAMADA}\n\n${LINK}`;
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispara a mensagem do dia para todos os grupos ativos com id preenchido.
 * Um grupo que falha nao interrompe os demais — o erro entra no relatorio.
 */
export async function dispararDivulgacao() {
  const grupos = gruposParaDisparo();
  const pendentes = gruposPendentes().map((g) => g.nome);
  const mensagem = mensagemDiaria();
  const resultados = [];

  for (const [indice, grupo] of grupos.entries()) {
    try {
      const envio = await enviarTexto({ para: grupo.id, mensagem });
      resultados.push({ grupo: grupo.nome, ok: true, id: envio.id });
      console.log(`[divulgação] enviado — ${grupo.nome}`);
    } catch (erro) {
      resultados.push({ grupo: grupo.nome, ok: false, erro: erro.message });
      console.error(`[divulgação] falhou — ${grupo.nome}: ${erro.message}`);
    }

    // Sem espera depois do ultimo: so' seguraria a funcao a toa.
    if (indice < grupos.length - 1) {
      await esperar(INTERVALO_MS + Math.round(Math.random() * 2000));
    }
  }

  const enviados = resultados.filter((r) => r.ok).length;

  return {
    modo: modoWhatsapp,
    executadoEm: new Date().toISOString(),
    mensagem,
    total: grupos.length,
    enviados,
    falhas: resultados.length - enviados,
    pendentes,
    resultados
  };
}
