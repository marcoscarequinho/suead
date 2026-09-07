// Chat com o admin (não a IA). Sem websocket: faz polling enquanto o painel
// está aberto.
(function () {
  const btnAbrir = document.getElementById('suporte-abrir');
  const painel = document.getElementById('suporte-painel');
  const btnFechar = document.getElementById('suporte-fechar');
  const lista = document.getElementById('suporte-mensagens');
  const form = document.getElementById('suporte-form');
  const campo = document.getElementById('suporte-texto');
  const badge = document.getElementById('suporte-badge');

  if (!btnAbrir || !painel) return;

  const INTERVALO_MS = 8000;
  let aberto = false;
  let intervalo = null;
  let totalRenderizado = 0;

  function renderizar(mensagens) {
    if (mensagens.length === totalRenderizado) return;
    totalRenderizado = mensagens.length;

    if (!mensagens.length) {
      lista.innerHTML = '<p class="suporte-vazio">Mande sua dúvida — quem responde aqui é a nossa equipe, não a IA.</p>';
      return;
    }

    lista.innerHTML = mensagens
      .map((m) => `<div class="suporte-msg ${m.remetente}">${escapar(m.texto)}</div>`)
      .join('');
    lista.scrollTop = lista.scrollHeight;
  }

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  async function buscarMensagens() {
    try {
      const resp = await fetch('/api/suporte/mensagens');
      if (!resp.ok) return;
      const dados = await resp.json();
      renderizar(dados.mensagens ?? []);
    } catch (erro) {
      console.error('[suporte] falha ao buscar mensagens:', erro);
    }
  }

  function abrir() {
    aberto = true;
    painel.hidden = false;
    btnAbrir.setAttribute('aria-expanded', 'true');
    if (badge) badge.hidden = true;
    buscarMensagens();
    intervalo = setInterval(buscarMensagens, INTERVALO_MS);
    campo.focus();
  }

  function fechar() {
    aberto = false;
    painel.hidden = true;
    btnAbrir.setAttribute('aria-expanded', 'false');
    if (intervalo) clearInterval(intervalo);
  }

  btnAbrir.addEventListener('click', () => (aberto ? fechar() : abrir()));
  btnFechar.addEventListener('click', fechar);

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    campo.value = '';
    campo.disabled = true;
    try {
      await fetch('/api/suporte/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      });
      await buscarMensagens();
    } catch (erro) {
      console.error('[suporte] falha ao enviar:', erro);
    } finally {
      campo.disabled = false;
      campo.focus();
    }
  });
})();
