import './styles/global.css';
import './styles/theme.css';
import { MainRouter } from './routers/MainRouter';

import { Toaster } from 'react-hot-toast';
import TestAuth from './tests/TestAuth';
import { useEffect, useRef } from 'react';
import { testUserRecommendations } from './tests/TestAlgoritm';
import { prepareLocalMovieCache } from './services/api/recommendations/movieLocalStorage';

export default function App() {
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    async function prepareAndRun() {
      console.log('Preparando cache de filmes...');
      await prepareLocalMovieCache(); // Espera o cache
      console.log('Cache pronto. Rodando recomendações...');
      testUserRecommendations(); // roda o algoritmo em segundo plano
    }

    prepareAndRun();
  }, []);
  return (
    <>
      <TestAuth />

      <MainRouter />
      <Toaster position='top-center' toastOptions={{ duration: 3000 }} />
    </>
  );
}
