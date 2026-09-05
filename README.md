# EducaAI — Plataforma EAD com Professores Avatares de IA

Aplicação **Node.js** (Express + EJS) com a landing page completa, páginas de matéria,
sala de aula demonstrativa, área do aluno e as rotas de API já preparadas para as
integrações de IA.

## Como rodar

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL
npm run db:setup          # cria o esquema e popula o conteúdo
npm run dev
```

Acesse `http://localhost:3000`. O banco é **Postgres (Neon)** — a URL fica só no `.env`.

## Estrutura do projeto

```
SITE-EAD/
├── server.js                 # Servidor Express: views, estáticos, rotas, 404 e erro
├── package.json
├── .env.example              # Banco, sessão, Mercado Pago e chaves de IA
├── src/
│   ├── data/
│   │   ├── materias.js       # 12 matérias × 3 níveis × tópicos (fonte única)
│   │   ├── planos.js         # Planos de assinatura
│   │   └── depoimentos.js    # Prova social (fonte do seed)
│   ├── middleware/
│   │   └── auth.js           # carregarAluno, exigirLogin, apenasVisitante
│   ├── db/
│   │   ├── pool.js           # Pool de conexão (TLS verificado)
│   │   ├── schema.sql        # Esquema idempotente
│   │   ├── setup.js          # npm run db:setup — cria e popula
│   │   └── conciliar.js      # npm run pagamentos:conciliar
│   ├── repositories/
│   │   ├── conteudo.js       # Leitura com cache + gravação de uso
│   │   ├── alunos.js         # Cadastro, autenticação e painel
│   │   └── assinaturas.js    # Assinaturas e status de pagamento
│   ├── routes/
│   │   ├── pages.js          # /, /materias/:slug, /aula/:slug/:nivel, /area-do-aluno
│   │   ├── api.js            # /api/* (JSON)
│   │   ├── auth.js           # /cadastro, /login, /logout
│   │   └── pagamento.js      # /assinar, retorno e webhook
│   └── services/
│       ├── ia.js             # Avatar, tira-dúvidas (LLM) e trilha adaptativa
│       ├── senha.js          # Hash scrypt e validações
│       ├── pagamento.js      # Mercado Pago (Checkout Pro)
│       ├── conciliacao.js    # Confere pagamentos pendentes no gateway
│       └── voz.js            # Texto para fala dos avatares
├── views/
│   ├── partials/             # head, header, footer
│   ├── index.ejs             # Landing page (todas as seções)
│   ├── materia.ejs           # Trilha completa da matéria
│   ├── aula.ejs              # Sala de aula + barra lateral de dúvidas
│   ├── area-do-aluno.ejs     # Teste de nivelamento (público)
│   ├── cadastro.ejs          # Criar conta
│   ├── login.ejs             # Entrar
│   ├── painel.ejs            # Painel privado do aluno
│   ├── assinatura.ejs        # Retorno do checkout
│   └── 404.ejs
└── public/
    ├── css/style.css
    └── js/
        ├── voz.js            # Síntese de fala e microfone (Web Speech API)
        └── main.js           # Menu, abas de nível, chat, nivelamento, áudio
```

## Seções da landing page

