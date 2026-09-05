// Middlewares de autenticacao.

import { buscarPorId } from '../repositories/alunos.js';

/**
 * Carrega o aluno da sessao e deixa disponivel em req.aluno e res.locals.aluno
 * (para todas as views, inclusive o cabecalho).
 */
export async function carregarAluno(req, res, next) {
  res.locals.aluno = null;
  req.aluno = null;

  const id = req.session?.alunoId;
  if (!id) return next();

  try {
    const aluno = await buscarPorId(id);
    if (aluno) {
      req.aluno = aluno;
      res.locals.aluno = aluno;
    } else {
      // Conta removida: derruba a sessão órfã.
      req.session.destroy(() => {});
    }
  } catch (erro) {
    console.error('[auth] falha ao carregar aluno:', erro.message);
  }
  next();
}

/** Bloqueia paginas privadas; guarda o destino para voltar depois do login. */
export function exigirLogin(req, res, next) {
  if (req.aluno) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  req.session.destino = req.originalUrl;
  res.redirect('/login');
}

/** Impede que quem ja esta logado veja as telas de login/cadastro. */
export function apenasVisitante(req, res, next) {
  if (req.aluno) return res.redirect('/painel');
  next();
}
