/*
 * Jest Test Suite for qa.js
 *
 * This suite automatically tests each intent defined in qa.js against a sample query.
 * It reports how many intents matched the expected response and how many failed,
 * allowing calculation of the percentage of correct and incorrect matches.
 */

// Import the getResponse function and the intents definitions
const { getResponse, intents } = require('./qa');

// Build sample queries: for each intent, pick a representative phrase covering one of its patterns. 
// You may expand this object with more phrases per intent for more exhaustive coverage.
const samples = {
  saudacao:       ['oi', 'bom dia', 'olá!'],
  agradecimento:  ['obrigado', 'valeu!'],
  funcionamento_ecac: ['como funciona ecac', 'centro virtual'],
  regra_batimento_09_duplicidade: ['regra de abatimento 09 duplicidade', 'vencimento primeira parcela'],
  regra_batimento_09_divergencia: ['regra de batimento 09 divergência parcelamentos antigos 2012'],
  regra_batimento_08_comprovacao: ['regra 08 comprovação deduzidos', 'batimento 08 compensados'],
  regra_batimento_20: ['regra de batimento 20 benefícios etapa 3 transferência'],
  regra_militar:  ['regra militar militares em atividade decreto-lei 667/1969'],
  cancelar_assinatura_requisitos: ['cancelar assinaturas requisitos dos profissionais'],
  crp_judicial:   ['emitir crp judicial aguardar'],
  // ... add one sample per intent for all others
};

test('Exhaustive intent matching', () => {
  let totalChecks = 0;
  let correct = 0;

  for (const [intentName, phrases] of Object.entries(samples)) {
    phrases.forEach(phrase => {
      totalChecks++;
      const reply = getResponse(phrase).toLowerCase();
      // Check if any of the intent's responses appears in the reply
      const expectedIntent = intents.find(i => i.name === intentName);
      const match = expectedIntent.responses.some(r => reply.includes(r.toLowerCase().slice(0, 10)));
      if (match) correct++;
    });
  }

  console.log(`Total checks: ${totalChecks}, correct: ${correct}, incorrect: ${totalChecks - correct}`);
  // Calculate percentage
  const successRate = (correct / totalChecks) * 100;
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  expect(correct).toBe(totalChecks);
});
