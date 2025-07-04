// chatbot.js

// Função para chamar o backend Node.js + Express + Transformers.js
async function getResponse(prompt) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  return data.reply;
}

document.addEventListener('DOMContentLoaded', () => {
  const botButton   = document.getElementById('chatbot');
  const botIcon     = document.getElementById('chatbot-icon');
  const chatWindow  = document.getElementById('chat-window');
  const chatBody    = document.getElementById('chat-body');
  const inputField  = document.getElementById('chat-input');
  const sendButton  = document.getElementById('chat-send');

  if (!botButton || !botIcon || !chatWindow || !chatBody || !inputField || !sendButton) {
    console.error('Elementos do chatbot não encontrados no DOM.');
    return;
  }

  const frames = {
    neutral:  '/public/assets/frames/01-neutral.svg',
    waiting:  '/public/assets/frames/02-waiting.svg',
    thinking: '/public/assets/frames/03-thinking.svg',
    answer:   '/public/assets/frames/04-answer.svg',
  };

  let ratingTimeout, closeTimeout;

  function setFrame(name) {
    botIcon.src = frames[name] || frames.neutral;
  }

  function linkify(text) {
    const urlRegex = /(\bhttps?:\/\/[^\s]+)/gi;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function addMessage(text, sender) {
    const msgEl = document.createElement('div');
    msgEl.className = `msg ${sender}`;

    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'user'
      ? '/public/assets/imagens/icon-user-conversation.svg'
      : '/public/assets/imagens/icon-chatbot-conversation.svg';
    avatar.alt = sender === 'user' ? 'Você' : 'Bot';

    const textEl = document.createElement('div');
    textEl.className = 'text';
    if (sender === 'bot') textEl.innerHTML = linkify(text);
    else                 textEl.textContent = text;

    if (sender === 'bot') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.title = 'Copiar resposta';
      copyBtn.innerText = '📋';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text)
          .then(() => copyBtn.innerText = '✅')
          .catch(() => copyBtn.innerText = '❌');
        setTimeout(() => copyBtn.innerText = '📋', 1500);
      });
      msgEl.append(avatar, textEl, copyBtn);
    } else {
      msgEl.append(textEl, avatar);
    }

    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addHTMLMessage(html, sender) {
    const msgEl = document.createElement('div');
    msgEl.className = `msg ${sender}`;

    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'user'
      ? '/public//assets/imagens/icon-user-conversation.svg'
      : '/public/assets/imagens/icon-chatbot-conversation.svg';
    avatar.alt = sender === 'user' ? 'Você' : 'Bot';

    const textEl = document.createElement('div');
    textEl.className = 'text';
    textEl.innerHTML = html;

    if (sender === 'bot') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.title = 'Copiar resposta';
      copyBtn.innerText = '📋';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textEl.innerText)
          .then(() => copyBtn.innerText = '✅')
          .catch(() => copyBtn.innerText = '❌');
        setTimeout(() => copyBtn.innerText = '📋', 1500);
      });
      msgEl.append(avatar, textEl, copyBtn);
    } else {
      msgEl.append(textEl, avatar);
    }

    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function resetInactivityTimer() {
    clearTimeout(ratingTimeout);
    clearTimeout(closeTimeout);

    ratingTimeout = setTimeout(() => {
      addHTMLMessage(
        `Como você avaliaria esta conversa?<br>
         ★ ☆ ☆ = Péssimo<br>
         ★ ★ ☆ = Regular<br>
         ★ ★ ★ = Ótimo<br>
         <em>Responda com “1”, “2” ou “3”.</em>`,
        'bot'
      );
    }, 2 * 60 * 1000);

    closeTimeout = setTimeout(() => {
      addMessage('Por inatividade, encerrando o chat. Obrigado!', 'bot');
      setTimeout(() => chatBody.innerHTML = '', 1000);
    }, 3 * 60 * 1000);
  }

  // Envia a mensagem do usuário e busca a resposta do backend
  async function sendMessage() {
    const userText = inputField.value.trim();
    if (!userText) return;

    console.log('→ USER:', userText);

    resetInactivityTimer();
    setFrame('thinking');
    addMessage(userText, 'user');
    inputField.value = '';
    setFrame('waiting');

    try {
      const reply = await getResponse(userText);
      console.log('← BOT :', reply);
      setFrame('answer');
      addMessage(reply, 'bot');
    } catch (err) {
      console.error('Erro ao obter resposta:', err);
      addMessage('Desculpe, ocorreu um erro. Tente novamente mais tarde.', 'bot');
    }

    setTimeout(() => setFrame('neutral'), 2000);
  }

  function sendGreeting() {
    resetInactivityTimer();
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Bom dia! Como posso ajudar?';
    else if (hour < 18) greeting = 'Boa tarde! Em que posso ajudar?';
    else greeting = 'Boa noite! Como posso ajudar?';
    addMessage(greeting, 'bot');
  }

  botButton.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = chatWindow.classList.toggle('hidden');
    if (!isHidden && chatBody.childElementCount === 0) {
      setFrame('waiting');
      sendGreeting();
    } else if (isHidden) {
      clearTimeout(ratingTimeout);
      clearTimeout(closeTimeout);
      setFrame('neutral');
    }
  });

  document.addEventListener('click', e => {
    if (!botButton.contains(e.target) && !chatWindow.contains(e.target)) {
      chatWindow.classList.add('hidden');
      clearTimeout(ratingTimeout);
      clearTimeout(closeTimeout);
      setFrame('neutral');
    }
  });

  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  setFrame('neutral');
});
