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
