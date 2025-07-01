/**
 * 1) Normalização de texto:
 *    - remove acentos
 *    - converte pra minúsculas
 *    - remove pontuação supérflua
 * 2) Stemming de Porter (lib `natural`)
 * 3) Expansão de sinônimos nos padrões
 * 4) Matching em três camadas: regex refinado → fuzzy string → embeddings fallback
 */

const natural = require('natural');
const stringSimilarity = require('string-similarity');


const SYNONYMS = {
  saudacao:        ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'],
  agradecimento:   ['obrigado', 'valeu', 'brigad', 'agradec'],
  ecac:            ['ecac', 'portal ecac', 'centro virtual'],
  centro:          ['centro', 'portal'],
  virtual:         ['virtual'],
  regra:           ['regra', 'norma', 'artigo'],
  batimento:       ['abatimento', 'batimento', 'cheque'],
  duplicidade:     ['duplicidade', 'dupla', 'duplo'],
  divergencia:     ['divergência', 'discordância', 'diferença'],
  comprovacao:     ['comprovação', 'prova', 'comprovante'],
  beneficios:      ['benefícios', 'vantagens', 'beneficio'],
  transferencia:   ['transferência', 'remessa', 'transferir'],
  parcelas:        ['parcelas', 'prestações', 'faturas', 'mensalidades'],
  parcela:         ['parcela', 'prestação', 'fatura'],
  pagamento:       ['pagamento', 'pagamentos', 'quitação', 'pago'],
  antecipar:       ['antecipar', 'antecipação'],
  atraso:          ['atraso', 'atrasado', 'retroativo'],
  guia:            ['guia', 'boleto', 'documento de recolhimento'],
  calculo:         ['cálculo', 'calcul', 'operação'],
  manual:          ['manual'],
  calculoexato:    ['calculoexato', 'calculo exato'],
  dipr:            ['dipr', 'demonstrativo'],
  dpin:            ['dpin', 'investimento'],
  msc:             ['msc', 'matriz de saldos contábeis'],
  siconfi:         ['siconfi', 'siconf'],
  crp:             ['crp', 'certificado', 'previdência'],
  crpEmergencial:  ['crp emergencial', 'art. 249', 'inciso'],
  rpc:             ['rpc', 'rpc x dipr'],
  cadprev:         ['cadprev', 'cadastro', 'cadprev-web'],
  gescon:          ['gescon', 'gescon-rpps', 'ticket', 'chamado'],
  sei:             ['sei', 's.e.i.', 'processo externo'],
  inss:            ['inss', 'rgps', 'meu.inss.gov.br'],
  dataprev:        ['dataprev', 'acesso.dataprev.gov.br'],
  comprev:         ['comprev', 'bg comprev', 'pronto.dataprev.gov.br'],
  portaria:        ['portaria', 'portaria mtp', 'mte'],
  decreto:         ['decreto', 'decreto-lei', 'decreto nº'],
  lei:             ['lei', 'artigo', 'art.', 'codigo'],
  emenda:          ['emenda', 'emenda constitucional'],
  constitucional:  ['constitucional'],
  prazo:           ['prazo', 'vencimento', 'deadline'],
  competencia:     ['competência', 'competencia', 'mês', 'periodo'],
  nonagenial:      ['noventena', 'nonagenial', '90 dias'],
  assinatura:      ['assinatura', 'rubrica'],
  requisitos:      ['requisitos', 'condições', 'critério'],
  pedido:          ['pedido', 'solicitação', 'requerimento'],
  analise:         ['análise', 'avaliacao', 'verificação'],
  antecedentes:    ['antecedentes', 'historico'],
  criminais:       ['criminais', 'penal', 'certidões negativas'],
  prova:           ['prova', 'prova de vida', 'processa arquivos'],
  termo:           ['termo', 'documento'],
  reparcelamento:  ['reparcelamento', 'reparcelar'],
  envio:           ['envio', 'enviar', 'remeter', 'submeter'],
  reenvio:         ['reenvio', 'reenviar'],
  erro:            ['erro', 'falha', 'problema'],
  irregular:       ['irregular', 'anomalia'],
  pap:             ['pap', 'processo administrativo previdenciario'],
  naf:             ['naf'],
  impugnacao:      ['impugnação', 'contestação'],
  copia:           ['cópia', 'relatório'],
  esocial:         ['esocial'],
  progestao:       ['pró-gestão', 'progestao'],
  certificacao:    ['certificação', 'certificacao']
};

