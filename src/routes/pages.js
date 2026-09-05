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
import { exigirLogin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [materias, planos, depoimentos] = await Promise.all([
      listarMaterias(),
      listarPlanos(),
      listarDepoimentos()
    ]);

    res.render('index', {
      titulo: 'EducaAI — Cursos EAD com Professores Avatares de IA',
      descricao:
        'Exatas, humanas, idiomas e cursos técnicos do básico ao avançado, com professores avatares de inteligência artificial e tira-dúvidas 24/7.',
      pagina: 'inicio',
      materias,
      planos,
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

    const [materias, trilha, duvidas, resumo, assinatura, pagamentos] = await Promise.all([
      listarMaterias(),
      trilhaDoAluno(req.aluno.id),
      duvidasDoAluno(req.aluno.id),
      resumoDoAluno(req.aluno.id),
      assinaturaAtiva(req.aluno.id),
      historicoDoAluno(req.aluno.id, 5)
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
      pagamentos,
      resumo
    });
  } catch (erro) {
    next(erro);
  }
});

export default router;
