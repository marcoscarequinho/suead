// Gera todos os icones da marca a partir de uma unica descricao geometrica:
// icones do PWA, apple-touch-icon e o favicon (.ico + .svg).
//
//   npm run icones
//
// Sem dependencia externa: desenha com supersampling e grava PNG/ICO usando
// o zlib do proprio Node. O desenho vive aqui para que os binarios commitados
// nunca fiquem sem fonte.

import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

/* ---------------- Marca ---------------- */

// Gradiente da folha de estilo: --primary -> --secondary.
const GRADIENTE = { de: [0x4f, 0x46, 0xe5], para: [0x06, 0xb6, 0xd4] };

const dentroTriangulo = (px, py, [ax, ay], [bx, by], [cx, cy]) => {
  const d = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  const s = ((bx - ax) * (py - ay) - (px - ax) * (by - ay)) / d;
  const t = ((px - ax) * (cy - ay) - (cx - ax) * (py - ay)) / d;
  return s >= 0 && t >= 0 && s + t <= 1;
};
const dentroCirculo = (px, py, cx, cy, r) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
const dentroRet = (px, py, x0, y0, x1, y1) => px >= x0 && px <= x1 && py >= y0 && py <= y1;

/** Silhueta do foguete, centrada em (0.5, 0.5) e escalada por `k`. */
function noFoguete(px, py, k, comJanela) {
  const x = (px - 0.5) / k + 0.5;
  const y = (py - 0.5) / k + 0.5;

  const bico   = dentroTriangulo(x, y, [0.5, 0.14], [0.372, 0.45], [0.628, 0.45]);
  const corpo  = dentroRet(x, y, 0.372, 0.44, 0.628, 0.70);
  const base   = dentroCirculo(x, y, 0.5, 0.70, 0.128);
  const finEsq = dentroTriangulo(x, y, [0.378, 0.55], [0.378, 0.79], [0.255, 0.83]);
  const finDir = dentroTriangulo(x, y, [0.622, 0.55], [0.622, 0.79], [0.745, 0.83]);
  const janela = comJanela && dentroCirculo(x, y, 0.5, 0.435, 0.072);

  return (bico || corpo || base || finEsq || finDir) && !janela;
}

/** Cantos arredondados do cartao (raio em fracao do lado). */
function noCartao(px, py, raio) {
  if (raio <= 0) return true;
  const dx = Math.min(px, 1 - px);
  const dy = Math.min(py, 1 - py);
  if (dx >= raio || dy >= raio) return true;
  return (raio - dx) ** 2 + (raio - dy) ** 2 <= raio * raio;
}

const misturar = (a, b, t) => a + (b - a) * t;

function desenhar(tamanho, { raio, escala, janela = true, aa = 4 }) {
  const rgba = Buffer.alloc(tamanho * tamanho * 4);
  const { de, para } = GRADIENTE;

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      let r = 0, g = 0, b = 0, cobertos = 0;

      for (let sy = 0; sy < aa; sy++) {
        for (let sx = 0; sx < aa; sx++) {
          const px = (x + (sx + 0.5) / aa) / tamanho;
          const py = (y + (sy + 0.5) / aa) / tamanho;
          if (!noCartao(px, py, raio)) continue;

          const t = Math.min(1, Math.max(0, (px + py) / 2));
          let cr = misturar(de[0], para[0], t);
          let cg = misturar(de[1], para[1], t);
          let cb = misturar(de[2], para[2], t);
          if (noFoguete(px, py, escala, janela)) { cr = 255; cg = 255; cb = 255; }

          r += cr; g += cg; b += cb; cobertos++;
        }
      }

      const i = (y * tamanho + x) * 4;
      if (cobertos) {
        rgba[i]     = Math.round(r / cobertos);
        rgba[i + 1] = Math.round(g / cobertos);
        rgba[i + 2] = Math.round(b / cobertos);
        rgba[i + 3] = Math.round((cobertos / (aa * aa)) * 255);
      }
    }
  }
  return rgba;
}

/* ---------------- PNG ---------------- */

