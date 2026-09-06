/* EducaAI — interações da interface */

(function () {
  'use strict';

  /* ---------- Menu mobile ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto');
      menuBtn.setAttribute('aria-expanded', String(aberto));
    });
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        menu.classList.remove('aberto');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Sombra do cabeçalho ---------- */
  const cabecalho = document.getElementById('cabecalho');
  if (cabecalho) {
    const aoRolar = () => cabecalho.classList.toggle('rolado', window.scrollY > 8);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }

  /* ---------- Abas de nível nas matérias ---------- */
  document.querySelectorAll('.nivel-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { materia, nivel } = btn.dataset;

      document
        .querySelectorAll(`.nivel-btn[data-materia="${materia}"]`)
        .forEach((b) => {
          const ativo = b === btn;
          b.classList.toggle('ativo', ativo);
          b.setAttribute('aria-selected', String(ativo));
        });

      document
        .querySelectorAll(`.nivel-painel[data-materia="${materia}"]`)
        .forEach((painel) => {
          const ativo = painel.dataset.painel === nivel;
          painel.classList.toggle('ativo', ativo);
          painel.hidden = !ativo;
        });
    });
  });

  /* ---------- Revelação ao rolar ---------- */
  const alvos = document.querySelectorAll(
    '.card-materia, .card-diferencial, .card-depoimento, .card-plano, .trilha-nivel, .passos li'
  );
  if ('IntersectionObserver' in window && alvos.length) {
    alvos.forEach((el) => el.classList.add('revelar'));
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('visivel');
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    alvos.forEach((el) => observador.observe(el));
  }

  /* ---------- Legenda rotativa do avatar (hero) ---------- */
  const legenda = document.getElementById('legenda-avatar');
  if (legenda) {
    const falas = [
      'Vamos resolver esta equação juntos, passo a passo.',
      'Percebi que você travou aqui. Vou explicar de outro jeito.',
      'Pode me interromper quando quiser — estou aqui 24 horas.',
      'Acertou! Vamos subir o nível desta trilha.'
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % falas.length;
      legenda.style.opacity = '0';
      setTimeout(() => {
        legenda.textContent = falas[i];
        legenda.style.opacity = '1';
      }, 250);
    }, 4200);
    legenda.style.transition = 'opacity .25s';
  }

  /* ---------- Tira-dúvidas da sala de aula ---------- */
  const form = document.getElementById('chat-form');
  const mensagens = document.getElementById('chat-mensagens');

  // Conversa da aula. Vai junto de cada pergunta para o professor lembrar do
  // que ja foi dito ("explique de novo", "e no exemplo anterior?").
  const historico = [];

  function adicionarBalao(texto, classe) {
    const div = document.createElement('div');
    div.className = 'balao ' + classe;
    div.textContent = texto;
    mensagens.appendChild(div);
    mensagens.scrollTop = mensagens.scrollHeight;
    return div;
  }

  async function perguntar(pergunta) {
    adicionarBalao(pergunta, 'aluno');

    const carregando = document.createElement('div');
    carregando.className = 'balao professor';
    carregando.innerHTML = '<span class="digitando"><i></i><i></i><i></i></span>';
    mensagens.appendChild(carregando);
    mensagens.scrollTop = mensagens.scrollHeight;

    try {
      const resposta = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          materia: form.dataset.materia,
          nivel: form.dataset.nivel,
          topico: form.dataset.topico,
          historico
        })
      });
      const dados = await resposta.json();
      carregando.remove();

      if (!resposta.ok) {
        adicionarBalao(dados.erro || 'Não consegui responder agora.', 'erro');
        return;
      }

      adicionarBalao(dados.resposta, 'professor');

      // So entra no historico o que de fato foi trocado com o professor.
      historico.push({ papel: 'aluno', texto: pergunta });
      historico.push({ papel: 'professor', texto: dados.resposta });
      if (historico.length > 12) historico.splice(0, historico.length - 12);

      // O avatar lê a resposta em voz alta, se o som estiver ligado.
      if (window.EducaVoz) {
        window.EducaVoz.falar(dados.resposta, form.dataset.materia);
      }

      const sugestoes = document.getElementById('chat-sugestoes');
      if (sugestoes && Array.isArray(dados.sugestoes)) {
        sugestoes.innerHTML = '';
        dados.sugestoes.forEach((s) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.dataset.sugestao = s;
          b.textContent = s;
          sugestoes.appendChild(b);
        });
      }
    } catch (erro) {
      carregando.remove();
      adicionarBalao('Falha de conexão com o professor de IA.', 'erro');
    }
  }

  if (form && mensagens) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const pergunta = input.value.trim();
      if (!pergunta) return;
      input.value = '';
      perguntar(pergunta);
    });

    const sugestoes = document.getElementById('chat-sugestoes');
    if (sugestoes) {
      sugestoes.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-sugestao]');
        if (btn) perguntar(btn.dataset.sugestao);
      });
    }

    const atalhos = {
      'btn-repetir': 'Explique de novo, por favor.',
      'btn-devagar': 'Pode ir mais devagar nessa parte?',
      'btn-exemplo': 'Me dê outro exemplo desse conteúdo.'
    };
    Object.entries(atalhos).forEach(([id, texto]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => perguntar(texto));
    });
  }

  /* ---------- A aula do tópico ---------- */
  const conteudo = document.getElementById('aula-conteudo');

  // Botão de áudio por seção: só um toca por vez.
  //
  // voz.js dispara 'voz:fim' de forma preventiva sempre que uma nova fala
  // começa — mesmo na primeiríssima vez, antes de qualquer áudio ter tocado —
  // porque tocarAudio() sempre chama parar() antes de iniciar. Por isso não dá
  // para pintar o botão como "tocando" assim que ele é clicado: esse 'voz:fim'
  // preventivo chegaria logo em seguida e apagaria o próprio botão que acabou
  // de começar. Em vez disso, cada clique reserva um "pedido" e só pinta o
  // botão quando 'voz:inicio' confirma que foi ESSE pedido que começou a
  // tocar de fato — 'voz:fim' então só reseta quem estiver confirmado.
  let botaoAudioAtivo = null;
  let pedidoDeAudio = 0;

  function pintarBotaoAudio(botao, tocando) {
    botao.classList.toggle('tocando', tocando);
    botao.setAttribute('aria-pressed', String(tocando));
    botao.innerHTML = tocando
      ? '<span aria-hidden="true">⏸</span> Parar'
      : '<span aria-hidden="true">🔊</span> Ouvir';
  }

  document.addEventListener('voz:fim', () => {
    if (botaoAudioAtivo) {
      pintarBotaoAudio(botaoAudioAtivo, false);
      botaoAudioAtivo = null;
    }
  });

  function botaoDeAudio(texto) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-audio-secao';
    btn.setAttribute('aria-label', 'Ouvir esta seção em voz alta');
    pintarBotaoAudio(btn, false);

    const voz = window.EducaVoz;
    if (!voz || !voz.suportaFala) {
      btn.disabled = true;
      btn.title = 'Este navegador não tem síntese de voz.';
      return btn;
    }

    btn.addEventListener('click', async () => {
      if (botaoAudioAtivo === btn) {
        botaoAudioAtivo = null;
        pintarBotaoAudio(btn, false);
        return voz.parar();
      }

      const meuPedido = ++pedidoDeAudio;
      if (botaoAudioAtivo) pintarBotaoAudio(botaoAudioAtivo, false);
      botaoAudioAtivo = null;

      function aoIniciar() {
        if (meuPedido !== pedidoDeAudio) return; // um pedido mais novo já chegou
        botaoAudioAtivo = btn;
        pintarBotaoAudio(btn, true);
      }
      document.addEventListener('voz:inicio', aoIniciar, { once: true });

      const ok = await voz.falar(texto, conteudo.dataset.materia, true);
      document.removeEventListener('voz:inicio', aoIniciar);
      if (!ok && botaoAudioAtivo === btn) {
        botaoAudioAtivo = null;
        pintarBotaoAudio(btn, false);
      }
    });

    return btn;
  }

  function paragrafos(texto, classe) {
    const frag = document.createDocumentFragment();
    String(texto ?? '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        const el = document.createElement('p');
        if (classe) el.className = classe;
        el.textContent = p;
        frag.appendChild(el);
      });
    return frag;
  }

  // O roteiro vem do modelo, então tudo entra como texto — nunca como HTML.
  function desenharAula(roteiro) {
    conteudo.innerHTML = '';

    conteudo.appendChild(paragrafos(roteiro.abertura, 'aula-abertura'));

    (roteiro.secoes || []).forEach((secao) => {
      const bloco = document.createElement('article');
      bloco.className = 'aula-secao';

      const cabecalho = document.createElement('div');
      cabecalho.className = 'aula-secao-cabecalho';

      const h = document.createElement('h3');
      h.textContent = secao.titulo;
      cabecalho.appendChild(h);

      const textoDaSecao = [secao.titulo, secao.explicacao, secao.exemplo].filter(Boolean).join('. ');
      cabecalho.appendChild(botaoDeAudio(textoDaSecao));

      bloco.appendChild(cabecalho);
      bloco.appendChild(paragrafos(secao.explicacao));

      if (secao.exemplo) {
        const ex = document.createElement('div');
        ex.className = 'aula-exemplo';
        const rotulo = document.createElement('span');
        rotulo.className = 'aula-rotulo';
        rotulo.textContent = 'Exemplo';
        ex.appendChild(rotulo);
        ex.appendChild(paragrafos(secao.exemplo));
        bloco.appendChild(ex);
      }
      conteudo.appendChild(bloco);
    });

    if ((roteiro.exercicios || []).length) {
      const h = document.createElement('h3');
      h.textContent = 'Exercícios';
      conteudo.appendChild(h);

      const ol = document.createElement('ol');
      ol.className = 'aula-exercicios';

      roteiro.exercicios.forEach((exercicio, i) => {
        const li = document.createElement('li');
        li.appendChild(paragrafos(exercicio.enunciado));

        const gabarito = document.createElement('div');
        gabarito.className = 'aula-gabarito';
        gabarito.id = 'gabarito-' + i;
        gabarito.hidden = true;
        gabarito.appendChild(paragrafos(exercicio.gabarito));

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secundario btn-gabarito';
        btn.textContent = 'Ver resposta';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', gabarito.id);
        btn.addEventListener('click', () => {
          const aberto = !gabarito.hidden;
          gabarito.hidden = aberto;
          btn.setAttribute('aria-expanded', String(!aberto));
          btn.textContent = aberto ? 'Ver resposta' : 'Esconder resposta';
        });

        li.appendChild(btn);
        li.appendChild(gabarito);
        ol.appendChild(li);
      });
      conteudo.appendChild(ol);
    }

    conteudo.appendChild(paragrafos(roteiro.fechamento, 'aula-fechamento'));
  }

  function estadoDaAula(texto, classe) {
    conteudo.innerHTML = '';
    const p = document.createElement('p');
    p.className = classe;
    p.textContent = texto;
    conteudo.appendChild(p);
  }

  async function carregarAula(topico) {
    if (!conteudo) return;
    conteudo.dataset.topico = topico;

    // Primeira abertura de um tópico: o professor ainda vai escrever a aula.
    estadoDaAula('Abrindo a aula de "' + topico + '"…', 'aula-carregando');

    try {
      const resposta = await fetch('/api/aula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: conteudo.dataset.materia,
          nivel: conteudo.dataset.nivel,
          topico
        })
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        estadoDaAula(dados.erro || 'Não consegui abrir esta aula.', 'aula-erro');
        return;
      }

      desenharAula(dados.roteiro);

      // O avatar passa a ler a aula de verdade, não mais a ementa.
      const btn = document.getElementById('btn-ouvir');
      if (btn && dados.narracao) btn.dataset.texto = dados.narracao;

      const legendaAula = document.getElementById('legenda-aula');
      if (legendaAula) legendaAula.textContent = topico;

      // O tira-dúvidas passa a responder no contexto do tópico aberto.
      if (form) form.dataset.topico = topico;
    } catch (erro) {
      estadoDaAula('Falha de conexão ao carregar a aula.', 'aula-erro');
    }
  }

  if (conteudo) {
    carregarAula(conteudo.dataset.topico);

    const lista = document.getElementById('lista-topicos');
    if (lista) {
      lista.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-topico]');
        if (!btn || btn.dataset.topico === conteudo.dataset.topico) return;

        lista.querySelectorAll('li').forEach((li) => li.classList.remove('atual'));
        btn.closest('li').classList.add('atual');
        carregarAula(btn.dataset.topico);
      });
    }
  }

  /* ---------- Áudio da sala de aula ---------- */
  const voz = window.EducaVoz;
  const palco = document.getElementById('palco-video');
  const materiaAtual = form ? form.dataset.materia : null;

  // Indicador visual: o avatar "pulsa" enquanto fala.
  document.addEventListener('voz:inicio', () => palco && palco.classList.add('falando'));
  document.addEventListener('voz:fim', () => palco && palco.classList.remove('falando'));

  const aviso = document.getElementById('chat-aviso');
  function mostrarAviso(texto) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.hidden = !texto;
  }

  // Botão de ligar/desligar a voz
  const somBtn = document.getElementById('som-btn');
  if (somBtn && voz) {
    const pintarSom = () => {
      const ligado = voz.somLigado();
      somBtn.setAttribute('aria-pressed', String(ligado));
      somBtn.classList.toggle('mudo', !ligado);
      somBtn.querySelector('.som-icone').textContent = ligado ? '🔊' : '🔇';
      somBtn.querySelector('.som-texto').textContent = ligado ? 'Voz ligada' : 'Voz desligada';
    };
    pintarSom();

    somBtn.addEventListener('click', () => {
      voz.definirSom(!voz.somLigado());
      pintarSom();
    });

    if (!voz.suportaFala) {
      somBtn.disabled = true;
      somBtn.title = 'Este navegador não tem síntese de voz.';
    }
  }

  // Botão "Ouvir a explicação" — fala mesmo com o som desligado (é um pedido explícito).
  const btnOuvir = document.getElementById('btn-ouvir');
  if (btnOuvir && voz) {
    let falando = false;

    // O onstart da síntese pode demorar; o botão troca de estado na hora do
    // clique para que o segundo clique sempre pare, em vez de iniciar outra fala.
    function pintarOuvir() {
      btnOuvir.textContent = falando ? '⏸ Parar' : '▶ Ouvir a explicação';
    }

    document.addEventListener('voz:fim', () => {
      falando = false;
      pintarOuvir();
    });

    btnOuvir.addEventListener('click', async () => {
      if (falando) {
        falando = false;
        pintarOuvir();
        return voz.parar();
      }

      falando = true;
      pintarOuvir();

      const ok = await voz.falar(btnOuvir.dataset.texto, materiaAtual, true);
      if (!ok) {
        falando = false;
        pintarOuvir();
        mostrarAviso('Não consegui reproduzir a voz neste navegador.');
        setTimeout(() => mostrarAviso(''), 4000);
      }
    });

    if (!voz.suportaFala) {
      btnOuvir.disabled = true;
      btnOuvir.title = 'Este navegador não tem síntese de voz.';
    }
  }

  // Pronúncia dos cursos de idioma: cada frase é falada na língua-alvo.
  const blocoPronuncia = document.querySelector('.pronuncia');
  if (blocoPronuncia && voz) {
    const idiomaAlvo = blocoPronuncia.dataset.idioma;

    blocoPronuncia.addEventListener('click', async (e) => {
      const btn = e.target.closest('.frase-btn');
      if (!btn) return;

      blocoPronuncia.querySelectorAll('.frase-btn.falando').forEach((b) =>
        b.classList.remove('falando')
      );
      btn.classList.add('falando');

      // forcar = true: é um clique explícito, toca mesmo com a voz desligada.
      await voz.falar(btn.dataset.frase, materiaAtual, true, idiomaAlvo);
      btn.classList.remove('falando');
    });
  }

  // Microfone: o aluno dita a pergunta
  const btnMic = document.getElementById('btn-mic');
  if (btnMic && voz && form) {
    const entrada = document.getElementById('chat-input');
    let sessao = null;

    if (!voz.suportaMicrofone) {
      btnMic.disabled = true;
      btnMic.title = 'Este navegador não reconhece voz. Use o Chrome ou o Edge.';
    }

    btnMic.addEventListener('click', () => {
      if (sessao) {
        sessao.stop();
        sessao = null;
        return;
      }

      sessao = voz.ouvir(
        (texto) => {
          entrada.value = texto;
        },
        (estado, textoFinal) => {
          btnMic.classList.toggle('gravando', estado === 'ouvindo');

          if (estado === 'ouvindo') mostrarAviso('Ouvindo... fale sua dúvida.');
          if (estado === 'negado') mostrarAviso('Permissão de microfone negada pelo navegador.');
          if (estado === 'erro') mostrarAviso('Não consegui captar o áudio. Tente de novo.');

          if (estado === 'parado') {
            sessao = null;
            mostrarAviso('');
            // Pergunta ditada e reconhecida: envia sozinha.
            if (textoFinal && textoFinal.length > 2) {
              entrada.value = '';
              perguntar(textoFinal);
            }
          }
        }
      );
    });
  }

  /* ---------- Teste de nivelamento (trilha adaptativa) ---------- */
  const formNiv = document.getElementById('form-nivelamento');
  if (formNiv) {
    const range = document.getElementById('niv-acertos');
    const saida = document.getElementById('niv-saida');
    const atualizar = () => (saida.textContent = `${range.value} de 10`);
    range.addEventListener('input', atualizar);
    atualizar();

    formNiv.addEventListener('submit', async (e) => {
      e.preventDefault();
      const materia = document.getElementById('niv-materia').value;

      const resposta = await fetch('/api/nivelamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia, acertos: Number(range.value), total: 10 })
      });
      const dados = await resposta.json();
      if (!resposta.ok) return;

      document.getElementById('res-nivel').textContent = `${dados.materia}: nível ${dados.nivelSugerido}`;
      document.getElementById('res-aproveitamento').textContent = `Aproveitamento: ${dados.aproveitamento}% · professor ${dados.avatar}`;
      document.getElementById('res-justificativa').textContent = dados.justificativa;
      document.getElementById('res-comecar').textContent = `Começar por: ${dados.comecarPor}`;
      const link = document.getElementById('res-link');
      link.href = `/aula/${materia}/${dados.nivelId}`;

      const cartao = document.getElementById('resultado-nivelamento');
      cartao.hidden = false;
      cartao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  /* ---------- App instalavel ---------- */
  // O service worker so cuida de estatico e da tela offline; nenhuma pagina
  // com sessao vai para o cache (ver public/sw.js).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((erro) => {
        console.warn("[pwa] service worker não registrado:", erro.message);
      });
    });
  }

  // O Chrome/Edge guarda o convite de instalacao: seguramos o evento e
  // mostramos nosso proprio botao no cabecalho.
  const btnInstalar = document.getElementById("btn-instalar");
  let convite = null;

  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    convite = evento;
    if (btnInstalar) btnInstalar.hidden = false;
  });

  if (btnInstalar) {
    btnInstalar.addEventListener("click", async () => {
      if (!convite) return;
      convite.prompt();
      await convite.userChoice;
      convite = null;
      btnInstalar.hidden = true;
    });
  }

  window.addEventListener("appinstalled", () => {
    convite = null;
    if (btnInstalar) btnInstalar.hidden = true;
  });
})();
