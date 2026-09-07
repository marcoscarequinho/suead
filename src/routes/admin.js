// Area do admin: alunos, planos, isencoes, solicitacoes de troca e chat de suporte.
// Toda rota aqui exige tipo === 'admin' (ver exigirAdmin).

import { Router } from 'express';
import { exigirAdmin } from '../middleware/auth.js';
import { listarMaterias, carregarConteudo } from '../repositories/conteudo.js';
import { listarAlunos, buscarPorId } from '../repositories/alunos.js';
import { historicoDoAluno, atualizarMateriaEscolhida } from '../repositories/assinaturas.js';
import {
  listarIsencoesDoAluno, concederIsencao, revogarIsencao
} from '../repositories/isencoes.js';
import {
  listarPendentes, buscarPorId as buscarSolicitacaoPorId, responderSolicitacao
} from '../repositories/solicitacoesTroca.js';
import { listarPlanosAdmin, buscarPlanoAdmin, atualizarPlano } from '../repositories/planosAdmin.js';
import {
  listarConversas, buscarConversa, mensagensDaConversa, enviarMensagem, marcarLidas
} from '../repositories/suporte.js';
import { resumoAdmin, assinaturasAtivasPorPlano } from '../repositories/adminStats.js';

const router = Router();
router.use(exigirAdmin);

/* ---------------- Dashboard ---------------- */

