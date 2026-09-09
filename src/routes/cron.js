// Rotas chamadas pelo agendador da Vercel (ver "crons" no vercel.json).
//
// A Vercel envia o cabecalho `Authorization: Bearer $CRON_SECRET` em cada
// disparo. Sem o segredo configurado a rota fica fechada, para o endereco nao
// virar um botao publico de disparo em massa.

import { Router } from 'express';
import { dispararDivulgacao } from '../services/divulgacao.js';

const router = Router();
const CRON_SECRET = process.env.CRON_SECRET ?? '';

function autorizado(req) {
  if (!CRON_SECRET) return false;
  const cabecalho = req.get('authorization') ?? '';
  // `?secret=` existe so' para o teste manual pelo navegador/curl.
  const segredo = cabecalho.replace(/^Bearer\s+/i, '') || req.query.secret;
  return segredo === CRON_SECRET;
}

router.get('/divulgacao-whatsapp', async (req, res) => {
  if (!autorizado(req)) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }

  try {
    const relatorio = await dispararDivulgacao();
    console.log(
      `[cron] divulgação (${relatorio.modo}): ${relatorio.enviados}/${relatorio.total} enviados, ${relatorio.falhas} falhas`
    );
    res.json({ ok: true, ...relatorio });
  } catch (erro) {
    console.error('[cron] divulgação falhou:', erro);
    res.status(500).json({ ok: false, erro: erro.message });
  }
});

export default router;