const CRC = (() => {
  const tabela = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (const b of buf) c = tabela[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(tipo, dados) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(corpo));
  return Buffer.concat([len, corpo, crc]);
}

function png(tamanho, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8;  // bits por canal
  ihdr[9] = 6;  // RGBA
  const linhas = Buffer.alloc(tamanho * (1 + tamanho * 4));
  for (let y = 0; y < tamanho; y++) {
    const destino = y * (1 + tamanho * 4);
    linhas[destino] = 0; // filtro none
    rgba.copy(linhas, destino + 1, y * tamanho * 4, (y + 1) * tamanho * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- ICO ---------------- */

// Container simples com PNGs embutidos — aceito por todos os navegadores atuais.
function ico(imagens) {
  const cabecalho = Buffer.alloc(6);
  cabecalho.writeUInt16LE(0, 0);              // reservado
  cabecalho.writeUInt16LE(1, 2);              // tipo: icone
  cabecalho.writeUInt16LE(imagens.length, 4);

  let deslocamento = 6 + imagens.length * 16;
  const entradas = [];
  for (const { tamanho, dados } of imagens) {
    const e = Buffer.alloc(16);
    e[0] = tamanho >= 256 ? 0 : tamanho;      // largura
    e[1] = tamanho >= 256 ? 0 : tamanho;      // altura
    e[2] = 0;                                 // paleta
    e[3] = 0;                                 // reservado
    e.writeUInt16LE(1, 4);                    // planos
    e.writeUInt16LE(32, 6);                   // bits por pixel
    e.writeUInt32LE(dados.length, 8);
    e.writeUInt32LE(deslocamento, 12);
    deslocamento += dados.length;
    entradas.push(e);
  }
  return Buffer.concat([cabecalho, ...entradas, ...imagens.map((i) => i.dados)]);
}

/* ---------------- SVG ---------------- */

// Mesma geometria dos PNGs, em viewBox 0..100, para o favicon vetorial.
// O gradiente usa userSpaceOnUse para que a janela do foguete caia exatamente
// sobre a mesma cor do fundo.
const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="EducaAI">',
  '  <defs>',
  '    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">',
  '      <stop offset="0" stop-color="#4f46e5"/>',
  '      <stop offset="1" stop-color="#06b6d4"/>',
  '    </linearGradient>',
  '  </defs>',
  '  <rect width="100" height="100" rx="22" fill="url(#g)"/>',
  '  <g fill="#fff">',
  '    <path d="M50 14 37.2 45h25.6z"/>',
  '    <path d="M37.2 44h25.6v26a12.8 12.8 0 0 1-25.6 0z"/>',
  '    <path d="M37.8 55v24l-12.3 4z"/>',
  '    <path d="M62.2 55v24l12.3 4z"/>',
  '  </g>',
  '  <circle cx="50" cy="43.5" r="7.2" fill="url(#g)"/>',
  '</svg>',
  ''
].join('\n');

/* ---------------- Saida ---------------- */

const alvos = [
  // PWA — cantos arredondados
  ['public/icons/icone-192.png',          192, { raio: 0.22, escala: 0.86 }],
  ['public/icons/icone-512.png',          512, { raio: 0.22, escala: 0.86 }],
  // maskable — sangria total, foguete dentro da zona segura
  ['public/icons/icone-maskable-512.png', 512, { raio: 0,    escala: 0.62 }],
  // iOS aplica a propria mascara
  ['public/icons/apple-touch-icon.png',   180, { raio: 0,    escala: 0.80 }],
  // favicon em PNG, para quem prefere ao .ico
  ['public/icons/favicon-32.png',          32, { raio: 0.18, escala: 0.98 }],
  ['public/icons/favicon-16.png',          16, { raio: 0.14, escala: 1.0, janela: false, aa: 8 }]
];

for (const [arquivo, tamanho, opcoes] of alvos) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const buf = png(tamanho, desenhar(tamanho, opcoes));
  fs.writeFileSync(arquivo, buf);
  console.log(`${arquivo.padEnd(38)} ${String(tamanho).padStart(3)}px  ${(buf.length / 1024).toFixed(1)} KB`);
}

// favicon.ico: 16, 32 e 48 no mesmo arquivo.
// No 16 a janela do foguete viraria um borrao de 2px, entao ela sai.
const dentroDoIco = [
  { tamanho: 16, dados: png(16, desenhar(16, { raio: 0.14, escala: 1.0, janela: false, aa: 8 })) },
  { tamanho: 32, dados: png(32, desenhar(32, { raio: 0.18, escala: 0.98 })) },
  { tamanho: 48, dados: png(48, desenhar(48, { raio: 0.20, escala: 0.94 })) }
];
const icoBuf = ico(dentroDoIco);
fs.writeFileSync('public/favicon.ico', icoBuf);
console.log(`${'public/favicon.ico'.padEnd(38)} 16/32/48  ${(icoBuf.length / 1024).toFixed(1)} KB`);

fs.writeFileSync('public/icons/icone.svg', svg);
console.log(`${'public/icons/icone.svg'.padEnd(38)} vetor     ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