router.get('/', async (req, res, next) => {
  try {
    const [resumo, porPlano, solicitacoes, conversas] = await Promise.all([
      resumoAdmin(),
      assinaturasAtivasPorPlano(),
      listarPendentes(),
      listarConversas()
    ]);

    res.render('admin/dashboard', {
      titulo: 'Painel admin — EducaAI',
      descricao: 'Visão geral de alunos, assinaturas e suporte.',
      pagina: 'admin',
      resumo,
      porPlano,
      solicitacoes: solicitacoes.slice(0, 5),
      conversas: conversas.slice(0, 5)
    });
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Alunos ---------------- */

router.get('/alunos', async (req, res, next) => {
  try {
    const alunos = await listarAlunos({ busca: req.query.busca });
    res.render('admin/alunos', {
      titulo: 'Alunos — Painel admin',
      descricao: 'Gerencie alunos, planos e isenções.',
      pagina: 'admin',
      alunos,
      busca: req.query.busca ?? ''
    });
  } catch (erro) {
    next(erro);
  }
});

router.get('/alunos/:id', async (req, res, next) => {
  try {
    const aluno = await buscarPorId(req.params.id);
    if (!aluno || aluno.tipo === 'admin') return res.redirect('/admin/alunos');

    const [historico, isencoes, materias] = await Promise.all([
      historicoDoAluno(aluno.id, 10),
      listarIsencoesDoAluno(aluno.id),
      listarMaterias()
    ]);

    res.render('admin/aluno-detalhe', {
      titulo: `${aluno.nome || aluno.email} — Painel admin`,
      descricao: 'Detalhe do aluno.',
      pagina: 'admin',
      aluno,
      historico,
      isencoes,
      isencaoAtiva: isencoes.find((i) => i.ativa) ?? null,
      materias
    });
  } catch (erro) {
    next(erro);
  }
});

router.post('/alunos/:id/isencao', async (req, res, next) => {
  try {
    const escopo = req.body.escopo === 'materia' ? 'materia' : 'total';
    await concederIsencao({
      alunoId: req.params.id,
      escopo,
      materiaSlug: escopo === 'materia' ? req.body.materia : null,
      motivo: req.body.motivo,
      concedidaPor: req.aluno.id
    });
    res.redirect(`/admin/alunos/${req.params.id}`);
  } catch (erro) {
    next(erro);
  }
});

router.post('/alunos/:id/isencao/:isencaoId/revogar', async (req, res, next) => {
  try {
    await revogarIsencao(req.params.isencaoId);
    res.redirect(`/admin/alunos/${req.params.id}`);
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Planos ---------------- */

router.get('/planos', async (req, res, next) => {
  try {
    const planos = await listarPlanosAdmin();
    res.render('admin/planos', {
      titulo: 'Planos — Painel admin',
      descricao: 'Edite nome, preço e benefícios dos planos.',
      pagina: 'admin',
      planos
    });
  } catch (erro) {
    next(erro);
  }
});

router.post('/planos/:codigo', async (req, res, next) => {
  try {
    const beneficios = String(req.body.beneficios ?? '')
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean);

    await atualizarPlano(req.params.codigo, {
      nome: req.body.nome,
      preco: Number(String(req.body.preco).replace(',', '.')) || 0,
      chamada: req.body.chamada,
      beneficios,
      destaque: req.body.destaque === 'on',
      selo: req.body.selo
    });

    await carregarConteudo(); // recarrega o cache lido pela home e pelo checkout
    res.redirect('/admin/planos');
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Solicitações de troca de matéria ---------------- */

router.get('/solicitacoes', async (req, res, next) => {
  try {
    const solicitacoes = await listarPendentes();
    res.render('admin/solicitacoes', {
      titulo: 'Solicitações de troca — Painel admin',
      descricao: 'Pedidos de troca da matéria liberada pelo plano Por Matéria.',
      pagina: 'admin',
      solicitacoes
    });
  } catch (erro) {
    next(erro);
  }
});

router.post('/solicitacoes/:id/aprovar', async (req, res, next) => {
  try {
    const solicitacao = await buscarSolicitacaoPorId(req.params.id);
    if (solicitacao && solicitacao.assinatura_id) {
      await atualizarMateriaEscolhida(solicitacao.assinatura_id, solicitacao.materia_solicitada);
    }
    await responderSolicitacao(req.params.id, { status: 'aprovada', respostaAdmin: req.body.resposta });
    res.redirect('/admin/solicitacoes');
  } catch (erro) {
    next(erro);
  }
});

router.post('/solicitacoes/:id/recusar', async (req, res, next) => {
  try {
    await responderSolicitacao(req.params.id, { status: 'recusada', respostaAdmin: req.body.resposta });
    res.redirect('/admin/solicitacoes');
  } catch (erro) {
    next(erro);
  }
});

/* ---------------- Chat de suporte ---------------- */

router.get('/chat', async (req, res, next) => {
  try {
    const conversas = await listarConversas();
    res.render('admin/chat', {
      titulo: 'Chat de suporte — Painel admin',
      descricao: 'Converse diretamente com os alunos.',
      pagina: 'admin',
      conversas
    });
  } catch (erro) {
    next(erro);
  }
});

router.get('/chat/:id', async (req, res, next) => {
  try {
    const conversa = await buscarConversa(req.params.id);
    if (!conversa) return res.redirect('/admin/chat');
    const mensagens = await mensagensDaConversa(conversa.id);
    await marcarLidas(conversa.id, 'admin');

    res.render('admin/chat-thread', {
      titulo: `Conversa com ${conversa.aluno_nome || conversa.aluno_email} — Painel admin`,
      descricao: 'Conversa de suporte.',
      pagina: 'admin',
      conversa,
      mensagens
    });
  } catch (erro) {
    next(erro);
  }
});

// Usado tanto pelo carregamento inicial quanto pelo polling da view.
router.get('/chat/:id/mensagens', async (req, res, next) => {
  try {
    const mensagens = await mensagensDaConversa(req.params.id);
    await marcarLidas(req.params.id, 'admin');
    res.json({ mensagens });
  } catch (erro) {
    next(erro);
  }
});

router.post('/chat/:id/mensagens', async (req, res, next) => {
  try {
    const texto = String(req.body.texto ?? '').trim();
    if (!texto) return res.status(400).json({ erro: 'Digite uma mensagem.' });
    const mensagem = await enviarMensagem({ conversaId: req.params.id, remetente: 'admin', texto });
    res.json({ mensagem });
  } catch (erro) {
    next(erro);
  }
});

export default router;
