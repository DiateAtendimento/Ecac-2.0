// script.js

document.addEventListener('DOMContentLoaded', () => {
  const header  = document.querySelector('.site-header');
  const toggle  = document.querySelector('.nav__toggle');
  const navList = document.querySelector('.nav__list');
  let lastY = window.pageYOffset;

  // Efeito de ocultar/exibir header ao rolar
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    header.classList.toggle('scrolled', y > 50);

    if (y > lastY && y > 100) {
      header.classList.add('scroll-down');
      header.classList.remove('scroll-up');
    } else if (y < lastY) {
      header.classList.add('scroll-up');
      header.classList.remove('scroll-down');
    }

    lastY = y;
  });

  // Toggle do menu principal (mobile)
  toggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });

  // Fecha menu mobile ao redimensionar para desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navList.classList.remove('show');
    }
  });

  // Toggle de submenus em mobile
  document.querySelectorAll('.nav__item.dropdown > .nav__link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const submenu = link.nextElementSibling;
        submenu.classList.toggle('open');
      }
    });
  });
});



//Preencha com suas notícias e eventos reais
const noticiasData = [
  {
    title: 'Novo ECAC 2.0',
    description: 'Inovando o centro virtual...',
    date: '2025-06-27',
    img: '/public/assets/noticias_img/noticia5.svg',
    link: 'noticias.html'
  },
  {
    title: 'Descomplicando a Atuária',
    description: 'O papel da coordenação...',
    date: '2025-05-30',
    img: '/public/assets/noticias_img/noticia4.svg',
    link: 'noticia.html'
  },
  {
    title: 'Certificado profissional e o Pró-gestão',
    description: 'Desenvolva habilidades gerenciais...',
    date: '2025-05-19',
    img: '/public/assets/noticias_img/noticia3.svg',
    link: 'noticia1.html'
  },
  
];


/**
 * Renderiza até 3 cards num container.
 * @param {Object[]} data     – array de objetos (notícias ou eventos)
 * @param {string} selector    – seletor do container ('.noticias-cards' ou '.eventos-cards')
 * @param {'news'|'event'} type – tipo de card
 */
function renderCards(data, selector, type) {
  // Ordena por data desc
  data.sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.querySelector(selector);
  container.innerHTML = '';

  data.slice(0, 3).forEach((item, index) => {
    // Cria o link que será o card
    const card = document.createElement('div');
    card.className = type === 'news' ? 'news-card' : 'event-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(item.link, '_blank');
    });

    if (index === 0) card.classList.add('highlight'); // destaca o mais recente

    // Imagem
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.title;

    // Div de info
    const info = document.createElement('div');
    info.className = type === 'news' ? 'news-info' : 'event-info';

    // Título
    const h3 = document.createElement('h3');
    h3.textContent = item.title;
    info.appendChild(h3);

    // Descrição
    const desc = document.createElement('p');
    desc.innerHTML = `<em>${item.description}</em>`;
    info.appendChild(desc);

    if (type === 'news') {
      // Time para notícia
      const time = document.createElement('time');
      time.dateTime = item.date;
      time.textContent = new Date(item.date).toLocaleDateString('pt-BR');
      info.appendChild(time);
    } else {
      // Data e local para evento
      const dateP = document.createElement('p');
      dateP.textContent = new Date(item.date).toLocaleDateString('pt-BR');
      info.appendChild(dateP);

      const locP = document.createElement('p');
      locP.textContent = item.location;
      info.appendChild(locP);
    }

    // Monta e insere
    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

// Dispara após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  renderCards(noticiasData, '.noticias-cards', 'news');
  renderCards(eventosData, '.eventos-cards', 'event');
});
