/* EducaAI — voz dos avatares
 *
 * Dois lados:
 *   falar()   — o professor lê a explicação em voz alta
 *   ouvir()   — o aluno faz a pergunta falando
 *
 * A síntese sai do endpoint /api/voz. Sem chave de TTS no servidor, ele devolve
 * o texto + preset e quem fala é a Web Speech API do navegador; com chave, devolve
 * o áudio pronto e este arquivo apenas toca. O resto da interface não muda.
 */

window.EducaVoz = (function () {
  'use strict';

  const sintese = window.speechSynthesis || null;
  const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const CHAVE = 'educaai:som';
  let vozes = [];
  let tocando = null; // Audio() em uso, quando o áudio vem do provedor

  /* ---------- Preferência de som (por navegador) ---------- */

  function somLigado() {
    try {
      return localStorage.getItem(CHAVE) !== 'off';
    } catch (e) {
      return true;
    }
  }

  function definirSom(ligado) {
    try {
      localStorage.setItem(CHAVE, ligado ? 'on' : 'off');
    } catch (e) {
      /* modo privado: segue sem lembrar */
    }
    if (!ligado) parar();
  }

  /* ---------- Vozes do navegador ---------- */

  function carregarVozes() {
    if (!sintese) return;
    vozes = sintese.getVoices();
  }

  if (sintese) {
    carregarVozes();
    sintese.addEventListener('voiceschanged', carregarVozes);
  }

  function melhorVoz(lang) {
    if (!vozes.length) carregarVozes();
    const idioma = (lang || 'pt-BR').toLowerCase();
    return (
      vozes.find((v) => v.lang.toLowerCase() === idioma && v.localService) ||
      vozes.find((v) => v.lang.toLowerCase() === idioma) ||
      vozes.find((v) => v.lang.toLowerCase().startsWith(idioma.slice(0, 2))) ||
      null
    );
  }

  const suportaFala = Boolean(sintese);
  const suportaMicrofone = Boolean(Reconhecimento);

  /* ---------- Falar ---------- */

  function parar() {
    if (sintese) sintese.cancel();
    if (tocando) {
      tocando.pause();
      tocando = null;
    }
    document.dispatchEvent(new CustomEvent('voz:fim'));
  }

  function falarNoNavegador(texto, preset) {
    return new Promise(function (resolve) {
      if (!sintese) return resolve(false);

      sintese.cancel();
      const fala = new SpeechSynthesisUtterance(texto);
      const voz = melhorVoz(preset && preset.lang);
      if (voz) fala.voice = voz;
      fala.lang = (preset && preset.lang) || 'pt-BR';
      fala.rate = (preset && preset.rate) || 1;
      fala.pitch = (preset && preset.pitch) || 1;

      fala.onstart = function () {
        document.dispatchEvent(new CustomEvent('voz:inicio'));
      };
      fala.onend = function () {
        document.dispatchEvent(new CustomEvent('voz:fim'));
        resolve(true);
      };
      fala.onerror = function () {
        document.dispatchEvent(new CustomEvent('voz:fim'));
        resolve(false);
      };

      sintese.speak(fala);
    });
  }

  function tocarAudio(base64, mime) {
    return new Promise(function (resolve) {
      parar();
      tocando = new Audio('data:' + (mime || 'audio/mpeg') + ';base64,' + base64);
      document.dispatchEvent(new CustomEvent('voz:inicio'));
      tocando.onended = function () {
        tocando = null;
        document.dispatchEvent(new CustomEvent('voz:fim'));
        resolve(true);
      };
      tocando.onerror = function () {
        tocando = null;
        document.dispatchEvent(new CustomEvent('voz:fim'));
        resolve(false);
      };
      tocando.play().catch(function () {
        resolve(false);
      });
    });
  }

  /**
   * Fala um texto com a voz do professor da matéria.
   * Respeita a preferência do aluno, a menos que forcar = true.
   */
  async function falar(texto, materia, forcar, idioma) {
    if (!texto) return false;
    if (!forcar && !somLigado()) return false;

    try {
      const resposta = await fetch('/api/voz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto, materia: materia || null, idioma: idioma || null })
      });
      if (!resposta.ok) return false;

      const dados = await resposta.json();
      if (dados.modo === 'produção' && dados.audio) {
        return tocarAudio(dados.audio, dados.mime);
      }
      return falarNoNavegador(dados.texto, dados.preset);
    } catch (erro) {
      return false;
    }
  }

  /* ---------- Ouvir (microfone) ---------- */

  function ouvir(aoTexto, aoEstado) {
    if (!Reconhecimento) return null;

    const rec = new Reconhecimento();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let ultimo = '';

    rec.onstart = function () {
      if (aoEstado) aoEstado('ouvindo');
    };
    rec.onresult = function (evento) {
      let texto = '';
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        texto += evento.results[i][0].transcript;
      }
      ultimo = texto.trim();
      if (aoTexto) aoTexto(ultimo, evento.results[evento.results.length - 1].isFinal);
    };
    rec.onerror = function (evento) {
      if (aoEstado) aoEstado(evento.error === 'not-allowed' ? 'negado' : 'erro');
    };
    rec.onend = function () {
      if (aoEstado) aoEstado('parado', ultimo);
    };

    // Falar e ouvir ao mesmo tempo faz o microfone captar o próprio avatar.
    parar();
    rec.start();
    return rec;
  }

  return {
    falar: falar,
    parar: parar,
    ouvir: ouvir,
    somLigado: somLigado,
    definirSom: definirSom,
    suportaFala: suportaFala,
    suportaMicrofone: suportaMicrofone
  };
})();
