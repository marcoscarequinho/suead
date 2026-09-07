// Cria (ou atualiza a senha de) a conta de admin.
//
//   ADMIN_EMAIL="contato@mcdetranrj.com" ADMIN_NOME="Marcos Américo Teixeira Rodrigues" \
//   ADMIN_SENHA="uma-senha-forte" npm run admin:criar
//
// Roda contra o DATABASE_URL do .env (ou o que estiver no ambiente onde for
// executado). A senha nunca fica no código nem no histórico do Git — só passa
// pela linha de comando de quem roda o script.

import 'dotenv/config';
import { pool, temBanco, verificarConexao, encerrar } from './pool.js';
import { gerarHash, validarSenha, validarEmail } from '../services/senha.js';

async function main() {
  const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const nome = String(process.env.ADMIN_NOME ?? '').trim();
  const senha = String(process.env.ADMIN_SENHA ?? '');

  if (!validarEmail(email)) {
    console.error('Defina ADMIN_EMAIL com um e-mail válido.');
    process.exit(1);
  }
  const erroSenha = validarSenha(senha);
  if (erroSenha) {
    console.error(`ADMIN_SENHA inválida: ${erroSenha}`);
    process.exit(1);
  }
  if (!temBanco) {
    console.error('DATABASE_URL não configurada — nada a fazer.');
    process.exit(1);
  }

  const conexao = await verificarConexao();
  if (!conexao.ok) {
    console.error('Falha ao conectar:', conexao.motivo);
    process.exit(1);
  }

  const hash = await gerarHash(senha);
  const { rows } = await pool.query(
    `insert into alunos (nome, email, senha_hash, tipo, ultimo_acesso)
     values ($1, $2, $3, 'admin', now())
     on conflict (email) do update set
       nome = excluded.nome, senha_hash = excluded.senha_hash, tipo = 'admin'
     returning id, email, nome, tipo`,
    [nome || null, email, hash]
  );

  console.log('Admin pronto:', rows[0]);
  await encerrar();
}

main().catch(async (erro) => {
  console.error('Falha ao criar admin:', erro);
  await encerrar();
  process.exit(1);
});