| Seção | Âncora | O que entrega |
|---|---|---|
| Cabeçalho | — | Logo, menu, e — conforme o estado da sessão — "Entrar / Criar conta" ou o nome do aluno com "Meu painel / Sair" |
| Hero | `#inicio` | Título de impacto, subtítulo da metodologia, CTAs "Comece grátis" e "Conheça as matérias", sala de aula animada com avatar |
| Matérias | `#materias` | Grade das 12 matérias com abas interativas Básico / Intermediário / Avançado, tópicos e carga horária |
| Diferenciais da IA | `#como-funciona` | Interatividade em tempo real, tira-dúvidas 24/7, adaptação de ritmo, trilha adaptativa + os 4 passos |
| Depoimentos | `#depoimentos` | Evolução de nível (de → para) com tempo em meses |
| Planos | `#planos` | Por Matéria, Combo Exatas, Combo Automotivo, Completo Mensal (destaque) e Completo Anual |
| Rodapé | — | Links úteis, termos, privacidade e redes sociais |

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/status` | Saúde do serviço e modo das integrações de IA |
| `GET` | `/api/materias` | Catálogo completo |
| `GET` | `/api/materias/:slug` | Uma matéria com seus três níveis |
| `GET` | `/api/planos` | Planos de assinatura |
| `POST` | `/api/chat` | Tira-dúvidas da aula — `{ pergunta, materia, nivel, topico }` |
| `POST` | `/api/nivelamento` | Trilha adaptativa — `{ materia, acertos, total }` → nível sugerido |
| `POST` | `/api/voz` | Voz do avatar — texto + preset, ou áudio do provedor |
| `POST` | `/api/avatar` | Renderização do professor avatar — `{ materia, nivel, roteiro }` |
| `POST` | `/api/conteudo/recarregar` | Recarrega o cache depois de editar o conteúdo no banco |

## Cadastro e login

| Rota | Método | O que faz |
|---|---|---|
| `/cadastro` | `GET` / `POST` | Criar conta (nome, e-mail, senha + confirmação) |
| `/login` | `GET` / `POST` | Entrar |
| `/logout` | `POST` | Sair e destruir a sessão |
| `/painel` | `GET` | **Privado** — trilha, progresso e histórico de dúvidas |
| `/area-do-aluno` | `GET` | Público — nivelamento aberto a visitantes |

**Como funciona**

- **Senha:** `scrypt` do `node:crypto` (N=16384, salt de 16 bytes por conta), guardada como
  `scrypt$N$salt$hash`. Comparação com `timingSafeEqual`. Nenhuma dependência externa de
  criptografia — ver [src/services/senha.js](src/services/senha.js).
- **Sessão:** `express-session` com store `connect-pg-simple` na tabela `sessoes`, cookie
  `httpOnly`, `sameSite=lax`, `secure` em produção, 30 dias com renovação a cada acesso.
  O login regenera o id da sessão (proteção contra fixação).
- **Mensagens de erro:** o login responde sempre "E-mail ou senha incorretos", e uma
  tentativa com e-mail inexistente ainda gasta o tempo de um hash — não dá para descobrir
  quais e-mails têm conta.
- **Validação:** nome com 2+ caracteres, e-mail em formato válido, senha com 8+ caracteres
  misturando letras e números, confirmação conferida. E-mail duplicado responde 409.
- **Vínculo dos dados:** logado, cada `POST /api/chat` e `/api/nivelamento` grava o
  `aluno_id`; anônimo, grava `null` — o nivelamento continua aberto a visitantes.

**Falta para produção:** token CSRF nos formulários (hoje a proteção é só o
`sameSite=lax`), verificação de e-mail, recuperação de senha e limite de tentativas de
login.

## Áudio (voz dos avatares e microfone)

| Recurso | Onde | Como funciona |
|---|---|---|
| Avatar fala a explicação | Botão "Ouvir a explicação" na sala de aula | Lê a descrição do nível e a lista de tópicos |
| Avatar lê a resposta do chat | Automático, se a voz estiver ligada | Toda resposta do tira-dúvidas é falada |
| Ligar/desligar a voz | Botão 🔊 no topo do palco | Preferência guardada por navegador (`localStorage`) |
| Aluno pergunta falando | Botão 🎙️ ao lado do campo de dúvida | Transcreve e envia sozinho ao terminar a fala |
| Pronúncia no idioma-alvo | Bloco Pronúncia nas aulas de Inglês e Espanhol | Cada frase é falada em `en-US` / `es-ES`, com tradução ao lado |

**Arquitetura** — `POST /api/voz` recebe o texto e a matéria e devolve:

- **sem `TTS_API_KEY`** (padrão): o texto normalizado + um preset de voz, e quem sintetiza
  é a Web Speech API do navegador — sem custo, sem latência de rede, funciona agora;
- **com `TTS_API_KEY`**: o áudio pronto do provedor (ElevenLabs, Azure, Google…), e o
  cliente só reproduz. O ponto de troca está comentado em [src/services/voz.js](src/services/voz.js).

Cada um dos doze professores tem timbre próprio (`rate`/`pitch` por matéria), então o aluno reconhece
quem está falando. O texto passa por uma normalização antes de virar fala:
`R$ 89,90` → "89,90 reais", `80%` → "80 por cento", `24/7` → "vinte e quatro horas por dia",
`IA` → "I A", `OBD-II` → "O B D dois", `ABS` → "A B S", `A/C` → "A C".

**Cursos de idioma:** o avatar de Inglês e o de Espanhol **explicam em português** —
só os exemplos do bloco "Pronúncia" são falados na língua-alvo, via o parâmetro `idioma`
de `/api/voz`. Sem isso, o navegador leria uma explicação em português com voz inglesa.

**Qualidade da voz estrangeira:** depende das vozes instaladas no sistema do aluno. O
Windows padrão traz `pt-BR` e `en-US`, mas normalmente **não traz `es-ES`** — nesse caso
o espanhol sai com sotaque, porque o navegador cai na voz padrão. Duas saídas: instalar a
voz do idioma no sistema (Windows → Hora e idioma → Voz) ou configurar `TTS_API_KEY`,
que passa a servir o áudio pronto do provedor e elimina a dependência do sistema.

**Limites do navegador:** a síntese existe em todos os navegadores atuais; o
reconhecimento de voz (microfone) só funciona em Chrome e Edge — nos demais o botão do
microfone aparece desabilitado com explicação, e o campo de texto continua funcionando.
O microfone exige permissão do usuário e HTTPS fora do localhost. Enquanto o aluno fala,
a voz do avatar é interrompida para o microfone não captar o próprio professor.

## Pagamentos (Mercado Pago — Checkout Pro)

| Rota | Método | O que faz |
|---|---|---|
| `/assinar/:plano` | `POST` | **Privado** — cria a preferência e redireciona ao checkout |
| `/assinatura/retorno` | `GET` | Página de volta do gateway (sucesso / pendente / falha) |
| `/api/webhooks/mercadopago` | `POST` | Notificação do Mercado Pago |

**Valores cobrados** (preços mantidos como no catálogo):

| Plano | Exibido | Cobrado | Parcelas |
|---|---|---|---|
| Por Matéria | R$ 39,90/mês | R$ 39,90 | 1x |
| Combo Exatas | R$ 69,90/mês | R$ 69,90 | 1x |
| Combo Automotivo | R$ 69,90/mês | R$ 69,90 | 1x |
| Completo Mensal | R$ 89,90/mês | R$ 89,90 | 1x |
| Completo Anual | R$ 59,90/mês | **R$ 718,80** | até 12x |

Só o plano anual é cobrado de uma vez (12 × 59,90) e parcelado; os demais são
cobranças mensais de uma parcela. A regra está em `calcularCobranca()`,
em [src/services/pagamento.js](src/services/pagamento.js).

**Como funciona**

1. O aluno logado clica no plano → `POST /assinar/:plano` cria uma linha em `assinaturas`
   com `status = pendente` e uma `referencia` única, e monta a preferência no Mercado Pago.
2. Redireciona para o checkout. Visitante sem conta vai para `/cadastro` — não dá para
   assinar sem estar logado.
3. Na volta, `/assinatura/retorno` **consulta o pagamento na API oficial** em vez de
   confiar no que veio na URL, e atualiza o status.
4. `POST /api/webhooks/mercadopago` responde 200 na hora (para o Mercado Pago não
   reenviar), valida o `x-signature` quando `MP_WEBHOOK_SECRET` está definido e então
   consulta o pagamento pela API antes de mudar qualquer status.

`approved → ativa`, `pending`/`in_process`/`authorized → pendente`, `rejected → recusada`,
`cancelled`/`refunded`/`charged_back → cancelada`.

### Conciliação — leia antes de testar

O webhook do Mercado Pago só chega em URL pública. Em `localhost` ele **nunca chega**, e um
pagamento aprovado ficaria eternamente "pendente" no banco. Por isso o site também
**pergunta ao gateway**, em vez de apenas esperar o aviso:

- ao abrir `/painel`, as pendentes daquele aluno são conciliadas — janela de 7 dias e no
  máximo uma consulta a cada 10 minutos por assinatura, para não inundar a API;
- no retorno do checkout quando a URL volta sem `payment_id` (caso do Pix e do boleto);
- por varredura manual ou agendada:

```bash
npm run pagamentos:conciliar
```

A coluna `assinaturas.verificado_em` guarda a última consulta, então um checkout abandonado
é verificado poucas vezes e depois sai da janela. A busca usa
`GET /v1/payments/search?external_reference=...` e prefere o pagamento aprovado.

**Para funcionar fora do localhost:** `BASE_URL` precisa ser a URL pública em https —
é ela que gera `back_urls`, `auto_return` e `notification_url`. Em desenvolvimento,
exponha a porta 3000 (ngrok, por exemplo) e cadastre a URL do webhook no painel do
Mercado Pago.

**Atenção:** as credenciais em uso são de **produção** (`APP_USR-`) — qualquer checkout
concluído gera cobrança real. Para testar sem cobrar, troque `MP_ACCESS_TOKEN` pela
credencial de teste (`TEST-`); `GET /api/status` mostra em que modo está.

## Banco de dados (Postgres / Neon)

### Tabelas

| Tabela | Papel |
|---|---|
| `materias` | Slug, nome, ícone, cor, avatar, resumo, ordem e `idioma` (cursos de língua) |
| `niveis` | Três por matéria (`basico`, `intermediario`, `avancado`) — 36 no total; `expressoes` guarda as frases de pronúncia |
| `topicos` | Itens ordenados de cada nível |
| `planos` | Assinaturas; `beneficios` em `jsonb` |
| `depoimentos` | Prova social, com `publicado` para curadoria |
| `alunos` | Conta do aluno: e-mail único, nome, `senha_hash`, último acesso |
| `sessoes` | Sessões de login (`connect-pg-simple`) |
| `nivelamentos` | Cada teste: acertos, aproveitamento, nível sugerido e `aluno_id` |
| `duvidas` | Pergunta, resposta do avatar e `aluno_id` |
| `assinaturas` | Plano, valor, parcelas, status, ids do Mercado Pago e `verificado_em` |
| `progresso` | Posição do aluno em cada matéria |

### Como o conteúdo circula

1. `src/data/*.js` é a **fonte do seed** — edite lá e rode `npm run db:setup` (idempotente,
   faz upsert por slug/código; depoimentos só são inseridos se a tabela estiver vazia).
2. Em produção o site lê de `src/repositories/conteudo.js`, que consulta o Postgres uma vez
   e mantém **cache em memória**.
3. Se o banco cair, o repositório volta automaticamente para os arquivos de `src/data` —
   o site continua no ar. `GET /api/status` mostra a origem em uso (`origemConteudo`).
4. `POST /api/chat` e `POST /api/nivelamento` **gravam** em `duvidas` e `nivelamentos`
   sem bloquear a resposta ao aluno em caso de falha.

### Segurança

- A URL de conexão fica apenas no `.env`, que está no `.gitignore`.
- TLS com verificação de certificado ligada (`rejectUnauthorized: true`).

## Integrações de IA (`src/services/ia.js`)

Os três serviços rodam em **modo simulado** enquanto o `.env` não tiver as chaves,
para que a interface funcione de ponta a ponta na demonstração:

1. **Geração de avatares** — `gerarAvatar()`. Ponto de troca para HeyGen, Synthesia
   ou D-ID (o bloco de exemplo de chamada está comentado no arquivo). Defina
   `AVATAR_API_KEY`.
2. **Assistente de dúvidas (LLM)** — `responderDuvida()`. Recebe pergunta + contexto
   da aula (matéria, nível, tópico). Defina `LLM_API_KEY`.
3. **Trilha adaptativa** — `nivelar()`. Já funciona de verdade: converte o
   aproveitamento do teste (≥80% avançado, ≥50% intermediário, abaixo disso básico)
   no ponto de partida do aluno.

## Próximos passos sugeridos

- Emissão de certificado e regras de expiração da assinatura
- Banco de questões real para o nivelamento (hoje o cálculo recebe o número de acertos)
- Cache dos vídeos de avatar já renderizados, para não repagar a renderização
