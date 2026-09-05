// Camada de voz dos professores avatares.
//
// Sem chave de TTS configurada, o servidor devolve o texto com um preset de voz
// e quem sintetiza e o proprio navegador (Web Speech API) — funciona de imediato,
// sem custo e sem latencia de rede.
//
// Com TTS_API_KEY definida, o mesmo endpoint passa a devolver o audio pronto do
// provedor escolhido (ElevenLabs, Azure, Google, OpenAI...), e o cliente so toca.

const TTS_API_KEY = process.env.TTS_API_KEY ?? '';
const TTS_PROVIDER = process.env.TTS_PROVIDER ?? '';

export const vozConfigurada = Boolean(TTS_API_KEY);
export const modoVoz = vozConfigurada ? 'produção' : 'navegador';

// Cada professor tem um timbre proprio para o aluno reconhecer quem esta falando.
// rate/pitch valem para a voz do navegador; voiceId, para o provedor externo.
const PRESETS = {
  matematica: { nome: 'Prof. Ada', lang: 'pt-BR', rate: 1.0, pitch: 1.1, voiceId: '' },
  historia: { nome: 'Prof. Marcos', lang: 'pt-BR', rate: 0.95, pitch: 0.85, voiceId: '' },
  geografia: { nome: 'Prof. Íris', lang: 'pt-BR', rate: 1.05, pitch: 1.05, voiceId: '' },
  portugues: { nome: 'Prof. Clarice', lang: 'pt-BR', rate: 0.98, pitch: 1.15, voiceId: '' },
  fisica: { nome: 'Prof. Lattes', lang: 'pt-BR', rate: 0.92, pitch: 0.95, voiceId: '' },
  quimica: { nome: 'Prof. Marie', lang: 'pt-BR', rate: 1.02, pitch: 1.2, voiceId: '' },
  estatistica: { nome: 'Prof. Florence', lang: 'pt-BR', rate: 0.97, pitch: 1.0, voiceId: '' },
  // Nos cursos de idioma o professor EXPLICA em português; só os exemplos
  // são pronunciados na língua-alvo (parâmetro `idioma` de /api/voz).
  ingles: { nome: 'Prof. Emily', lang: 'pt-BR', rate: 1.0, pitch: 1.12, voiceId: '' },
  espanhol: { nome: 'Prof. Lucía', lang: 'pt-BR', rate: 1.0, pitch: 1.08, voiceId: '' },
  'mecanica-automotiva': { nome: 'Prof. Bento', lang: 'pt-BR', rate: 0.94, pitch: 0.8, voiceId: '' },
  'eletricidade-automotiva': { nome: 'Prof. Nikola', lang: 'pt-BR', rate: 0.96, pitch: 0.9, voiceId: '' },
  'ar-condicionado-automotivo': { nome: 'Prof. Carrier', lang: 'pt-BR', rate: 0.95, pitch: 0.88, voiceId: '' }
};

const PADRAO = { nome: 'Professor de IA', lang: 'pt-BR', rate: 1, pitch: 1, voiceId: '' };

export function presetDaMateria(materiaSlug) {
  return PRESETS[materiaSlug] ?? PADRAO;
}

/**
 * Prepara o texto para ser falado: tira marcacao, expande simbolos que a voz
 * leria errado e limita o tamanho.
 *
 * As expansoes por extenso valem so para o portugues — uma frase em ingles ou
 * espanhol e falada como esta escrita.
 */
export function prepararTexto(texto, lang = 'pt-BR') {
  let saida = String(texto ?? '')
    .replace(/[*_`#]/g, '')
    .replace(/\s*—\s*/g, ', ');

  if (lang.toLowerCase().startsWith('pt')) {
    saida = saida
      .replace(/(\d+)\s*%/g, '$1 por cento')
      .replace(/\bR\$\s*([\d.,]*\d)/g, '$1 reais')
      .replace(/\bIA\b/g, 'I A')
      .replace(/\bEAD\b/g, 'E A D')
      .replace(/\b24\/7\b/g, 'vinte e quatro horas por dia')
      // Siglas dos cursos técnicos, que a voz leria como palavra.
      .replace(/\bOBD-?II\b/gi, 'O B D dois')
      .replace(/\bABS\b/g, 'A B S')
      .replace(/\b3D\b/g, 'três D')
      .replace(/\bA\/C\b/g, 'A C');
  }

  return saida.replace(/\s{2,}/g, ' ').trim().slice(0, 2000);
}

/**
 * Devolve o que o cliente precisa para falar.
 * modo 'navegador' -> texto + preset;  modo 'produção' -> audio do provedor.
 */
export async function sintetizar({ texto, materiaSlug, idioma }) {
  const base = presetDaMateria(materiaSlug);

  // `idioma` troca a língua da fala sem trocar o professor: é assim que o
  // avatar de Inglês/Espanhol pronuncia os exemplos na língua-alvo.
  const preset = idioma ? { ...base, lang: idioma } : base;
  const limpo = prepararTexto(texto, preset.lang);

  if (!limpo) {
    const erro = new Error('Nada para falar.');
    erro.codigo = 'TEXTO_VAZIO';
    throw erro;
  }

  if (!vozConfigurada) {
    return { modo: 'navegador', texto: limpo, preset };
  }

  // Ponto de troca para o provedor real. Exemplo (ElevenLabs):
  //
  // const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${preset.voiceId}`, {
  //   method: 'POST',
  //   headers: { 'xi-api-key': TTS_API_KEY, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text: limpo, model_id: 'eleven_multilingual_v2' })
  // });
  // const audio = Buffer.from(await r.arrayBuffer()).toString('base64');
  // return { modo: 'produção', preset, audio, mime: 'audio/mpeg' };

  throw new Error(`Provedor de TTS "${TTS_PROVIDER || 'não definido'}" ainda não implementado.`);
}
