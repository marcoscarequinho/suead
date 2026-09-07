// Forum de interacao entre alunos. So para quem esta logado (ler e escrever).

import { Router } from 'express';
import { exigirLogin } from '../middleware/auth.js';
import {
  listarTopicos, buscarTopico, criarTopico, criarResposta, excluirTopico, excluirResposta
} from '../repositories/forum.js';

const router = Router();

router.get('/forum', exigirLogin, async (req, res, next) => {
  try {
    const topicos = await listarTopicos();
    res.render('forum', {
      titulo: 'Fórum — EducaAI',
      descricao: 'Converse com outros alunos, tire dúvidas e compartilhe dicas de estudo.',
      pagina: 'forum',
      topicos
    });
  } catch (erro) {
    next(erro);
  }
});

router.post('/forum', exigirLogin, async (req, res, next) => {
  try {
    const titulo = String(req.body.titulo ?? '').trim();
    const corpo = String(req.body.corpo ?? '').trim();
    if (!titulo || !corpo) return res.redirect('/forum');

    const topico = await criarTopico({ alunoId: req.aluno.id, titulo, corpo });
    res.redirect(`/forum/${topico.id}`);
  } catch (erro) {
    next(erro);
  }
});

router.get('/forum/:id', exigirLogin, async (req, res, next) => {
  try {
    const topico = await buscarTopico(req.params.id);
    if (!topico) return next();
    res.render('forum-topico', {
      titulo: `${topico.titulo} — Fórum EducaAI`,
      descricao: topico.corpo.slice(0, 150),
      pagina: 'forum',
      topico
    });
  } catch (erro) {
    next(erro);
  }
});

router.post('/forum/:id/respostas', exigirLogin, async (req, res, next) => {
  try {
    const corpo = String(req.body.corpo ?? '').trim();
    if (corpo) {
      await criarResposta({ topicoId: req.params.id, alunoId: req.aluno.id, corpo });
    }
    res.redirect(`/forum/${req.params.id}`);
  } catch (erro) {
    next(erro);
  }
});

router.post('/forum/:id/excluir', exigirLogin, async (req, res, next) => {
  try {
    if (req.aluno.tipo === 'admin') await excluirTopico(req.params.id);
    res.redirect('/forum');
  } catch (erro) {
    next(erro);
  }
});

router.post('/forum/:id/respostas/:respostaId/excluir', exigirLogin, async (req, res, next) => {
  try {
    if (req.aluno.tipo === 'admin') await excluirResposta(req.params.respostaId);
    res.redirect(`/forum/${req.params.id}`);
  } catch (erro) {
    next(erro);
  }
});

export default router;
