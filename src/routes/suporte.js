// Chat de suporte do lado do aluno (botao flutuante). Respondido pelo admin,
// nao pela IA. Sem websocket: o widget faz polling nestes dois endpoints.

import { Router } from 'express';
import { exigirLogin } from '../middleware/auth.js';
import { conversaDoAluno, mensagensDaConversa, enviarMensagem, marcarLidas } from '../repositories/suporte.js';

const router = Router();

router.get('/api/suporte/mensagens', exigirLogin, async (req, res, next) => {
  try {
    const conversa = await conversaDoAluno(req.aluno.id);
    const mensagens = await mensagensDaConversa(conversa.id);
    await marcarLidas(conversa.id, 'aluno');
    res.json({ mensagens });
  } catch (erro) {
    next(erro);
  }
});

router.post('/api/suporte/mensagens', exigirLogin, async (req, res, next) => {
  try {
    const texto = String(req.body.texto ?? '').trim();
    if (!texto) return res.status(400).json({ erro: 'Digite uma mensagem.' });

    const conversa = await conversaDoAluno(req.aluno.id);
    const mensagem = await enviarMensagem({ conversaId: conversa.id, remetente: 'aluno', texto });
    res.json({ mensagem });
  } catch (erro) {
    next(erro);
  }
});

export default router;
