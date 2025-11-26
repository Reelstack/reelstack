import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackground } from '../../contexts/BackgroundContext/backgroundContext';

const staticImages = {
  '/profile/': '/profile.png',
  '/': '/profile.png',
};

export function BackgroundBody() {
  const location = useLocation();
  const { dynamicBg } = useBackground();

  useEffect(() => {
    const body = document.body;
    body.classList.add('blur-background');
    body.classList.remove('home-background');

    let newImg: string | null = null;

    if (location.pathname === '/home/') {
      newImg = dynamicBg;
      body.classList.add('home-background');
    } else {
      newImg =
        staticImages[location.pathname as keyof typeof staticImages] || null;
    }

    if (!newImg) return;

    // fade out
    body.classList.add('bg-transition-hide');

    //  fade-out, troca imagem
    setTimeout(() => {
      body.style.setProperty('--bg-image', `url(${newImg})`);

      // fade in
      body.classList.remove('bg-transition-hide');
    }, 300); // um pouco menor que a duração da transição
  }, [location.pathname, dynamicBg]);

  return null;
}
