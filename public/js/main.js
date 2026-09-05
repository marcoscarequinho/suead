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
          topico: form.dataset.topico
        })
      });
      const dados = await resposta.json();
      carregando.remove();

      if (!resposta.ok) {
        adicionarBalao(dados.erro || 'Não consegui responder agora.', 'erro');
        return;
      }

      adicionarBalao(dados.resposta, 'professor');

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
