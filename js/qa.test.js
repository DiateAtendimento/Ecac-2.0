/*
 * Jest Test Suite for qa.js
 *
 * Esta suite testa automaticamente cada intent definida em qa.js
 * usando um sample por intent.
 */

const { getResponse, intents } = require('./qa');

// Samples para cada intent
const samples = {
  saudacao: ['oi'],
  agradecimento: ['valeu'],
  funcionamento_ecac: ['como funciona o ecac'],
  regra_batimento_09_duplicidade: ['regra de abatimento 09 duplicidade'],
  regra_batimento_09_divergencia: ['regra de batimento 09 divergência parcelamentos antigos 2012'],
  regra_batimento_08_comprovacao: ['regra 08 comprovação deduzidos'],
  regra_batimento_20: ['regra de batimento 20 benefícios etapa 3 transferência'],
  regra_militar: ['regra militar militares em atividade decreto-lei 667/1969'],
  cancelar_assinatura_requisitos: ['cancelar assinaturas requisitos dos profissionais'],
  crp_judicial: ['emitir crp judicial aguardar'],
  regra_inativa: ['status inativa dipr'],
  rpc_x_dipr: ['rpc x dipr ingresso servidores teto rgps'],
  pedido_analise_termo: ['pedido análise termo ordem de chegada'],
  antecedentes_criminais: ['antecedentes criminais auto declaração'],
  erro_upload_dpin: ['erro upload dpin internal server error'],
  calculo_manual_termos: ['cálculo manual guia recolhimento'],
  observancia_irregular: ['observância irregular emenda constitucional 103/2019'],
  pedido_parcelamento_contribuicoes: ['pedido parcelamento contribuições limite 60 parcelas'],
  pedido_parcelamento_valores_devidos: ['parcelar valores prefeitura contribuição patronal'],
  cadastro_suplentes: ['cadastrar suplentes composição estrutura'],
  dpin_envio_obrigatorio: ['lançar dpin a partir de 2018'],
  prova_de_vida: ['prova de vida cadprev 4 horas'],
  dipr_x_13_salario: ['dipr 13º competência não aparece'],
  antecipar_parcela: ['antecipar parcelas guia futura'],
  dipr_pagamentos_antecipados: ['dipr pagamentos antecipados batimento 09'],
  dipr_parcelas_atraso: ['parcelas pagas em atraso dipr'],
  papel_responsabilidade_cadprev: ['atribuição responsabilidade cadprev incluir membro'],
  termo_celebracao: ['celebração termo parcelamento assinatura digital'],
  pedido_reparcelamento: ['pedido reparcelamento saldo remanescente 60 parcelas'],
  guia_recolhimento_parcelamento: ['emitir guia recolhimento parcelamento cadprev-web'],
  guia_recolhimento_nome_responsavel: ['guia recolhimento nome responsável antigo'],
  pensoes_por_morte: ['pensões por morte plano de benefícios integrado'],
  regime_competencia_caixa: ['regime de competência etapa 5 despesas'],
  gescon_cadunico: ['gescon cadúnico sistemas distintos'],
  acesso_processo_externo: ['acesso processo externo sei'],
  pedido_reuniao: ['solicitação reunião microsoft teams 72 horas'],
  inss_rgps_consulta: ['INSS RGPS meu.inss.gov.br central 135'],
  troca_senha_comprev: ['troca senha comprev acesso.dataprev.gov.br'],
  envio_termo_adesao: ['envio termo de adesão gescon-rpps'],
  acesso_bg_comprev: ['acesso bg comprev conceder acesso'],
  acesso_pronto: ['acesso pronto formulário pronto gescon'],
  ateste_dataprev: ['ateste eletrônico dataprev sala atendimento virtual'],
  envio_plano_custeio: ['envio plano de custeio gescon'],
  plano_custeio_novenena: ['noventena 90 dias portaria 1.467/2022'],
  troca_senha_gescon: ['troca senha gescon acesso.dataprev.gov.br/clientes'],
  crp_emergencial: ['crp emergencial art. 249 inciso I'],
  abrir_consulta: ['abrir consulta gescon art. 241'],
  msc_falta_envio: ['msc falta envio siconfi'],
  enviar_msc: ['como enviar msc siconfi janeiro junho 2019'],
  msc_regularizacao: ['msc regularização cadprev 00:00'],
  msc_falta_po_rpps: ['msc falta po 10.132 rpps julho 2024'],
  revisao_historico_regime: ['revisão histórico regime data início'],
  contabilidade_pos_decreto: ['contabilidade após decreto 11.356/2023'],
  alterar_crp_judicial: ['troca crp judicial administrativo gescon'],
  fundamentacao_pap_naf: ['fundamentação pap naf portaria 1.467/2022'],
  pap_naf_impugnacao: ['impugnação pap prova representação legal'],
  pap_naf_copia: ['pap cópia Gescon SEI'],
  esocial: ['consulta esocial gescon telegram'],
  progestao_certificacao: ['pró-gestão certificação institucional webconferência'],
  prazo_nao_estendido: ['prazo não estendido envio demonstrativos'],
  analise_geral: ['análise geral ordem chegada parcelamento'],
  previdencia_complementar: ['previdência complementar 4º bimestre jul/ago'],
};

describe('Exhaustive intent matching', () => {
  it('cada intent deve ter pelo menos um exemplo em samples', () => {
    const missing = intents
      .map(i => i.name)
      .filter(name => !samples[name] || samples[name].length === 0);
    expect(missing).toEqual([]);
  });

  it('respostas devem corresponder às intents esperadas', () => {
    let total = 0, correct = 0;
    for (const [intentName, phrases] of Object.entries(samples)) {
      const intent = intents.find(i => i.name === intentName);
      phrases.forEach(phrase => {
        total++;
        const reply = getResponse(phrase);
        const ok = intent.responses.some(r =>
          reply.toLowerCase().includes(r.toLowerCase().slice(0,10))
        );
        if (!ok) {
          console.warn(`❌ [${intentName}] "${phrase}" → "${reply}"`);
        } else {
          correct++;
        }
      });
    }
    console.log(`total=${total} corretas=${correct}`);
    expect(correct).toBe(total);
  });
});
