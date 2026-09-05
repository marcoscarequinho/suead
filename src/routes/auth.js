// Cadastro, login e logout de alunos.

import { Router } from 'express';
import { criarAluno, autenticar, normalizarEmail } from '../repositories/alunos.js';
import { validarSenha, validarEmail } from '../services/senha.js';
import { apenasVisitante } from '../middleware/auth.js';

const router = Router();

/** Grava o id na sessao e regenera o cookie (evita fixacao de sessao). */
function entrar(req, aluno) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) return reject(erro);
      req.session.alunoId = aluno.id;
      req.session.save((erroSalvar) => (erroSalvar ? reject(erroSalvar) : resolve()));
    });
  });
}

/* ---------------- Cadastro ---------------- */

router.get('/cadastro', apenasVisitante, (req, res) => {
  res.render('cadastro', {
    titulo: 'Criar conta — EducaAI',
    descricao: 'Crie sua conta gratuita e comece pelo teste de nivelamento.',
    pagina: 'cadastro',
    erros: [],
    valores: {}
  });
});

router.post('/cadastro', apenasVisitante, async (req, res, next) => {
  const nome = String(req.body.nome ?? '').trim();
  const email = normalizarEmail(req.body.email);
  const senha = String(req.body.senha ?? '');
  const confirmacao = String(req.body.confirmacao ?? '');

  const erros = [];
  if (nome.length < 2) erros.push('Informe seu nome.');
  if (!validarEmail(email)) erros.push('Informe um e-mail válido.');
  const erroSenha = validarSenha(senha);
  if (erroSenha) erros.push(erroSenha);
  if (senha !== confirmacao) erros.push('As senhas não conferem.');

  if (erros.length) {
    return res.status(400).render('cadastro', {
      titulo: 'Criar conta — EducaAI',
      descricao: 'Crie sua conta gratuita e comece pelo teste de nivelamento.',
      pagina: 'cadastro',
      erros,
      valores: { nome, email }
    });
  }

  try {
    const aluno = await criarAluno({ nome, email, senha });
    await entrar(req, aluno);
    res.redirect('/painel');
  } catch (erro) {
    if (erro.codigo === 'EMAIL_EM_USO') {
      return res.status(409).render('cadastro', {
        titulo: 'Criar conta — EducaAI',
        descricao: 'Crie sua conta gratuita e comece pelo teste de nivelamento.',
        pagina: 'cadastro',
        erros: [erro.message],
        valores: { nome, email }
      });
    }
    next(erro);
  }
});

/* ---------------- Login ---------------- */

router.get('/login', apenasVisitante, (req, res) => {
  res.render('login', {
    titulo: 'Entrar — EducaAI',
    descricao: 'Acesse sua conta EducaAI.',
    pagina: 'login',
    erros: [],
    valores: {}
  });
});

router.post('/login', apenasVisitante, async (req, res, next) => {
  const email = normalizarEmail(req.body.email);
  const senha = String(req.body.senha ?? '');

  try {
    const aluno = await autenticar({ email, senha });

    if (!aluno) {
      // Mensagem genérica: não revela se o e-mail existe.
      return res.status(401).render('login', {
        titulo: 'Entrar — EducaAI',
        descricao: 'Acesse sua conta EducaAI.',
        pagina: 'login',
        erros: ['E-mail ou senha incorretos.'],
        valores: { email }
      });
    }

    const destino = req.session.destino;
    await entrar(req, aluno);
    res.redirect(destino && destino.startsWith('/') ? destino : '/painel');
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Logout ---------------- */

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('educaai.sid');
    res.redirect('/');
  });
});

export default router;
