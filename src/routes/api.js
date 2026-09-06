import { Router } from 'express';
import {
  listarMaterias,
  buscarMateria,
  listarPlanos,
  registrarDuvida,
  registrarNivelamento,
  estatisticas,
  origemDados,
  carregarConteudo
} from '../repositories/conteudo.js';
import { verificarConexao } from '../db/pool.js';
import { modoPagamento, pagamentoConfigurado } from '../services/pagamento.js';
import { sintetizar, modoVoz } from '../services/voz.js';
import { responderDuvida, nivelar, gerarAvatar, modo } from '../services/ia.js';
import { aulaDoTopico, narracao } from '../services/aulas.js';

const router = Router();

router.get('/status', async (req, res) => {
  const [materias, planos, banco, numeros] = await Promise.all([
    listarMaterias(),
    listarPlanos(),
    verificarConexao(),
    estatisticas()
  ]);

  res.json({
    ok: true,
    modo,
    pagamento: { configurado: pagamentoConfigurado, modo: modoPagamento },
    voz: { modo: modoVoz },
    banco: { conectado: banco.ok, versao: banco.versao ?? null, motivo: banco.motivo ?? null },
    origemConteudo: origemDados(),
    materias: materias.length,
    planos: planos.length,
    registros: numeros
  });
});

router.get('/materias', async (req, res) => {
  res.json({ materias: await listarMaterias() });
});

router.get('/materias/:slug', async (req, res) => {
  const materia = await buscarMateria(req.params.slug);
  if (!materia) return res.status(404).json({ erro: 'Matéria não encontrada.' });
  res.json({ materia });
});

router.get('/planos', async (req, res) => {
  res.json({ planos: await listarPlanos() });
});

// Recarrega o cache de conteudo depois de uma alteracao no banco.
router.post('/conteudo/recarregar', async (req, res) => {
  await carregarConteudo();
  res.json({ ok: true, origem: origemDados() });
});

// Assistente de duvidas da aula (barra lateral). Toda pergunta e persistida.
router.post('/chat', async (req, res, next) => {
  try {
    const { pergunta, materia, nivel, topico, historico } = req.body ?? {};
    if (!pergunta || !String(pergunta).trim()) {
      return res.status(400).json({ erro: 'Envie uma pergunta.' });
    }

    const resultado = await responderDuvida({
      pergunta: String(pergunta),
      materiaSlug: materia,
      nivelId: nivel,
      topico,
      historico: Array.isArray(historico) ? historico : []
    });

    await registrarDuvida({
      alunoId: req.aluno?.id ?? null,
      materiaSlug: materia,
      nivelCodigo: nivel,
      topico,
      pergunta: String(pergunta),
      resposta: resultado.resposta,
      modo: resultado.modo
    });

    res.json(resultado);
  } catch (erro) {
    if (erro.codigo === 'RECUSA') {
      return res.status(422).json({ erro: erro.message });
    }
    // Falha do provedor de LLM: o aluno precisa saber que foi a IA que caiu,
    // e nao receber uma resposta generica fingindo que deu certo.
    if (erro.status) {
      console.error('[chat] erro do provedor de LLM:', erro.status, erro.message);
      return res.status(502).json({
        erro: 'O professor de IA está indisponível no momento. Tente de novo em instantes.'
      });
    }
    next(erro);
  }
});

// Teste de nivelamento -> posicao inicial na trilha adaptativa.
router.post('/nivelamento', async (req, res, next) => {
  try {
    const { materia, acertos, total } = req.body ?? {};
    const resultado = await nivelar({
      materiaSlug: materia,
      acertos: Number(acertos) || 0,
      total: Number(total) || 10
    });
    if (!resultado) return res.status(404).json({ erro: 'Matéria não encontrada.' });

    await registrarNivelamento({
      alunoId: req.aluno?.id ?? null,
      materiaSlug: materia,
      acertos: Number(acertos) || 0,
      total: Number(total) || 10,
      aproveitamento: resultado.aproveitamento,
      nivelSugerido: resultado.nivelSugerido,
      nivelCodigo: resultado.nivelId
    });

    res.json(resultado);
  } catch (erro) {
    next(erro);
  }
});

// Voz do professor avatar: texto + preset (navegador) ou audio pronto (provedor).
router.post('/voz', async (req, res, next) => {
  try {
    const { texto, materia, idioma } = req.body ?? {};
    res.json(await sintetizar({ texto, materiaSlug: materia, idioma }));
  } catch (erro) {
    if (erro.codigo === 'TEXTO_VAZIO') return res.status(400).json({ erro: erro.message });
    next(erro);
  }
});

// Roteiro da aula de um topico. Servido do banco; gerado na primeira vez.
router.post('/aula', async (req, res, next) => {
  try {
    const { materia, nivel, topico } = req.body ?? {};
    const aula = await aulaDoTopico({ materiaSlug: materia, nivelId: nivel, topico });
    if (!aula) return res.status(404).json({ erro: 'Matéria não encontrada.' });

    res.json({ ...aula, narracao: narracao(aula.roteiro) });
  } catch (erro) {
    if (erro.codigo === 'TOPICO_INVALIDO') {
      return res.status(400).json({ erro: erro.message });
    }
    if (erro.codigo === 'SEM_CHAVE') {
      return res.status(503).json({
        erro: 'As aulas ainda não foram geradas e a chave do professor de IA não está configurada.'
      });
    }
    if (erro.codigo === 'RECUSA') {
      return res.status(422).json({ erro: erro.message });
    }
    if (erro.status) {
      console.error('[aula] erro do provedor de LLM:', erro.status, erro.message);
      return res.status(502).json({
        erro: 'Não consegui escrever esta aula agora. Tente de novo em instantes.'
      });
    }
    next(erro);
  }
});

// Renderizacao do professor avatar para um roteiro de aula.
router.post('/avatar', async (req, res, next) => {
  try {
    const { materia, nivel, roteiro } = req.body ?? {};
    res.json(await gerarAvatar({ materia, nivel, roteiro }));
  } catch (erro) {
    next(erro);
  }
});

export default router;
