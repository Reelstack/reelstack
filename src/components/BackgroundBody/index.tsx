import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const backgroundImages = {
  '/home/': '/goncha.jpg',
  '/profile/': '/profile.png',
  '/': '/profile.png',
  // rotas
};

export function BackgroundBody() {
  const location = useLocation();

  useEffect(() => {
    const body = document.body;
    body.classList.add('blur-background');

    // limpa classe para evitar problemas
    body.classList.remove('home-background');

    const bgImg =
      backgroundImages[location.pathname as keyof typeof backgroundImages];

    if (bgImg) {
      body.style.setProperty('--bg-image', `url(${bgImg})`);
    }

    // se for a home
    if (location.pathname === '/home/') {
      body.classList.add('home-background');
    }
  }, [location.pathname]);

  return null;
}
