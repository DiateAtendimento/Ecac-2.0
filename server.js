import express from 'express';
import cors from 'cors';
import path from 'path';
import { pipeline } from '@xenova/transformers';

const app = express();
const __dirname = path.resolve();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Carrega o modelo uma vez
let generator;
(async () => {
  console.log('Carregando modelo…');
  generator = await pipeline('text-generation', 'Xenova/distilgpt2');
  console.log('Modelo carregado!');
})();

// Endpoint de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const output = await generator(prompt, { max_new_tokens: 100 });
    // remove o próprio prompt da resposta
    const reply = output[0].generated_text.slice(prompt.length).trim();
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha na geração de resposta' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando em http://localhost:${PORT}`));
