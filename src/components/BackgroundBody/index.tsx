import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const backgroundImages = {
  '/home/': '/home.png',
  '/profile/': '/profile.png',
  '/': '/profile.png',
  // rotas
};

export function BackgroundBody() {
  const location = useLocation();

  useEffect(() => {
    const body = document.body;

    body.classList.add('blur-background');

    // atualização dinamica
    const bgImg =
      backgroundImages[location.pathname as keyof typeof backgroundImages];
    if (bgImg) {
      body.style.setProperty('--bg-image', `url(${bgImg})`);
    }
  }, [location.pathname]);

  return null;
}
