// Catalogo das materias, cada uma dividida por nivel de proficiencia.
// Serve tanto as paginas EJS quanto a API publica (/api/materias).

export const materias = [
  {
    slug: 'matematica',
    nome: 'Matemática',
    icone: '📐',
    cor: '#4f46e5',
    avatar: 'Prof. Ada',
    resumo:
      'Da aritmética básica ao cálculo avançado, com resolução de problemas passo a passo ao lado do avatar especialista.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '32 aulas · 18h',
        descricao: 'Reconstrução das bases: operações, frações e raciocínio lógico.',
        topicos: [
          'Operações fundamentais e propriedades',
          'Frações, decimais e porcentagem',
          'Razão, proporção e regra de três',
          'Introdução à álgebra e equações do 1º grau'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '40 aulas · 26h',
        descricao: 'Consolidação para o ensino médio e provas nacionais.',
        topicos: [
          'Funções afim, quadrática e exponencial',
          'Geometria plana e espacial',
          'Trigonometria no triângulo e no ciclo',
          'Probabilidade e análise combinatória'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '46 aulas · 34h',
        descricao: 'Preparação para vestibulares de alta concorrência e cálculo.',
        topicos: [
          'Limites e continuidade',
          'Derivadas e aplicações',
          'Integrais definidas e indefinidas',
          'Números complexos, matrizes e determinantes'
        ]
      }
    ]
  },
  {
    slug: 'historia',
    nome: 'História',
    icone: '📜',
    cor: '#b45309',
    avatar: 'Prof. Marcos',
    resumo:
      'Viaje no tempo com reconstituições visuais interativas e análises aprofundadas dos grandes marcos da humanidade.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '28 aulas · 15h',
        descricao: 'Linha do tempo essencial e leitura de fontes históricas.',
        topicos: [
          'Pré-história e primeiras civilizações',
          'Antiguidade clássica: Grécia e Roma',
          'Idade Média e feudalismo',
          'Como interpretar documentos históricos'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '36 aulas · 22h',
        descricao: 'Brasil e mundo moderno com foco em causas e consequências.',
        topicos: [
          'Grandes navegações e colonização',
          'Brasil Colônia, Império e República',
          'Revoluções Industrial e Francesa',
          'Imperialismo e Primeira Guerra Mundial'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '42 aulas · 30h',
        descricao: 'Historiografia, debate crítico e produção de argumento.',
        topicos: [
          'Entreguerras, nazifascismo e Segunda Guerra',
          'Guerra Fria e geopolítica bipolar',
          'Ditadura Militar e redemocratização',
          'Correntes historiográficas e uso de fontes'
        ]
      }
    ]
  },
  {
    slug: 'geografia',
    nome: 'Geografia',
    icone: '🌍',
    cor: '#059669',
    avatar: 'Prof. Íris',
    resumo:
      'Compreenda geopolítica, cartografia, relevo e dinâmicas populacionais com mapas dinâmicos em 3D.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '26 aulas · 14h',
        descricao: 'Alfabetização cartográfica e conceitos de espaço.',
        topicos: [
          'Orientação, escalas e projeções',
          'Relevo, solo e hidrografia',
          'Clima e vegetação do Brasil',
          'Espaço urbano e espaço rural'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '34 aulas · 21h',
        descricao: 'Dinâmicas populacionais, economia e meio ambiente.',
        topicos: [
          'Demografia e movimentos migratórios',
          'Industrialização e redes de transporte',
          'Fontes de energia e matriz energética',
          'Questões ambientais e mudanças climáticas'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '38 aulas · 27h',
        descricao: 'Geopolítica contemporânea e análise de dados espaciais.',
        topicos: [
          'Blocos econômicos e globalização',
          'Conflitos geopolíticos atuais',
          'Geografia agrária e agronegócio',
          'Leitura de gráficos, tabelas e geotecnologias'
        ]
      }
    ]
  },
  {
    slug: 'fisica',
    nome: 'Física',
    icone: '⚛️',
    cor: '#0ea5e9',
    avatar: 'Prof. Lattes',
    resumo:
      'Do movimento à física moderna, com simulações interativas que mostram cada fenômeno acontecendo antes da fórmula aparecer.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '30 aulas · 17h',
        descricao: 'A linguagem da física: medir, descrever movimento e aplicar as leis de Newton.',
        topicos: [
          'Grandezas, unidades e notação científica',
          'Cinemática: velocidade e aceleração',
          'As três leis de Newton na prática',
          'Trabalho, energia e potência'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '38 aulas · 25h',
        descricao: 'Conservação, fluidos, calor e luz — os blocos mais cobrados no ENEM.',
        topicos: [
          'Impulso, quantidade de movimento e colisões',
          'Hidrostática, pressão e empuxo',
          'Termologia, calorimetria e leis dos gases',
          'Óptica geométrica: espelhos e lentes'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '44 aulas · 33h',
        descricao: 'Eletromagnetismo, ondas e a porta de entrada da física moderna.',
        topicos: [
          'Eletrostática e campo elétrico',
          'Circuitos elétricos e leis de Kirchhoff',
          'Eletromagnetismo e indução',
          'Ondulatória e introdução à física moderna'
        ]
      }
    ]
  },
  {
    slug: 'quimica',
    nome: 'Química',
    icone: '🧪',
    cor: '#7c3aed',
    avatar: 'Prof. Marie',
    resumo:
      'Da tabela periódica à química orgânica, com reações animadas em nível molecular e cálculos resolvidos passo a passo.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '28 aulas · 16h',
        descricao: 'Do que a matéria é feita e como os átomos se combinam.',
        topicos: [
          'Matéria, substâncias e misturas',
          'Estrutura atômica e tabela periódica',
          'Ligações iônicas, covalentes e metálicas',
          'Funções inorgânicas: ácidos, bases e sais'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '36 aulas · 24h',
        descricao: 'Cálculo químico: onde a maioria trava, e onde a IA mais ajuda.',
        topicos: [
          'Reações químicas e balanceamento',
          'Mol, massa molar e estequiometria',
          'Soluções, concentração e diluição',
          'Termoquímica e entalpia'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '42 aulas · 31h',
        descricao: 'Equilíbrio, eletroquímica e toda a química orgânica.',
        topicos: [
          'Cinética química e equilíbrio',
          'Eletroquímica: pilhas e eletrólise',
          'Química orgânica: funções e isomeria',
          'Reações orgânicas e polímeros'
        ]
      }
    ]
  },
  {
    slug: 'estatistica',
    nome: 'Estatística',
    icone: '📊',
    cor: '#65a30d',
    avatar: 'Prof. Florence',
    resumo:
      'Ler dados sem se enganar: da média ao teste de hipótese, com gráficos construídos ao vivo pelo avatar a cada conceito.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '26 aulas · 15h',
        descricao: 'Estatística descritiva: organizar, resumir e visualizar dados.',
        topicos: [
          'População, amostra e tipos de variável',
          'Tabelas de frequência e gráficos',
          'Média, mediana e moda',
          'Dispersão: amplitude, variância e desvio padrão'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '34 aulas · 23h',
        descricao: 'Probabilidade e as distribuições que sustentam a inferência.',
        topicos: [
          'Probabilidade e regras de contagem',
          'Distribuições binomial e normal',
          'Amostragem e teorema central do limite',
          'Correlação e regressão linear simples'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '40 aulas · 30h',
        descricao: 'Inferência aplicada — e os erros de interpretação que derrubam pesquisas.',
        topicos: [
          'Intervalos de confiança',
          'Testes de hipótese: t, qui-quadrado e ANOVA',
          'Regressão múltipla e diagnóstico do modelo',
          'Vieses, causalidade e p-hacking'
        ]
      }
    ]
  },
  {
    slug: 'ingles',
    nome: 'Inglês',
    icone: '🇬🇧',
    cor: '#be123c',
    avatar: 'Prof. Emily',
    // idioma-alvo: o avatar explica em português e pronuncia os exemplos neste idioma.
    idioma: 'en-US',
    resumo:
      'Do primeiro "hello" à fluência acadêmica, com conversação em voz alta e correção de pronúncia pelo avatar.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '34 aulas · 20h',
        descricao: 'A1–A2: sair do zero e sustentar uma conversa do dia a dia.',
        topicos: [
          'Verbo to be, pronomes e artigos',
          'Present simple e present continuous',
          'Vocabulário essencial do cotidiano',
          'Pronúncia e listening de primeiras conversas'
        ],
        expressoes: [
          { frase: 'Nice to meet you. How are you doing?', traducao: 'Prazer em conhecer. Como você está?' },
          { frase: 'I would like a coffee, please.', traducao: 'Eu gostaria de um café, por favor.' },
          { frase: 'Could you say that again, more slowly?', traducao: 'Você poderia repetir, mais devagar?' }
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '40 aulas · 27h',
        descricao: 'B1–B2: narrar, opinar e argumentar sem travar.',
        topicos: [
          'Past simple, past continuous e present perfect',
          'Condicionais e modal verbs',
          'Phrasal verbs mais usados na prática',
          'Conversação: opinião, argumento e fluência'
        ],
        expressoes: [
          { frase: 'I have been studying English for two years.', traducao: 'Eu estudo inglês há dois anos.' },
          { frase: 'If I had more time, I would travel more often.', traducao: 'Se eu tivesse mais tempo, viajaria mais.' },
          { frase: 'Let me get back to you on that.', traducao: 'Depois eu te retorno sobre isso.' }
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '44 aulas · 34h',
        descricao: 'C1–C2: inglês acadêmico, registro formal e preparação para provas.',
        topicos: [
          'Tempos perfeitos e reported speech',
          'Inglês acadêmico e writing estruturado',
          'Idioms, collocations e registro formal',
          'Preparação para TOEFL e IELTS'
        ],
        expressoes: [
          { frase: 'The findings suggest a strong correlation between both variables.', traducao: 'Os resultados sugerem forte correlação entre as duas variáveis.' },
          { frase: 'She said she had already submitted the paper.', traducao: 'Ela disse que já havia enviado o artigo.' },
          { frase: 'That argument does not hold water.', traducao: 'Esse argumento não se sustenta.' }
        ]
      }
    ]
  },
  {
    slug: 'espanhol',
    nome: 'Espanhol',
    icone: '🇪🇸',
    cor: '#ea580c',
    avatar: 'Prof. Lucía',
    idioma: 'es-ES',
    resumo:
      'A língua mais próxima do português e a mais traiçoeira: o avatar trabalha falsos amigos e pronúncia desde a primeira aula.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '30 aulas · 18h',
        descricao: 'A1–A2: comunicação cotidiana e os falsos amigos que derrubam brasileiros.',
        topicos: [
          'Alfabeto, pronúncia e saudações',
          'Presente de indicativo, ser e estar',
          'Falsos amigos com o português',
          'Vocabulário do dia a dia'
        ],
        expressoes: [
          { frase: 'Mucho gusto, ¿cómo estás?', traducao: 'Muito prazer, como você está?' },
          { frase: 'Estoy embarazada de terminar el trabajo.', traducao: 'Cuidado: "embarazada" é grávida, não envergonhada.' },
          { frase: '¿Me puedes ayudar, por favor?', traducao: 'Você pode me ajudar, por favor?' }
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '36 aulas · 25h',
        descricao: 'B1–B2: passados, subjuntivo e as variedades da América Latina.',
        topicos: [
          'Pretéritos: indefinido e imperfecto',
          'Subjuntivo presente',
          'Perífrases verbais e conectores',
          'Conversação e variedades regionais'
        ],
        expressoes: [
          { frase: 'Cuando era niño, iba a la playa todos los veranos.', traducao: 'Quando eu era criança, ia à praia todos os verões.' },
          { frase: 'Espero que tengas un buen día.', traducao: 'Espero que você tenha um bom dia.' },
          { frase: 'Acabo de terminar la tarea.', traducao: 'Acabei de terminar a tarefa.' }
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '40 aulas · 31h',
        descricao: 'C1–C2: escrita acadêmica, registro formal e preparação para o DELE.',
        topicos: [
          'Subjuntivo em todos os tempos',
          'Espanhol acadêmico e redação',
          'Modismos e registro formal',
          'Preparação para o DELE'
        ],
        expressoes: [
          { frase: 'Si hubiera sabido, habría actuado de otra manera.', traducao: 'Se eu soubesse, teria agido de outra maneira.' },
          { frase: 'Cabe destacar que los datos son preliminares.', traducao: 'Vale destacar que os dados são preliminares.' },
          { frase: 'No hay mal que por bien no venga.', traducao: 'Há males que vêm para bem.' }
        ]
      }
    ]
  },
  {
    slug: 'portugues',
    nome: 'Português',
    icone: '✍️',
    cor: '#db2777',
    avatar: 'Prof. Clarice',
    resumo:
      'Domine gramática, interpretação de texto, redação nota mil e literatura do básico ao nível acadêmico.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '30 aulas · 16h',
        descricao: 'Estrutura da língua e leitura com autonomia.',
        topicos: [
          'Classes gramaticais na prática',
          'Ortografia, acentuação e pontuação',
          'Tipos e gêneros textuais',
          'Leitura e localização de informação'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '38 aulas · 24h',
        descricao: 'Sintaxe, coesão e a estrutura da dissertação.',
        topicos: [
          'Sintaxe do período composto',
          'Concordância e regência',
          'Coesão, coerência e conectivos',
          'Estrutura da redação dissertativa-argumentativa'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '44 aulas · 32h',
        descricao: 'Literatura, estilística e redação nota 1000 corrigida pela IA.',
        topicos: [
          'Escolas literárias e análise de obras',
          'Figuras de linguagem e estilística',
          'Repertório sociocultural e proposta de intervenção',
          'Correção de redação com devolutiva competência a competência'
        ]
      }
    ]
  },
  {
    slug: 'mecanica-automotiva',
    nome: 'Mecânica Automotiva',
    icone: '🔧',
    cor: '#475569',
    avatar: 'Prof. Bento',
    resumo:
      'Do funcionamento do motor ao diagnóstico avançado, com o avatar desmontando cada conjunto em 3D antes de você encostar na ferramenta.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '32 aulas · 22h',
        descricao: 'Como o carro funciona, nomenclatura correta e manutenção do dia a dia.',
        topicos: [
          'Motor a combustão: o ciclo de quatro tempos',
          'Sistemas do veículo e nome certo de cada peça',
          'Ferramentas, medidas e segurança na oficina',
          'Manutenção preventiva: óleo, filtros e correias'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '40 aulas · 30h',
        descricao: 'Diagnóstico e reparo dos conjuntos mecânicos que mais dão serviço.',
        topicos: [
          'Arrefecimento e lubrificação',
          'Embreagem, câmbio manual e transmissão',
          'Suspensão, direção e geometria',
          'Freios: disco, tambor, ABS e sangria'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '46 aulas · 38h',
        descricao: 'Motor por dentro, injeção eletrônica e laudo técnico.',
        topicos: [
          'Retífica: cabeçote, comando e virabrequim',
          'Injeção eletrônica e leitura de scanner OBD-II',
          'Turbo, admissão e escapamento',
          'Diagnóstico por sintoma e elaboração de laudo'
        ]
      }
    ]
  },
  {
    slug: 'eletricidade-automotiva',
    nome: 'Eletricidade Automotiva',
    icone: '⚡',
    cor: '#ca8a04',
    avatar: 'Prof. Nikola',
    resumo:
      'Da lei de Ohm à rede CAN, com esquemas elétricos interativos e medições simuladas no multímetro antes de você ir para o carro.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '28 aulas · 20h',
        descricao: 'Circuito, medição e leitura de esquema — a base que evita queimar módulo.',
        topicos: [
          'Tensão, corrente, resistência e lei de Ohm',
          'Multímetro: como medir sem errar',
          'Bateria, chicote e fusíveis',
          'Leitura de esquema elétrico automotivo'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '36 aulas · 28h',
        descricao: 'Os sistemas elétricos do veículo, um a um, com defeito e solução.',
        topicos: [
          'Sistema de partida e alternador (carga)',
          'Iluminação, setas e acessórios',
          'Sensores e atuadores da injeção',
          'Aterramento, mau contato e fuga de corrente'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '42 aulas · 35h',
        descricao: 'Eletrônica embarcada, redes de comunicação e alta tensão.',
        topicos: [
          'Redes CAN e LIN',
          'Módulos, imobilizador e codificação',
          'Diagnóstico com osciloscópio',
          'Híbridos e elétricos: alta tensão e segurança'
        ]
      }
    ]
  },
  {
    slug: 'ar-condicionado-automotivo',
    nome: 'Ar-Condicionado Automotivo',
    icone: '❄️',
    cor: '#0e7490',
    avatar: 'Prof. Carrier',
    resumo:
      'Do ciclo de refrigeração ao climatizador digital, com o circuito animado em 3D e leitura de manifold simulada antes de você ligar a máquina.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '26 aulas · 19h',
        descricao: 'Como o sistema produz frio e o que a manutenção preventiva resolve.',
        topicos: [
          'Ciclo de refrigeração: como o frio é produzido',
          'Compressor, condensador, evaporador e válvula de expansão',
          'Gases refrigerantes R-134a e R-1234yf',
          'Higienização, filtro de cabine e manutenção preventiva'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '32 aulas · 26h',
        descricao: 'Carga de gás, vazamentos e reparo dos componentes.',
        topicos: [
          'Recolhimento, vácuo e carga de gás na medida certa',
          'Detecção de vazamentos por traçador e nitrogênio',
          'Pressões de alta e baixa: leitura do manifold',
          'Correia, embreagem do compressor e ventoinhas'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '36 aulas · 30h',
        descricao: 'Climatização eletrônica, elétricos e legislação ambiental.',
        topicos: [
          'Climatizador digital, dual zone e sensores',
          'Diagnóstico elétrico do circuito do A/C',
          'Bomba de calor em híbridos e elétricos',
          'Normas ambientais e recolhimento de fluido'
        ]
      }
    ]
  },
  {
    slug: 'advocacia',
    nome: 'Advocacia',
    icone: '⚖️',
    cor: '#1e3a8a',
    avatar: 'Prof. Ruy',
    resumo:
      'Aulas de apoio para quem já cursa Direito na faculdade: revise institutos, estruture peças e argumentos e prepare provas no seu ritmo, com quantas explicações precisar.',
    aviso:
      'Conteúdo de apoio aos estudos de quem já está matriculado em uma faculdade de Direito. Não substitui a formação acadêmica, não configura orientação jurídica para casos concretos e não prepara sozinho para o exame da OAB.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '28 aulas · 16h',
        descricao: 'Introdução ao Direito e bases do sistema jurídico brasileiro.',
        topicos: [
          'Noções de Direito e fontes do ordenamento jurídico',
          'Organização dos poderes e hierarquia das normas',
          'Introdução ao Direito Civil: pessoas e bens',
          'Como ler e interpretar uma lei e uma ementa'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '34 aulas · 22h',
        descricao: 'Os grandes ramos do Direito que sustentam o curso.',
        topicos: [
          'Direito Constitucional: direitos fundamentais e controle de constitucionalidade',
          'Direito Civil: obrigações e contratos',
          'Direito Penal: teoria do crime',
          'Direito Processual: princípios e etapas do processo'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '30 aulas · 20h',
        descricao: 'Prática jurídica, redação de peças e revisão para provas e OAB.',
        topicos: [
          'Estrutura de petição inicial, contestação e recursos',
          'Direito Administrativo e Direito do Trabalho na prática',
          'Jurisprudência: como pesquisar e citar precedentes',
          'Revisão orientada para provas da faculdade e 1ª fase da OAB'
        ]
      }
    ]
  },
  {
    slug: 'medicina',
    nome: 'Medicina',
    icone: '🩺',
    cor: '#059669',
    avatar: 'Prof. Oswaldo',
    resumo:
      'Aulas de apoio para quem já cursa Medicina: revise anatomia, fisiologia e semiologia no seu ritmo, com quantas repetições precisar até o conceito ficar claro.',
    aviso:
      'Conteúdo de apoio aos estudos de quem já está matriculado em uma faculdade de Medicina. Não substitui a formação clínica supervisionada, não deve ser usado para diagnóstico, tratamento ou qualquer decisão sobre pacientes reais, e não habilita ao exercício da profissão.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '30 aulas · 18h',
        descricao: 'As bases: anatomia, fisiologia e bioquímica do corpo humano.',
        topicos: [
          'Anatomia geral e nomenclatura anatômica',
          'Fisiologia dos sistemas cardiovascular e respiratório',
          'Bioquímica básica: metabolismo e enzimas',
          'Histologia: tecidos e sua organização'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '36 aulas · 24h',
        descricao: 'Semiologia, patologia e o raciocínio clínico inicial.',
        topicos: [
          'Semiologia: anamnese e exame físico',
          'Patologia geral: inflamação e neoplasias',
          'Farmacologia básica: mecanismos de ação',
          'Microbiologia e imunologia aplicadas'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '32 aulas · 22h',
        descricao: 'Clínica médica, revisão de casos e preparação para provas práticas.',
        topicos: [
          'Clínica médica: principais síndromes por sistema',
          'Interpretação de exames laboratoriais e de imagem',
          'Discussão de casos clínicos para revisão de provas',
          'Ética médica e comunicação com o paciente'
        ]
      }
    ]
  },
  {
    slug: 'transito',
    nome: 'Trânsito',
    icone: '🚦',
    cor: '#ea580c',
    avatar: 'Prof. Cauã',
    resumo:
      'Aulas de apoio para quem estuda legislação de trânsito, direção defensiva e primeiros socorros — reforço para a prova teórica e para quem já frequenta um CFC.',
    aviso:
      'Conteúdo de apoio aos estudos de legislação e educação para o trânsito. Não substitui as aulas teóricas e práticas obrigatórias de um Centro de Formação de Condutores (CFC) credenciado, nem qualquer exigência do DETRAN para obtenção ou renovação da CNH.',
    niveis: [
      {
        id: 'basico',
        nome: 'Básico',
        duracao: '24 aulas · 14h',
        descricao: 'Legislação de trânsito e sinalização para a prova teórica.',
        topicos: [
          'Código de Trânsito Brasileiro: princípios e definições',
          'Sinalização vertical, horizontal e sonora',
          'Normas gerais de circulação e conduta',
          'Infrações, penalidades e pontuação na carteira'
        ]
      },
      {
        id: 'intermediario',
        nome: 'Intermediário',
        duracao: '20 aulas · 12h',
        descricao: 'Direção defensiva e comportamento no trânsito.',
        topicos: [
          'Direção defensiva: riscos e prevenção de acidentes',
          'Distância de segurança, velocidade e condições adversas',
          'Convivência com pedestres, ciclistas e motociclistas',
          'Meio ambiente e direção econômica'
        ]
      },
      {
        id: 'avancado',
        nome: 'Avançado',
        duracao: '18 aulas · 10h',
        descricao: 'Primeiros socorros e revisão final para a prova do DETRAN.',
        topicos: [
          'Primeiros socorros: avaliação inicial da cena e da vítima',
          'Procedimentos básicos até a chegada do socorro especializado',
          'Simulados comentados no estilo da prova do DETRAN',
          'Documentação, categorias de habilitação e processo de CNH'
        ]
      }
    ]
  }
];

export const materiasPorSlug = Object.fromEntries(materias.map((m) => [m.slug, m]));

export function buscarMateria(slug) {
  return materiasPorSlug[slug] ?? null;
}
