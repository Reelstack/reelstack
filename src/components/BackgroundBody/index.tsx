import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackground } from '../../contexts/BackgroundContext/backgroundContext';

const staticImages = {
  '/profile/': '/profile.png',
  '/': '/profile.png',
};

export function BackgroundBody() {
  const location = useLocation();
  const { dynamicBg, setDynamicBg } = useBackground();

  useEffect(() => {
    const body = document.body;
    const path = location.pathname;
    const isHome = path === '/home/';

    body.classList.remove('home-background', 'home-no-image');
    body.classList.remove('bg-transition-hide');

    if (!isHome) {
      const img =
        staticImages[path as keyof typeof staticImages] ?? '/profile.png';

      body.style.transition = 'none';
      body.style.setProperty('--bg-image', `url(${img})`);
      body.classList.add('blur-background');

      body.classList.remove('home-background', 'home-no-image');
      return;
    }

    // ---------- HOME ------------

    if (dynamicBg === null) {
      body.style.transition = 'none';
      body.style.setProperty('--bg-image', 'none');
      body.classList.add('blur-background', 'home-no-image');
      setTimeout(() => {
        body.style.transition = '';
      }, 0);
      return;
    }

    if (dynamicBg) {
      body.style.transition = '';
      body.classList.add('blur-background', 'home-background');

      body.classList.add('bg-transition-hide');
      setTimeout(() => {
        body.style.setProperty('--bg-image', `url(${dynamicBg})`);
        body.classList.remove('bg-transition-hide');
      }, 300);
    }
  }, [location.pathname, dynamicBg, setDynamicBg]);

  return null;
}
