import { Router } from 'express';
import {
  listarMaterias,
  buscarMateria,
  listarPlanos,
  listarDepoimentos
} from '../repositories/conteudo.js';
import { trilhaDoAluno, duvidasDoAluno, resumoDoAluno } from '../repositories/alunos.js';
import { assinaturaAtiva, historicoDoAluno } from '../repositories/assinaturas.js';
import { conciliarPendentes } from '../services/conciliacao.js';
import { decorarPlanos } from '../services/planos.js';
import { exigirLogin } from '../middleware/auth.js';
import { materiaBloqueada } from '../services/acesso.js';
import { criarSolicitacao, solicitacaoPendenteDoAluno } from '../repositories/solicitacoesTroca.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // A assinatura ativa entra na home para marcar o plano do aluno na grade.
    const [materias, planos, depoimentos, assinatura] = await Promise.all([
      listarMaterias(),
      listarPlanos(),
      listarDepoimentos(),
      req.aluno ? assinaturaAtiva(req.aluno.id) : null
    ]);

    res.render('index', {
      titulo: 'EducaAI — Cursos EAD com Professores Avatares de IA',
      descricao:
        'Exatas, humanas, idiomas e cursos técnicos do básico ao avançado, com professores avatares de inteligência artificial e tira-dúvidas 24/7.',
      pagina: 'inicio',
      materias,
      planos: decorarPlanos(planos, assinatura),
      assinatura,
      depoimentos
    });
  } catch (erro) {
    next(erro);
  }
});

router.get('/materias/:slug', async (req, res, next) => {
  try {
    const materia = await buscarMateria(req.params.slug);
    if (!materia) return next();

    res.render('materia', {
      titulo: `${materia.nome} do básico ao avançado — EducaAI`,
      descricao: materia.resumo,
      pagina: 'materias',
      materia,
      materias: await listarMaterias()
    });
  } catch (erro) {
    next(erro);
  }
});

router.get('/aula/:slug/:nivel?', async (req, res, next) => {
  try {
    const materia = await buscarMateria(req.params.slug);
    if (!materia) return next();

    if (req.aluno && (await materiaBloqueada(req.aluno.id, materia.slug))) {
      return res.status(403).render('acesso-restrito', {
        titulo: 'Acesso restrito — EducaAI',
        descricao: 'Seu plano não dá acesso a esta matéria.',
        pagina: 'aula',
        materia
      });
    }

    const nivel =
      materia.niveis.find((n) => n.id === req.params.nivel) ?? materia.niveis[0];

    res.render('aula', {
      titulo: `${materia.nome} · ${nivel.nome} — Sala de aula EducaAI`,
      descricao: `Aula demonstrativa de ${materia.nome} com ${materia.avatar}.`,
      pagina: 'aula',
      materia,
      nivel,
      materias: await listarMaterias()
    });
  } catch (erro) {
    next(erro);
  }
});

// Público: qualquer visitante pode fazer o nivelamento antes de criar conta.
router.get('/area-do-aluno', async (req, res, next) => {
  try {
    res.render('area-do-aluno', {
      titulo: 'Área do Aluno — EducaAI',
      descricao: 'Acompanhe sua trilha adaptativa e retome de onde parou.',
      pagina: 'area',
      materias: await listarMaterias()
    });
  } catch (erro) {
    next(erro);
  }
});

// Privado: painel do aluno logado.
router.get('/painel', exigirLogin, async (req, res, next) => {
  try {
    // Sem webhook (localhost), é aqui que um pagamento aprovado vira acesso.
    await conciliarPendentes({ alunoId: req.aluno.id });

    const [materias, trilha, duvidas, resumo, assinatura, pagamentos, solicitacaoPendente] = await Promise.all([
      listarMaterias(),
      trilhaDoAluno(req.aluno.id),
      duvidasDoAluno(req.aluno.id),
      resumoDoAluno(req.aluno.id),
      assinaturaAtiva(req.aluno.id),
      historicoDoAluno(req.aluno.id, 5),
      solicitacaoPendenteDoAluno(req.aluno.id)
    ]);

    const porSlug = Object.fromEntries(materias.map((m) => [m.slug, m]));

    res.render('painel', {
      titulo: 'Meu painel — EducaAI',
      descricao: 'Sua trilha, seu progresso e suas últimas dúvidas.',
      pagina: 'painel',
      materias,
      trilha: trilha.map((t) => ({ ...t, materia: porSlug[t.materia_slug] ?? null })),
      duvidas: duvidas.map((d) => ({ ...d, materia: porSlug[d.materia_slug] ?? null })),
      assinatura,
      materiaLiberada: assinatura?.materia_escolhida ? (porSlug[assinatura.materia_escolhida] ?? null) : null,
      pagamentos,
      resumo,
      solicitacaoPendente
    });
  } catch (erro) {
    next(erro);
  }
});

// Aluno com plano "Por Matéria" pede para trocar a matéria liberada.
router.post('/painel/solicitar-troca', exigirLogin, async (req, res, next) => {
  try {
    const assinatura = await assinaturaAtiva(req.aluno.id);
    const novaMateria = await buscarMateria(req.body.materia);

    if (!assinatura || assinatura.plano_codigo !== 'materia' || !novaMateria) {
      return res.redirect('/painel');
    }

    await criarSolicitacao({
      alunoId: req.aluno.id,
      assinaturaId: assinatura.id,
      materiaAtual: assinatura.materia_escolhida,
      materiaSolicitada: novaMateria.slug,
      motivo: req.body.motivo
    });

    res.redirect('/painel');
  } catch (erro) {
    next(erro);
  }
});

export default router;
