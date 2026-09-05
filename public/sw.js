/* EducaAI — service worker.
 *
 * Regra de ouro: nenhuma pagina HTML vai para o cache. As telas dependem da
 * sessao do aluno, e um /painel guardado seria servido para a proxima pessoa
 * que abrisse o app no mesmo aparelho. Cache aqui e so para estatico.
 */

const VERSAO = 'educaai-v2';
const ESTATICOS = [
  '/offline.html',
  '/css/style.css',
  '/js/main.js',
  '/js/voz.js',
  '/icons/icone-192.png',
  '/icons/icone-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll(ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegacao: sempre rede. Sem conexao, mostra a pagina offline.
  if (requisicao.mode === 'navigate') {
    evento.respondWith(
      fetch(requisicao).catch(async () => {
        const offline = await caches.match('/offline.html');
        return (
          offline ||
          new Response('<h1>Sem conexão</h1>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        );
      })
    );
    return;
  }

  // CSS e JS: rede primeiro. Os arquivos nao tem hash no nome, entao servir a
  // copia do cache faria a pagina recem-publicada rodar com o estilo antigo.
  // O cache fica so como rede de seguranca para quando nao houver conexao.
  if (/^\/(css|js)\//.test(url.pathname)) {
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(async () => {
          const guardado = await caches.match(requisicao);
          return guardado || new Response('', { status: 504, statusText: 'Sem conexão' });
        })
    );
    return;
  }

  // Icones: cache primeiro, revalidando em segundo plano. Mudam de raro a nunca.
  if (url.pathname.startsWith('/icons/')) {
    evento.respondWith(
      caches.open(VERSAO).then(async (cache) => {
        const guardado = await cache.match(requisicao);
        const rede = fetch(requisicao)
          .then((resposta) => {
            if (resposta.ok) cache.put(requisicao, resposta.clone());
            return resposta;
          })
          .catch(() => guardado);
        return guardado || rede;
      })
    );
  }
});
