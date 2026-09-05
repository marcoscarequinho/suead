import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import paginas from './src/routes/pages.js';
import api from './src/routes/api.js';
import autenticacao from './src/routes/auth.js';
import pagamento from './src/routes/pagamento.js';
import { pool, temBanco, verificarConexao } from './src/db/pool.js';
import { carregarConteudo, origemDados } from './src/repositories/conteudo.js';
import { carregarAluno } from './src/middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const producao = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (producao) app.set('trust proxy', 1);

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: producao ? '7d' : 0
  })
);

// ---------- Sessão ----------
// Guardada no Postgres quando há banco; em memória apenas no desenvolvimento local.
const PgSession = connectPgSimple(session);

app.use(
  session({
    name: 'educaai.sid',
    secret: process.env.SESSION_SECRET || 'chave-insegura-apenas-para-desenvolvimento',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: temBanco
      ? new PgSession({ pool, tableName: 'sessoes', createTableIfMissing: true })
      : undefined,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: producao,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 dias
    }
  })
);

app.use(carregarAluno);

// ---------- Rotas ----------
app.use('/api', api);
app.use('/', autenticacao);
app.use('/', pagamento);
app.use('/', paginas);

// 404
app.use((req, res) => {
  res.status(404);
  if (req.path.startsWith('/api/')) return res.json({ erro: 'Rota não encontrada.' });
  res.render('404', {
    titulo: 'Página não encontrada — EducaAI',
    descricao: 'A página que você procura não existe.',
    pagina: ''
  });
});

// Erro
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500);
  if (req.path.startsWith('/api/')) return res.json({ erro: 'Erro interno.' });
  res.send('Erro interno do servidor.');
});

// ---------- Boot ----------
const banco = await verificarConexao();
if (banco.ok) {
  console.log(`[db] conectado — ${banco.versao}`);
} else {
  console.warn(`[db] indisponível (${banco.motivo}) — usando conteúdo dos arquivos de src/data`);
}

await carregarConteudo();
console.log(`[conteúdo] origem: ${origemDados()}`);

// Na Vercel a aplicação roda como função serverless (ver api/index.js).
// Localmente sobe o servidor HTTP normalmente.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`EducaAI rodando em http://localhost:${PORT}`);
  });
}

export default app;
