import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const staticImages = {
  '/profile/': '/profile.png',
  '/': '/profile.png',
  // rotas
};

export function BackgroundBody() {
  const location = useLocation();
  const { dynamicBg } = useBackground();

  useEffect(() => {
    const body = document.body;
    body.classList.add('blur-background');

    body.classList.remove('home-background');

    let bgImg: string | null = null;

    if (location.pathname === '/home/') {
      bgImg = dynamicBg; // dynamic background from Home
      body.classList.add('home-background');
    } else {
      bgImg =
        staticImages[location.pathname as keyof typeof staticImages] || null;
    }

    if (bgImg) {
      body.style.setProperty('--bg-image', `url(${bgImg})`);
    }
  }, [location.pathname, dynamicBg]);

  return null;
}
