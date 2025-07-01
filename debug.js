// debug.js
const path = require('path');
// Ajuste o caminho abaixo para o módulo que exporta getResponse
const { getResponse } = require(path.resolve(__dirname, 'js', 'qa.js'));

const samples = [
  'noventena 90 dias portaria 1.467/2022',
  'contabilidade após decreto 11.356/2023',
  'previdência complementar 4º bimestre jul/ago'
];

samples.forEach(phrase => {
  console.log(`"${phrase}" → "${getResponse(phrase)}"`);
});
