// Grupos de WhatsApp que recebem a divulgacao diaria.
//
// O WhatsApp nao aceita envio por NOME do grupo: e preciso o id (JID) do grupo,
// no formato 120363XXXXXXXXXXXXXX@g.us. Rode `npm run whatsapp:grupos` com a
// instancia conectada para listar os grupos e preencher os ids abaixo.
//
// Grupo com `id` vazio e' pulado no disparo e aparece no relatorio como
// pendente — da' para preencher aos poucos, sem quebrar o envio dos outros.
// Para pausar um grupo sem perder o id, troque `ativo` para false.

export const gruposWhatsapp = [
  { nome: 'LAGOS INFORMAÇÃO NEWS', id: '', ativo: true },
  { nome: 'LINK DE WHATSAPP REGIÃO DO LAGOS', id: '', ativo: true },
  { nome: 'NOTÍCIAS DE SAQUAREMA', id: '', ativo: true },
  { nome: 'NOTÓRIOS NOTÍCIAS 24H', id: '', ativo: true },
  { nome: 'ANÚNCIO ARARUAMA NEWS RJ 01', id: '', ativo: true },
  { nome: 'SERVIÇOS, OFERTAS E AMIGOS', id: '', ativo: true },
  { nome: 'DOS LAGOS RJ', id: '', ativo: true },
  { nome: 'Notícias de Arraial do Cabo', id: '', ativo: true },
  { nome: 'SOS IGUABINHA', id: '', ativo: true },
  { nome: 'Amigos de Cabo Frio', id: '', ativo: true },
  { nome: 'Grupo de divulgação de vendas em geral', id: '', ativo: true },
  { nome: 'OLX LAGOS E LINKS WHATSAPP', id: '', ativo: true }
];

/** Grupos prontos para receber o disparo (ativos e com id preenchido). */
export function gruposParaDisparo() {
  return gruposWhatsapp.filter((g) => g.ativo && g.id.trim());
}

/** Grupos que ainda esperam o id — entram no relatorio para nao passarem batido. */
export function gruposPendentes() {
  return gruposWhatsapp.filter((g) => g.ativo && !g.id.trim());
}