function escapeForRegExp(str) {
  return str.replace(/[[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
function expandWithSynonyms(expr) {
  for (const [rawKey, variants] of Object.entries(SYNONYMS)) {
    const key = escapeForRegExp(rawKey);
    const re = new RegExp(`\\b${key}\\b`, 'gi');
    if (re.test(expr)) {
      expr = expr.replace(
        re,
        `(?:${variants.map(escapeForRegExp).join('|')})`
      );
    }
  }
  return expr;
}
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function stemTokens(text) {
  return text
    .split(/\s+/)
    .map(t => natural.PorterStemmer.stem(t))
    .join(' ');
}
function makePattern(origRegex, flags = 'i') {
  let src = origRegex.source;
  src = src.replace(/\\b(ecac)\\b/i, '(?:[oO]s?\\s+)?$1');
  src = expandWithSynonyms(src);
  return new RegExp(`(?<!nao\\s)${src}`, flags);
}

// ———————————————————————————————————————————————————————————————
// Definição das intents originais
// ———————————————————————————————————————————————————————————————

const originalIntents = [
  {
    name: 'saudacao',
    threshold: 1,
    patterns: [
      /^(oi|olá)[.!]?$/i,
      /^(bom dia|boa tarde|boa noite)[.!]?$/i
    ],
    responses: [ 
      'Olá! Como posso ajudar você hoje?',
      'Oi! Em que posso ser útil?',
      'Olá, em que posso ajudar?'
    ]
  },
  {
    name: 'agradecimento',
    threshold: 1,
    patterns: [
      /\bobrigad[oa]\b/i,
      /\bvaleu\b/i,
      /\bbbrigad[oa]\b/i
    ],
    responses: [
      'De nada! Sempre que precisar, estarei aqui.',
      'Por nada! Conte comigo :)',
      'Disponha! Qualquer coisa, só chamar.'
    ]
  },
  {
    name: 'funcionamento_ecac',
    threshold: 2,
    patterns: [
      /\becac\b/i,
      /centro virtual\b/i,
      /como (?:funciona|opera|utiliza)\s+ecac\b/i
    ],
    responses: [
      'O ECAC é o Centro Virtual de Atendimento e Comunicação do DRPPS, onde você acessa serviços e informações online.',
      'O ECAC reúne em um portal todos os serviços e informações do DRPPS de forma digital e prática.'
    ]
  },
  {
    name: 'regra_batimento_09_duplicidade',
    threshold: 2,
    patterns: [
      /regra de\s*(?:abatimento|batimento)\s*09\b/i,
      /duplicidade\b/i,
      /vencimento.*primeira parcela/i
    ],
    responses: [
      'Quando há duplicidade de parcelas na Regra de Batimento 09, verifique se a data de vencimento da primeira parcela está correta no cadastro do termo de parcelamento. Se estiver errada, corrija o termo e reenvie o arquivo DIPR.',
      'Para resolver duplicidade na Regra de Batimento 09, ajuste a data de vencimento da primeira parcela no CADPREV e envie novamente o DIPR após a retificação.'
    ]
  },
  {
    name: 'regra_batimento_09_divergencia',
    threshold: 3,
    patterns: [
      /regra de\s*(?:abatimento|batimento)\s*09\b/i,
      /diverg[eê]ncia\b/i,
      /parcelamentos? antigos?/i,
      /2012\b/
    ],
    responses: [
      'Para divergências na Regra de Batimento 09 relativas a parcelamentos antigos (até 2012), apresente uma justificativa por ofício assinado informando índices e metodologia de cálculo. Envie pelo GESCON-RPPS e aguarde resposta da CGFIC.',
      'Nos casos de divergência de cálculo na Regra 09 (parcelamentos até dez/2012), imprima a Declaração de Veracidade, colha assinaturas e envie pelo CADPREV-Web. A CGFIC vai regularizar manualmente se acatar a justificativa.'
    ]
  },
  {
    name: 'regra_batimento_08_comprovacao',
    threshold: 1,
    patterns: [
      /regra de\s*(?:abatimento|batimento)\s*08\b/i,
      /comprova(?:ção|cao)/i,
      /deduzidos?/i,
      /compensados?/i
    ],
    responses: [
      'Quando o DIPR indicar divergência na Regra de Batimento 08, preencha o modelo da planilha de deduções (https://www.regimeproprio.com.br/modelo_planilha-deducoes.xlsx) detalhando todas as deduções e/ou compensações repassadas. Assine, digitalize e envie para sps.cgnal@previdencia.gov.br com assunto “Nome do Ente – UF – Comprovação dos valores deduzidos e/ou compensados para fins de regularização do DIPR – Bimestre mês1/mês2-ano”.',
      'Para regularizar a Regra 08, use o modelo da planilha (https://www.regimeproprio.com.br/modelo_planilha-deducoes.xlsx), informe todos os valores, assine e envie à CGNAL pelo e-mail sps.cgnal@previdencia.gov.br. Se for RPPS com Segregação da Massa e divergência nos dois Planos, envie uma cópia preenchida para cada Plano.'
    ]
  },
  {
    name: 'regra_batimento_20',
    threshold: 1,
    patterns: [
      /regra de\s*(?:abatimento|batimento)\s*20\b/i,
      /benef[ií]cios?/i,
      /etapa\s*3/i,
      /transfer[êe]ncia/i
    ],
    responses: [
      'A Regra de Batimento 20 do DIPR trata dos valores de benefícios transferidos pelo Tesouro e das entradas de recursos na etapa 3. Verifique se os valores estão corretos conforme informado no relatório.',
      'Se o representante legal do RPPS concordar com os valores da Regra 20, envie a Declaração de Veracidade e abra uma consulta no GESCON solicitando a baixa dessa regra.'
    ]
  },
  {
    name: 'regra_militar',
    threshold: 1,
    patterns: [
      /regra militar/i,
      /militares? em atividade/i,
      /Decreto-?Lei\s*667\/1969/i,
      /Lei\s*13\.954\/2019/i,
      /DIPR.*irregular/i
    ],
    responses: [
      'Entre em contato com nossa Divisão de Atendimento via WhatsApp / Telefone fixo (61) 2021-5555, pois nossos atendentes solicitarão no grupo do WhatsApp a inativação para os analistas competentes. Lembrando que as análises são conduzidas conforme a ordem de chegada e cada caso possui particularidades que demandam atenção individualizada. Não é possível determinar um prazo específico para a conclusão, mas garantimos que todos os esforços serão feitos para assegurar a celeridade necessária.'
    ]
  },
  {
    name: 'cancelar_assinatura_requisitos',
    threshold: 1,
    patterns: [
      /cancelar.*assinaturas?/i,
      /remover.*assinaturas?/i,
      /requisitos dos profissionais/i
    ],
    responses: [
      `1. Acesse o sistema CADPREV-Web e siga as etapas:
        - Clique em Cadastro.
        - Selecione Cadastro novamente.
        - Insira o Nome do Ente.
        - Acesse Estrutura de Gestão/Requisitos dos Profissionais.
        - Vá para Composição da Estrutura.
        - Clique no ícone do crachá para verificar a situação.
        - Clique no ícone da lixeira “Remover assinaturas”.
      2. Confirme o alerta: “Tem certeza que deseja remover essa assinatura? ...”
      3. Clique em OK.
      4. Realize os ajustes e submeta a análise novamente.`
    ]
  },
  {
    name: 'crp_judicial',
    threshold: 1,
    patterns: [
      /crp judicial/i,
      /decis[ãa]o judicial.*crp/i,
      /emitir.*crp/i,
      /cumprimento.*decis[ãa]o/i,
      /aguardar.*agu/i
    ],
    responses: [
      'Mesmo com decisão judicial favorável que concedeu CRP Judicial, o CRP só pode ser emitido após a AGU encaminhar oficialmente o instrumento de cumprimento da decisão (com Parecer de Força Executória, conforme §3º do art. 269 do CPC) à Secretaria de Regime Próprio e Complementar. Assim que a Secretaria receber e conferir esse documento, ela emitirá o CRP Judicial.'
    ]
  },
  {
    name: 'regra_inativa',
    threshold: 1,
    patterns: [
      /regra\b.*inativa/i,
      /status\s*inativa/i,
      /inativa.*dipr/i,
      /situaç[aã]o\s*indicativa.*inativa/i,
      /não configura.*irregularidades/i
    ],
    responses: [
      'Quando uma regra de batimento aparece com status INATIVA no DIPR, isso não configura irregularidades. Você pode ignorar essa indicação sem necessidade de ação adicional.'
    ]
  },
  {
    name: 'rpc_x_dipr',
    threshold: 1,
    patterns: [
      /\b(?:rpc|rpc x dipr)\b/i,
      /ingresso.*servidores.*teto\s*rgps/i,
      /4(?:º|o)\s*bimestre/i,
      /jul(?:ho)?\/?ago(?:sto)?/i,
      /aguardar.*previc/i
    ],
    responses: [
      'Se o RPPS teve ingresso de servidores com remuneração acima do teto RGPS após a instituição do RPG por lei, informe isso no DIPR do 4º bimestre (jul/ago) e aguarde análise da PREVIC do convênio com a EFPC. Se não houve ingresso, basta declarar “não” no DIPR do 4º bimestre.'
    ]
  },
  {
    name: 'pedido_analise_termo',
    threshold: 1,
    patterns: [
      /pedido.*an[aá]lise.*termo/i,
      /termos? de acordo/i,
      /ordem de chegada/i,
      /prazo.*an[aá]lise/i,
      /aguardem.*conclusão/i
    ],
    responses: [
      'Os termos de acordo de parcelamento são analisados em ordem de chegada. Não há como determinar um prazo específico para a análise, pois cada caso apresenta particularidades que demandam atenção individualizada. Solicita-se que aguardem a conclusão da análise, assegurando que serão envidados esforços para promover a celeridade necessária.'
    ]
  },
  {
    name: 'antecedentes_criminais',
    threshold: 1,
    patterns: [
      /\bantecedentes?\s+criminais?\b/i,
      /situaç(?:ão|ao).*irregular/i,
      /procedimento.*regulariz(?:ar|ação)/i,
      /\bextrato\b/i,
      /cadprev[- ]?web/i,
      /certid[oõ]es? negativas?/i,
      /auto\s*declaraç(?:ão|ao)/i,
      /data.*envio.*mps/i
    ],
    responses: [
      'Para regularizar os Antecedentes Criminais: acesse o CADPREV-Web em Cadastro > Cadastro > Nome do Ente > Estrutura de Gestão/Requisitos dos Profissionais > Composição da Estrutura; clique no crachá para verificar pendências em vermelho; anexe certidões negativas da Justiça Federal (TRF), Estadual (TJ) e a auto declaração; representante legal e dirigente máximo devem assinar; informe a data de envio ao MPS no sistema; renove as certidões e a declaração a cada dois anos.'
    ]
  },
  {
    name: 'erro_upload_dpin',
    threshold: 1,
    patterns: [
      /\bdpin\b/i,
      /digitalizad[oa]|upload|envio/i,
      /cadprev[- ]?web/i,
      /internal server error/i,
      /pdf.*versão\s*1\.4/i,
      /pdf\s*creator/i
    ],
    responses: [
      'Esse erro ocorre porque o CADPREV só aceita PDF na versão 1.4. Gere seu arquivo usando PDF Creator versão 4.1.0 ou exporte em PDF 1.4, e então faça o upload novamente para evitar o “internal server error”.'
    ]
  },
  {
    name: 'calculo_manual_termos',
    threshold: 1,
    patterns: [
      /cálcul[oó] manual/i,
      /erro.*cadprev/i,
      /guia.*recolhimento/i,
      /calculoexato\.com\.br/i,
      /atualizaç(?:ão|ao).+valor/i,
      /cálculos? financeiros?/i
    ],
    responses: [
      'Como o CADPREV está com erro na emissão da guia oficial, faça o cálculo manual usando o portal Cálculo Exato (https://calculoexato.com.br/) em Cálculos Financeiros > 4. Atualização de valor por um índice financeiro com juros. Informe o valor inicial (primeira parcela), data de consolidação do acordo, data de vencimento da parcela, selecione o índice e a taxa de juros (simples ou compostos) e confira o valor atualizado em negrito.'
    ]
  },
  {
    name: 'observancia_irregular',
    threshold: 1,
    patterns: [
      /observ[aâ]ncia.*irregular/i,
      /regulariza(?:r|ção)/i,
      /Emenda Constitucional\s*103\/2019/i,
      /Portaria\s*1\.467\/2022/i,
      /nonag[eé]simo/i,
      /al[ií]quotas?/i,
      /\bDecreto\b/i,
      /custeio/i
    ],
    responses: [
      'Para regularizar a observância dessa regra irregular, adeque sua legislação aos termos da Emenda Constitucional nº 103/2019 (art. 9º, caput do art. 11 c/c art. 36) e envie a norma via GESCON com validação formal. Aplique a nonagenial (prazo de 90 dias) para majoração de alíquotas conforme Portaria nº 1.467/2022 (art. 9º, I), com entrada em vigor no 1º dia do mês subsequente ao 90º dia de publicação, sem efeitos retroativos. Lembre-se que alterações de alíquotas ou plano de custeio só podem ser feitas por lei, não por Decreto.'
    ]
  },
  {
    name: 'pedido_parcelamento_contribuicoes',
    threshold: 1,
    patterns: [
      /pedido.*parcelamen(?:to|tar)/i,
      /posso.*parcelar.*contribui[cç][aã]o(?:s)?/i,
      /servidores?/i,
      /Portaria\s*MTP\s*1\.467\/2022/i,
      /limite.*60\s*parcelas?/i
    ],
    responses: [
      'Sim. Conforme a Portaria MTP nº 1.467/2022, é permitido parcelar apenas as contribuições normais, as suplementares e os aportes para equacionamento, respeitando o limite máximo de 60 parcelas.'
    ]
  },
  {
    name: 'pedido_parcelamento_valores_devidos',
    threshold: 1,
    patterns: [
      /parcelar.*valores?.*prefeitura/i,
      /contribui(?:ção)? patronal/i,
      /aportes?/i,
      /suplementares?/i,
      /não.*repassad[oa]s?/i,
      /art\.?\s*14/i,
      /termo de acordo de parcelamento/i
    ],
    responses: [
      'É possível parcelar os valores devidos pela Prefeitura referentes à contribuição patronal, aos aportes e às contribuições suplementares não repassadas, por meio de termo de acordo de parcelamento em até 60 prestações mensais iguais e sucessivas, conforme Art. 14: necessidade de lei autorizativa, aplicação de índice e juros definidos em lei do ente, primeira prestação até o último dia útil do mês subsequente, e vedação de inclusão de débitos não previdenciários.'
    ]
  },
  {
    name: 'cadastro_suplentes',
    threshold: 1,
    patterns: [
      /cadastr(?:ar|o|amento).*suplentes?/i,
      /suplentes?/i,
      /composiç(?:ão|ao).+estrutura/i,
      /requisitos dos profissionais/i
    ],
    responses: [
      'No momento não é necessário cadastrar os suplentes na aba Composição da Estrutura de Gestão/Requisitos dos Profissionais. Apenas os membros titulares devem ser registrados. Caso seja exigido futuramente, novas orientações serão fornecidas.'
    ]
  },
  {
    name: 'dpin_envio_obrigatorio',
    threshold: 1,
    patterns: [
      /\bdpin\b/i,
      /lan[çc]ar.*dpin/i,
      /envi[oa].*dpin/i,
      /obrigad[oa].*dpin/i,
      /a partir de\s*2018/i,
      /portaria\s*1\.467\/22/i
    ],
    responses: [
      'A partir de 2018, os Regimes Próprios de Previdência Social (RPPS) são obrigados a lançar o Demonstrativo de Política de Investimentos (DPIN). Esse demonstrativo é essencial para a emissão do CRP e deve ser enviado conforme as regras estabelecidas na Portaria 1.467/22 (veja em https://www.gov.br/previdencia/pt-br/assuntos/rpps/legislacao-dos-rpps/portarias/copy2_of_portariamtpno1467de02jun2022atualizadaate12dez2023.pdf).'
    ]
  },
  {
    name: 'prova_de_vida',
    threshold: 1,
    patterns: [
      /\bprova de vida\b/i,
      /cadprev\b/i,
      /processa.*arquivos?/i,
      /4\s*horas?/i,
      /limita(?:ção|cao)/i,
      /reenvio/i,
      /duplic[ao]ç(?:ão|ao)/i
    ],
    responses: [
      'O CADPREV processa os arquivos de Prova de Vida a cada 4 horas, na ordem de recebimento. Não é necessário reenviar o arquivo; aguarde o processamento para evitar duplicação de solicitações. Após o processamento, os dados dos beneficiários ficam disponíveis para consulta. Para mais detalhes, consulte o material de apoio: https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/cadprev/prova-de-vida-digital-rpps/Enviodoarquivoprovadevida.pdf'
    ]
  },
  {
    name: 'dipr_x_13_salario',
    threshold: 1,
    patterns: [
      /dipr.*13(?:º|o)/i,
      /compet(?:ê|e)ncia.*13(?:º|o)/i,
      /instruç(?:ão|ao).*dipr.*13(?:º|o)/i,
      /cadprev[- ]?web/i,
      /não.*aparece.*13(?:º|o)/i,
      /dipr.*13\b/i
    ],
    responses: [
      'A competência 13° não precisa ser incluída manualmente: o CADPREV-Web gera automaticamente a competência 13° a partir dos lançamentos das rubricas que contêm “13” no nome (por exemplo, “13-PAT-SEG”).'
    ]
  },
  {
    name: 'antecipar_parcela',
    threshold: 1,
    patterns: [
      /antecipar.*parcelas?/i,
      /parcelas?.*antecipar/i,
      /pagamento.*antecipad[oa]/i,
      /guia.*futura/i,
      /sistema.*não.*opç(?:ão|ao)/i
    ],
    responses: [
      'Para antecipar parcelas, utilize como base a primeira parcela do acordo e atualize-a até o mês de pagamento. Em seguida, multiplique esse valor atualizado pela quantidade de parcelas que deseja antecipar. Não emita guia no CADPREV com data futura, pois o sistema não reconhece antecipação e calculará juros até o vencimento normal.'
    ]
  },
  {
    name: 'dipr_pagamentos_antecipados',
    threshold: 2,
    patterns: [
      /\bdipr\b/i,
      /regime.*compet[eê]ncia/i,
      /pagamentos?.*antecipad[oa]s?/i,
      /batimento\s*09/i,
      /consulta.*gescon/i
    ],
    responses: [
      'No DIPR, informe os pagamentos no regime de competência, ou seja, lance-os nos demonstrativos dos meses em que efetivamente ocorreram. Se o Cadprev apontar Regra de Batimento 09 devido à antecipação, encaminhe uma consulta no GESCON informando o pagamento antecipado. O DRPPS analisará e, se estiver correto, a irregularidade será inativada manualmente.'
    ]
  },
  {
    name: 'dipr_parcelas_atraso',
    threshold: 1,
    patterns: [
      /parcelas?.*atraso/i,
      /pagas?.*atras[oó]/i,
      /dipr/i,
      /declarar/i,
      /compet[eê]ncia.*venciment[o|o]/i,
      /m[aê]s.*venciment[o|o]/i
    ],
    responses: [
      'As parcelas pagas em atraso devem ser informadas no DIPR da competência correspondente ao mês de vencimento da parcela.'
    ]
  },
  {
    name: 'papel_responsabilidade_cadprev',
    threshold: 1,
    patterns: [
      /atribui(?:ção|cao).*responsabilidade/i,
      /\bpapel.*responsabilidade\b/i,
      /cadprev/i,
      /cadastros?.*dados cadastrais/i,
      /composi(?:ção|ao).*estrutura/i,
      /adicionar.*membro/i,
      /incluir\b/i,
      /data.*fim/i,
      /encerrar.*responsabilidade/i
    ],
    responses: [
      'Para atribuir responsabilidade no CADPREV-Web: acesse https://cadprev.previdencia.gov.br/Cadprev/pages/index.xhtml e faça login com CPF e senha; no menu principal vá em Cadastros > Cadastros > Dados Cadastrais e Funcionais e clique em "+ Incluir" para registrar nova responsabilidade; para adicionar representante deliberativo ou conselheiro fiscal acesse Estrutura de Gestão/Requisitos dos Profissionais > Composição da Estrutura, selecione a aba (Conselho Deliberativo ou Fiscal), clique no ícone do lápis e escolha "Adicionar Membro"; para encerrar responsabilidade, na mesma aba use a coluna "Data Fim" e informe a data de término.'
    ]
  },
  {
    name: 'termo_celebracao',
    threshold: 1,
    patterns: [
      /celebra(?:r|ção).*termo/i,
      /procedimentos?.*celebração/i,
      /lan(?:çar|çamento).*dipr/i,
      /lan(?:çar|amento).*termo.*parcelamento/i,
      /testemunhas?/i,
      /assinatura digital/i,
      /declaraç(?:ão|ao).*publica/i
    ],
    responses: [
      'Para celebrar o termo de acordo de parcelamento: 1) Lance o DIPR (mesmo com atraso); 2) Lance o termo conforme a legislação do RPPS; 3) Extraia valores automaticamente; 4) Cadastre testemunhas com login/senha; 5) Valide e envie oficialmente; 6) Confira valores e datas; 7) Realize a assinatura digital; 8) Imprima o termo (envie ao BB se houver retenção do FPM); 9) Preencha a declaração de publicação; 10) Envie em PDF o Termo de Parcelamento, Termo de FPM (se aplicável), Demonstrativo Consolidado de Parcelamento e Declaração de Publicação.'
    ]
  },
  {
    name: 'pedido_reparcelamento',
    threshold: 1,
    patterns: [
      /reparcelamento/i,
      /pedido.*reparcelament/i,
      /saldo.*remanescente/i,
      /4\s*parcelas?/i,
      /60\s*parcelas?/i,
      /Art\.?\s*15/i,
      /Portaria\s*MTP\s*1\.467\/2022/i
    ],
    responses: [
      'Conforme Art. 15 da Portaria MTP nº 1.467/2022, o ente pode optar por reparcelar o saldo remanescente em até 60 prestações mensais iguais e sucessivas, observando que a soma das parcelas pagas acrescida das novas não ultrapasse 60 meses. A pendência será excluída para emissão do CRP após o envio da Matriz de Saldos Contábeis e o processamento do DIPR, que ocorre no próximo ciclo de até 4 horas.'
    ]
  },
  {
    name: 'guia_recolhimento_parcelamento',
    threshold: 1,
    patterns: [
      /guia.*recolhimento/i,
      /emissão.*guia/i,
      /cadprev[- ]?web/i,
      /repasse\/parcelamento/i,
      /consulta acord[oó]o? de parcelamento/i,
      /impress(?:ão|ao).*guia/i,
      /cálculo manual/i,
      /calculoexato\.com\.br/i
    ],
    responses: [
      'Para emitir a guia de recolhimento no CADPREV-Web: acesse Repasse/Parcelamento > Parcelamento > Consulta Acordo de Parcelamento; informe o ente, selecione o termo, vá na aba Consulta e clique no ícone da impressora em Visualizar Guia de Recolhimento; preencha número da parcela, vias, data de pagamento e valor; e clique em Imprimir Guia de Recolhimento. Verifique valor, juros, multa e vencimento.\n\nSe houver erro, faça cálculo manual via Cálculo Exato (https://calculoexato.com.br/) em Cálculos Financeiros > 4. Atualização de valor por um índice financeiro com juros, preenchendo valor inicial, datas, índice e juros simples/compostos; e use o valor em negrito como base.'
    ]
  },
  {
    name: 'guia_recolhimento_nome_responsavel',
    threshold: 1,
    patterns: [
      /guia.*recolhimento/i,
      /nome.*respons[aá]vel/i,
      /responsavel.*antigo/i,
      /atualiza(?:ção|ao).*dados/i,
      /sistema/i
    ],
    responses: [
      'A guia é emitida com o nome do responsável pela homologação do termo na época da formalização. Mesmo após atualização dos dados, essa informação não é alterada automaticamente. Observação: já há um chamado aberto junto à DATAPREV solicitando melhorias para que este campo seja atualizado conforme o cadastro.'
    ]
  },
  {
    name: 'pensoes_por_morte',
    threshold: 1,
    patterns: [
      /pens[oõ]es?.*morte/i,
      /plano.*benefici[oi]s?/i,
      /integrado/i,
      /plano de benefícios integrado apenas por aposentador(?:ias|ia)es? e pens[oõ]es? por morte/i,
      /kei.*3342/i,
      /Emenda Constitucional\s*103\/2019/i
    ],
    responses: [
      'Para regularizar o critério “Plano de benefícios integrado apenas por aposentadorias e pensões por morte”, encaminhe via GESCON o normativo que limite os benefícios do RPPS exclusivamente a aposentadorias e pensões por morte. A Lei nº 3342/2017 ainda prevê auxílio-doença, auxílio-reclusão, salário-família e salário-maternidade. Adeque sua legislação aos §§2º e 3º do art. 9º da Emenda Constitucional nº 103/2019.'
    ]
  },
  {
    name: 'regime_competencia_caixa',
    threshold: 1,
    patterns: [
      /regime.*compet[eê]ncia/i,
      /regime.*caixa/i,
      /etapa\s*5/i,
      /despesas?.*etapa\s*5/i,
      /folha.*pagamento/i,
      /demais despesas/i,
      /regime de (?:compet[eê]ncia|caixa)/i
    ],
    responses: [
      'Para a Etapa 5 do DIPR: Despesas de benefícios (aposentadorias, pensões, etc.) informadas na Etapa 2 devem ser lançadas pelo regime de competência, usando a data exata do pagamento. Outras despesas (administrativas, investimentos, restituições, compensações) podem ser lançadas pelo regime de caixa, informando apenas as efetivamente pagas no mês (data padrão = último dia do mês). Se optar por competência para essas, altere a data para o dia exato do pagamento.'
    ]
  },
  {
    name: 'gescon_cadunico',
    threshold: 1,
    patterns: [
      /\bgescon\b/i,
      /\bcad[úu]nico\b/i,
      /sistemas?.*distintos/i,
      /gest[aã]o.*benef[ií]cios?/i,
      /programas? sociais?/i,
      /atendimento.*cad[úu]nico/i,
      /link.*cad[úu]nico/i,
      /telefone.*121/i,
      /whatsapp/i
    ],
    responses: [
      'O Gescon gerencia benefícios previdenciários dos servidores (RPPS), enquanto o CADÚNICO é para programas sociais (famílias em vulnerabilidade). Para dúvidas do CADÚNICO, acesse https://www.gov.br/mds/pt-br/acesso-a-informacao/participacao-social/fale-conosco ou ligue 121, ou use WhatsApp no número 61 4042-1552.'
    ]
  },
  {
    name: 'acesso_processo_externo',
    threshold: 1,
    patterns: [
      /acesso.*processo.*externo/i,
      /\bsei\b.*acesso/i,
      /usu[aá]rio.*externo/i,
      /documentos?.*anexados/i,
      /art\.?\s*20/i,
      /decreto.*7\.724\/2012/i,
      /sigilos?o/i
    ],
    responses: [
      'No SEI, o usuário externo cadastrado só tem acesso ao andamento do processo; todo conteúdo permanece sigiloso e os documentos anexados só podem ser acessados após a edição do ato ou decisão, conforme art. 20 do Decreto nº 7.724/2012.'
    ]
  },
  {
    name: 'pedido_reuniao',
    threshold: 1,
    patterns: [
      /solicita(?:r|ção).*reuni(?:ão|ao)/i,
      /reuniões?/i,
      /atendimento\.rpps@previdencia\.gov\.br/i,
      /gescon/i,
      /consulta\s*>\s*consultas sobre rpps/i,
      /72\s*horas?/i,
      /microsoft teams/i,
      /formul[aá]rio/i,
      /\.docx/i
    ],
    responses: [
      'Para solicitar reunião com nossa equipe: preencha o formulário (https://www.gov.br/previdencia/pt-br/assuntos/rpps/canais-atendimento/ModelosdeSolicitaodereunio.docx) e envie por e-mail para atendimento.rpps@previdencia.gov.br ou via Gescon em Consulta > Consultas sobre RPPS > Atendimento > Solicitação de Reunião. Consultores devem indicar essa condição e anexar procuração do representante legal (dispensada se cadastrados no CADPREV). Informe data e horário sugeridos com, no mínimo, 72 horas de antecedência; a confirmação dependerá da disponibilidade dos analistas. As reuniões são online via Microsoft Teams.'
    ]
  },
  {
    name: 'inss_rgps_consulta',
    threshold: 1,
    patterns: [
      /\bINSS\b/i,
      /Regime\s+Geral\s+de\s+Previd[eê]ncia\s+Social/i,
      /\bRGPS\b/i,
      /meu\.inss\.gov\.br/i,
      /central.*atendimento\s*135/i,
      /v[ií]nculo.*previdenci[áa]rio/i,
      /compet[eê]ncia.*gest[oã]o.*rpps/i
    ],
    responses: [
      'Este Departamento da SRPC orienta e acompanha os RPPS, mas não detém registros de vínculos previdenciários. Identifique qual Ente Federativo é responsável (União, Estados, DF ou Municípios) para direcionar seu questionamento ao órgão gestor. Se o vínculo for com o RGPS, consulte no Meu INSS (meu.inss.gov.br) ou ligue para a Central 135 (segunda a sábado, 7h–22h, horário de Brasília).'
    ]
  },
  {
    name: 'troca_senha_comprev',
    threshold: 1,
    patterns: [
      /comprev/i,
      /troca.*senha/i,
      /nova.*senha/i,
      /solicitar.*senha/i,
      /redefinir.*senha/i,
      /acesso\.dataprev\.gov\.br/i
    ],
    responses: [
      'Para solicitar uma nova senha no COMPREV, acesse https://acesso.dataprev.gov.br/clientes/?action=form-sendToken. Você receberá um e-mail no endereço cadastrado com o link para redefinir sua senha.'
    ]
  },
  {
    name: 'envio_termo_adesao',
    threshold: 1,
    patterns: [
      /termo de\s*ades[aã]o/i,
      /como.*enviar.*termo.*ades[aã]o/i,
      /envio.*termo.*ades[aã]o/i,
      /gescon[- ]?rpps/i,
      /compensacao-previdenciaria/i,
      /gov\.br\/previdencia/i
    ],
    responses: [
      'O Termo de Adesão está disponível para download no site da SPREV em https://www.gov.br/previdencia/pt-br/assuntos/previdencia-no-servico-publico/compensacao-previdenciaria/compensacao-previdenciaria. Para enviá-lo via Gescon-RPPS: 1) Acesse http://gescon.previdencia.gov.br/Gescon e faça login; 2) vá em Consulta > Sobre RPPS > Pesquisar; 3) clique em "+ Incluir Consulta" e preencha os campos obrigatórios; 4) selecione e anexe o PDF (Termo de Adesão + anexos) em "Selecionar" e depois "Incluir Anexo"; 5) altere a visibilidade do arquivo para "Privado"; 6) confirme para enviar o documento à SPREV.'
    ]
  },
  {
    name: 'acesso_bg_comprev',
    threshold: 1,
    patterns: [
      /acesso.*bg\s*comprev/i,
      /bg\s*comprev/i,
      /conceder.*acesso/i,
      /servidora?/i,
      /pronto\.dataprev\.gov\.br/i,
      /cat[aá]logo/i,
      /comprev/i,
      /motivo.*solicita(?:ção|cao)/i,
      /módulo.*meu portal/i
    ],
    responses: [
      'Para conceder acesso ao BG COMPREV: acesse https://pronto.dataprev.gov.br/ com CPF e senha do Gescon/Comprev; vá em Catálogo > COMPREV > BG COMPREV; preencha os campos (Motivo: Solicitação de serviço (Requisição); Módulo: Meu Portal) e clique em Enviar. Aguarde a DATAPREV habilitar o usuário.'
    ]
  },
  {
    name: 'acesso_pronto',
    threshold: 1,
    patterns: [
      /\bpronto\b/i,
      /acesso.*pronto/i,
      /formul[aá]rio.*pronto/i,
      /gescon/i,
      /encaminhar.*formul[aá]rio/i,
      /dirigente|prefeito/i,
      /documentos?.*(identidade|cnh)/i
    ],
    responses: [
      'Se o gestor precisar de acesso ao Pronto, preencha o formulário (https://www.gov.br/previdencia/pt-br/assuntos/rpps/sistemas/comprev/formulario-pronto.pdf), assinado pelo dirigente do RPPS ou pelo prefeito, e anexe documentos pessoais (RG ou CNH frente e verso). Envie via Gescon em Consulta > Sobre os Sistemas do RPPS > COMPREV > Acesso ao Pronto; após, aguarde a liberação pela DATAPREV.'
    ]
  },
  {
    name: 'ateste_dataprev',
    threshold: 1,
    patterns: [
      /\bateste(?: eletr[oô]nico)?\b/i,
      /\bdataprev\b/i,
      /comercial@dataprev\.gov\.br/i,
      /sala.*atendimento virtual/i,
      /\bter[cç]as?\b/i,
      /quintas?/i,
      /agend(?:ar|amento)/i,
      /outlook\.office365\.com\/book/i,
      /marketplace/i,
      /produtos\.dataprev\.gov\.br/i
    ],
    responses: [
      'Para o ateste eletrônico e faturamento dos serviços DATAPREV: tire dúvidas pelo e-mail comercial@dataprev.gov.br ou na sala de atendimento virtual da SRPPS; o horário de atendimento é terças e quintas, das 9h30–12h e 14h30–17h; agende pelo link https://outlook.office365.com/book/Webconferncia1@mte.gov.br/; aguarde a normalização do Marketplace até segunda (22) e, para acessar a nova plataforma, use https://produtos.dataprev.gov.br/ecomm.'
    ]
  },
  {
    name: 'envio_plano_custeio',
    threshold: 1,
    patterns: [
      /envi[oa].*plano de custeio/i,
      /plano de custeio/i,
      /gescon/i,
      /manual.*preenchimento.*plano de custeio/i,
      /revogação.*normas?/i,
      /gest[aã]o.*normas?\s*rp?ps/i
    ],
    responses: [
      'Para enviar o Plano de Custeio no Gescon-RPPS: acesse o menu Gestão de Normas RPPS; na primeira aba de envio da norma, preencha todas as informações; se necessário, use a opção de revogação parcial e clique em “+” para listar normas a revogar; clique em Avançar para habilitar o Plano de Custeio; preencha Ente Federativo (Contribuição Patronal), Servidores/Aposentados/Pensionistas, Custo Suplementar e Taxa de Administração; confirme e envie; a norma passará por validação formal e análise de conteúdo. Consulte o manual completo em https://www.gov.br/previdencia/pt-br/assuntos/rpps/ManualPlanodeCusteioGescon_RPPS.pdf'
    ]
  },
  {
    name: 'plano_custeio_novenena',
    threshold: 2,
    patterns: [
      /\bnoventena\b/i,              
        /\b90\s*dias?\b/i,             
        /portaria.*1\s*467\s*2022/i,   
        /nonag[eé]simo/i,              
        /art\.?\s*9º/i                 
    ],
    responses: [
      'Em caso de instituição ou majoração de alíquotas, aplica-se a noventena (anterioridade nonagesimal) de 90 dias: durante esse período vigora a alíquota anterior e a nova só entra em vigor no 1º dia do mês subsequente ao nonagésimo dia da publicação, conforme Portaria nº 1.467/2022 (art. 9º, I) e art. 149 c/c art. 150, III, "c" da CF. Alíquotas não podem ter efeitos retroativos e não se alteram por Decreto.'
    ]
  },
  {
    name: 'troca_senha_gescon',
    threshold: 1,
    patterns: [
      /\bgescon\b/i,
      /troca.*senha/i,
      /senha.*expirou/i,
      /redefinir.*senha/i,
      /acesso\.dataprev\.gov\.br\/clientes/i
    ],
    responses: [
      'Para redefinir a senha do GESCON, acesse https://acesso.dataprev.gov.br/clientes/?action=form-sendToken. Você receberá um e-mail no endereço cadastrado com o link para renovar sua senha.'
    ]
  },
  {
    name: 'crp_emergencial',
    threshold: 1,
    patterns: [
      /\bcrp\s*-?\s*emergencial\b/i,
      /o que é crp emergencial/i,
      /como.*solicit(?:ar|ação).*crp\s*-?\s*emergencial/i,
      /art\.?\s*249/i,
      /inciso\s*[ivx]+\b/i,
      /portaria\s*MTP\s*1\.467\/2022/i,
      /gescon/i,
      /consulta.*atendimento/i
    ],
    responses: [
      'CRP Emergencial é um documento da SRPPS que atesta cumprimento dos critérios da Lei nº 9.717/1998. Para solicitar, abra uma consulta no Gescon em Atendimento > CRP – EMERGENCIAL Art. 249 Inciso I (Portaria MTP nº 1.467/2022).'
    ]
  },
  {
    name: 'abrir_consulta',
    threshold: 1,
    patterns: [
      /abrir.*consulta/i,
      /consulta.*gescon[- ]?rpps/i,
      /portaria\s*mtp\s*1\.467\/2022/i,
      /art\.?\s*241/i,
      /envio.*diverso/i,
      /devolu[cç][aã]o/i,
      /cadprev/i
    ],
    responses: [
      'Conforme a Portaria MTP nº 1.467/2022 (Art. 241 e §§1º, 4º e 8º), todas as consultas e legislações devem ser encaminhadas obrigatoriamente pelo Gescon-RPPS ou CADPREV. Qualquer envio fora desses sistemas será devolvido ao ente com orientações para reencaminhamento correto via Gescon-RPPS para análise e adoção das providências cabíveis.'
    ]
  },
  {
    name: 'msc_falta_envio',
    threshold: 1,
    patterns: [
      /\bmsc\b/i,
      /matriz.*saldos?\s*cont[áa]beis?/i,
      /\bsiconfi\b/i,
      /n[aã]o.*envio/i,
      /envio.*informações/i,
      /irregularidade/i
    ],
    responses: [
      'Para regularizar a irregularidade do MSC, o Município Louveira/SP deve enviar ao SICONFI, via Matriz de Saldos Contábeis (MsC), as informações contábeis, orçamentárias e fiscais do PO 10.132 – RPPS Municipal, referentes a dezembro/2023, conforme Art. 85 (alínea “a”, inciso V) e Art. 241 da Portaria MTP 1.467/2022, e Art. 163-A da CF c/c §2º do Art. 48 da LC 101/2000.'
    ]
  },
  {
    name: 'enviar_msc',
    threshold: 1,
    patterns: [
      /como.*enviar.*msc/i,
      /\bmsc\b/i,
      /siconfi/i,
      /janeiro.*junho.*2019/i,
      /prazo.*31.*julho.*2019/i,
      /setembro.*dezembro/i,
      /poder executivo/i,
      /layout/i,
      /po\b/i,
      /crp/i
    ],
    responses: [
      'Envie as MSC via SICONFI: as de janeiro a junho/2019 até 31/07/2019; as de setembro a dezembro até o último dia útil do mês subsequente. O Poder Executivo é o responsável pelo envio. Use o Layout oficial e informe o “Poder e Órgão – PO” do RPPS para validação e emissão do CRP.'
    ]
  },
  {
    name: 'msc_regularizacao',
    threshold: 1,
    patterns: [
      /\bmsc\b/i,
      /matriz.*saldos?\s*cont[aá]beis?/i,
      /envio.*msc/i,
      /prazo.*exclus[aã]o.*pend[eê]ncia/i,
      /emiss[ãa]o.*crp/i,
      /cadprev/i,
      /00:00/i
    ],
    responses: [
      'Após o envio da MSC no SICONFI, o CADPREV processa e confere os dados diariamente às 00:00. Pendências são automaticamente excluídas ao término desse processamento, possibilitando a emissão do CRP no ciclo imediatamente seguinte, em até 24 horas após o envio.'
    ]
  },
  {
    name: 'msc_falta_po_rpps',
    threshold: 1,
    patterns: [
      /\bmsc\b/i,
      /siconfi/i,
      /matriz.*saldos?\s*cont[áa]beis?/i,
      /falta.*po/i,
      /\bpo\s*10\.?132\b/i,
      /rp?ps?\b/i,
      /julho.*2024/i,
      /retificar|reenviar|reenvio/i,
      /homologar/i
    ],
    responses: [
      'O Município deve retificar e reenviar a MSC de julho/2024 no SICONFI, incluindo as informações do PO 10132 – RPPS Municipal na Matriz de Saldos Contábeis, para regularizar o envio dos dados contábeis, orçamentários e fiscais.'
    ]
  },
  {
    name: 'revisao_historico_regime',
    threshold: 1,
    patterns: [
      /revis[aã]o.*hist[oó]rico.*regime/i,
      /não.*concorda.*data.*in[ií]cio.*regime/i,
      /data.*in[ií]cio.*regime/i,
      /revisar.*regime/i,
      /hist[oó]rico.*regime/i,
      /consulta.*gescon.*revis[aã]o/i
    ],
    responses: [
      'Para revisar a data de início do regime: 1) reúna as normas previdenciárias que justifiquem a data correta; 2) elabore um ofício detalhando a discordância, com fundamentação legal e a data pretendida; 3) abra uma consulta no GESCON anexando o ofício e as normas; 4) acompanhe o pedido — as solicitações são analisadas manualmente em ordem de chegada; 5) aguarde a conclusão, pois não há prazo fixo devido à análise individual de cada caso.'
    ]
  },
  {
    name: 'contabilidade_pos_decreto',
    threshold: 2,
    patterns: [
      /contabilidad(?:e|a).*apos.*decreto/i,   
      /\bdecreto\s*11\s*356\s*2023\b/i,        
      /contabilidade.*extinta/i,
      /divis[aã]o.*contabilidade/i
    ],
    responses: [
      'Após a recriação do MPS (Decreto nº 11.356/2023), a Divisão de Contabilidade foi extinta. Para dúvidas contábeis, consulte a Secretaria do Tesouro Nacional ou o Tribunal de Contas do Estado, pois não há suporte contábil disponível via GESCON.'
    ]
  },
  {
    name: 'alterar_crp_judicial',
    threshold: 1,
    patterns: [
      /sair.*crp\s*judicial/i,
      /retirad[aa].*crp\s*judicial/i,
      /troca.*crp\s*administrativo/i,
      /alterar.*crp/i,
      /baixa.*crp\s*judicial/i,
      /crp.*administrativo/i,
      /gescon/i
    ],
    responses: [
      'Para trocar o CRP Judicial por CRP Administrativo, abra uma consulta no Gescon: Assunto: Atendimento; Assunto Específico: Dúvidas RPPS. No corpo da consulta, informe que o ente atende aos critérios para emissão de CRP, solicite a baixa do CRP Judicial e a emissão do CRP Administrativo.'
    ]
  },
  {
    name: 'fundamentacao_pap_naf',
    threshold: 1,
    patterns: [
      /\bpap\b/i,
      /\bnaf\b/i,
      /processo administrativo previdenci[áa]rio/i,
      /fundamentaç(?:ão|ao).*\bpap\b/i,
      /portaria.*mtp.*1\.467\/2022/i,
      /seç(?:ão|ao)\s*v.*art\.?\s*251/i,
      /seç(?:ão|ao)\s*vi.*art\.?\s*256/i,
      /c[oó]pia.*\bpap\b/i,
      /consulta.*gescon/i,
      /sei/i,
      /impu[np]gaç(?:ão|ao)/i,
      /justificativas?.*pap/i,
      /peticionamento.*eletr[oô]nico/i,
      /\bpostal\b/i
    ],
    responses: [
      'Fundamentação do PAP/NAF: Portaria MTP nº 1.467/2022 – Seção V (Art. 251) e Seção VI (Art. 256). Para obter cópia do PAP, abra consulta no GESCON solicitando relatório e decisórios; o envio será feito via SEI. Para regularizar o PAP, envie justificativas exclusivamente por peticionamento eletrônico ou via postal ao CGAUC (não são aceitas via Gescon). Mesmo que haja acordo de parcelamento, envie todas as justificativas necessárias; o auditor emitirá o Despacho de Justificativa (DJ) para concluir o processo.'
    ]
  },
  {
    name: 'pap_naf_impugnacao',
    threshold: 1,
    patterns: [
      /\b(?:pap|naf)\b/i,
      /impugna(?:ção|cao)/i,
      /prova.*representaç(?:ão|ao) legal/i,
      /documento original/i,
      /protocolo.*(?:in loco|eletr[oô]nico)/i,
      /via postal/i,
      /cgauc/i,
      /art\.?\s*257/i,
      /30\s*dias?/i,
      /despacho de justificativa/i,
      /recurso/i
    ],
    responses: [
      'Para impugnar NAF/PAP: instrua a impugnação com prova de representação legal e apresente o documento original à SPREV por protocolo in loco ou eletrônico, ou via postal (caput do art. 257 da Port. 1.467/2022) ao endereço da CGAUC (Esplanada dos Ministérios, Bloco F, Anexo A, Sala 427, CEP 70059-900, Brasília/DF). O ente tem 30 dias, sem ficar irregular durante a análise; se mantida a irregularidade, instaura-se PAP. Envie justificativas de regularização apenas por peticionamento eletrônico ou postal (não via Gescon). Em caso de recurso, o ente terá mais 30 dias para apresentá-lo.'
    ]
  },
  {
    name: 'pap_naf_copia',
    threshold: 1,
    patterns: [
      /\b(?:pap|naf)\b.*c[oó]pia/i,
      /cópia.*pap/i,
      /envia(?:r|do).*relat[oó]rio/i,
      /decis[ó]rios?/i,
      /gescon/i,
      /sei/i
    ],
    responses: [
      'Para obter cópia do PAP/NAF, abra uma consulta no GESCON solicitando o relatório e os decisórios. Após confirmação, o envio será realizado via SEI, por onde o processo é tramitado.'
    ]
  },
  {
    name: 'esocial',
    threshold: 1,
    patterns: [
      /\besocial\b/i,
      /consulta.*esocial/i,
      /gescon/i,
      /telegram/i,
      /teams\.microsoft\.com\/l\/meetup-join/i,
      /quintas?-feira/i,
      /14:30.*17h/i
    ],
    responses: [
      'Para informações sobre o E-Social: 1) no GESCON faça Consulta > Consultas sobre Sistemas do RPPS > Assunto “E-Social” > Assunto Específico “Consultas eSocial para RPPS”; 2) participe do grupo no Telegram via https://t.me/eSocialOP; 3) assista à Webconferência toda quinta-feira, das 14:30 às 17h, em https://teams.microsoft.com/l/meetup-join/19%3ameeting_OWMxMjIwZmUtMTZkZS00NGFhLThmODYtZWQ3MmRmNTQyNDRj%40thread.v2/0?context=%7b%22Tid%22%3a%223ec92969-5a51-4f18-8ac9-ef98fbafa978%22%2c%22Oid%22%3a%227456ca8b-e46d-482f-bdc3-227e2db99b6c%22%7d'
    ]
  },
  {
    name: 'progestao_certificacao',
    threshold: 1,
    patterns: [
      /pr[oô][- ]?gest[aã]o/i,
      /certifica[cç][aã]o profissional/i,
      /comiss(?:ão|ao).*pr[oô]-?gest[aã]o/i,
      /progestao\.rpps@previdencia\.gov\.br/i,
      /consulta.*certifica[cç]ao institucional/i,
      /webconfer(?:ência|encia)/i,
      /quarta-?feira/i,
      /14:30.*17h/i,
      /bookings?/i
    ],
    responses: [
      'Para assuntos de Pró-Gestão e Certificação Profissional, contate a comissão permanente no e-mail progestao.rpps@previdencia.gov.br ou abra consulta no GESCON: Assunto: Certificação Institucional, Assunto Específico: Procedimentos para adesão ao Pró-Gestão RPPS. Participe da webconferência toda quarta-feira, das 14:30 às 17h, agendando em https://outlook.office365.com/owa/calendar/Webconferncia1@mte.gov.br/bookings/.'
    ]
  },
  {
    name: 'prazo_nao_estendido',
    threshold: 1,
    patterns: [
      /\bprazo\b/i,
      /envio.*demonstrativ(?:os)?/i,
      /dilataç(?:ão|ao)/i,
      /ato\s*normativ(?:o|a)/i,
      /não.*prorroga(?:ção|cao)/i,
      /sem.*prorroga(?:ção|cao)/i,
      /notificar(?:emos)?/i
    ],
    responses: [
      'Em relação ao envio dos demonstrativos, a dilatação do prazo depende de edição de Ato Normativo e, até o momento, não houve prorrogação. Se houver qualquer atualização, notificaremos imediatamente os entes.'
    ]
  },
  {
    name: 'analise_geral',
    threshold: 1,
    patterns: [
      /an[aá]lise.*ordem.*chegada/i,
      /prazo.*espec[ií]fico/i,
      /\bparcelamento\b/i,
      /em geral/i,
      /consultas? gescon/i
    ],
    responses: [
      'As análises são conduzidas em ordem de chegada. Não é possível determinar um prazo específico para conclusão, pois cada caso possui particularidades individuais. Solicita-se que aguardem a finalização da análise; garantimos que todos os esforços serão envidados para assegurar a celeridade necessária. Agradecemos a compreensão.'
    ]
  },
  {
    name: 'previdencia_complementar',
    threshold: 2,
    patterns: [
      /\bpreviden[çc]ia complementar\b/i,   
      /\b4\s*bimestre\b/i,                 
      /\bjul\s*ago(?:sto)?\b/i,             
      /regime.*previden[çc]ia complementar/i,
      /perguntas.*frequentes/i
    ],
    responses: [
      'Se o critério “Instituição do regime de previdência complementar” constar irregular, confirme se a contratação de servidores acima do teto foi assinalada corretamente no DIPR do 4º bimestre (jul/ago) e retifique se necessário. Para implantação do Regime de Previdência Complementar, envie e-mail para surpc.cgeac@previdencia.gov.br ou participe da sala virtual da SRPPS às sextas-feiras, das 14:30 às 17h (agende em https://outlook.office365.com/owa/calendar/Webconferncia1@mte.gov.br/bookings/). Consulte as FAQs em https://www.gov.br/trabalho-e-previdencia/pt-br/assuntos/previdencia-complementar/mais-informacoes/perguntas-frequentes-para-entes-federativos'
    ]
  },
];

// ———————————————————————————————————————————————————————————————
// Montagem das intents refinadas
// ———————————————————————————————————————————————————————————————

const intents = originalIntents.map(({ name, threshold, patterns, responses }) => ({
  name,
  threshold: threshold === 1 || threshold === 2 ? threshold : threshold + 1,
  patterns: patterns.map(pat => makePattern(pat, pat.flags)),
  responses
}));

const fallbackResponses = [
  'Desculpe, não entendi. Pode reformular?',
  'Humm, não captei. Você pode dizer de outra forma?',
  'Não tenho certeza do que quis dizer. Pode tentar novamente?'
];

function embeddingFallback(_text, _intent) {
  return false;
}

function getResponse(text) {
  const normRaw  = normalize(text);
  const normStem = stemTokens(normRaw);

  // 1) Regex refinado
  let scored = intents.map(({ name, threshold, patterns, responses }) => ({
    name,
    threshold,
    responses,
    score: patterns.reduce(
      (acc, pat) => acc + (pat.test(normRaw) || pat.test(normStem) ? 1 : 0),
      0
    )
  }));
  let matches = scored.filter(i => i.score >= i.threshold);

  // 2) Fuzzy string matching
  if (!matches.length) {
    const SIM_THRESHOLD = 0.6;
    const sims = intents.map(intent => {
      let maxSim = stringSimilarity.compareTwoStrings(normRaw, intent.name);
      for (const r of intent.responses) {
        const sim = stringSimilarity.compareTwoStrings(normRaw, normalize(r));
        if (sim > maxSim) maxSim = sim;
      }
      return { intent, sim: maxSim };
    });
    const best = sims.reduce((a, b) => a.sim > b.sim ? a : b);
    if (best.sim > SIM_THRESHOLD) {
      matches = [ best.intent ];
    }
  }

  // 3) Embeddings fallback
  if (!matches.length) {
    for (const intent of intents) {
      if (embeddingFallback(normRaw, intent)) {
        matches = [ intent ];
        break;
      }
    }
  }

  // Seleção final da resposta
  let reply;
  if (matches.length) {
    matches.sort((a, b) => (b.score || 0) - (a.score || 0));
    const chosen = matches[0];
    reply = chosen.responses[
      Math.floor(Math.random() * chosen.responses.length)
    ];
  } else {
    reply = fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];
  }
  return reply;
}

module.exports = { getResponse, intents };
