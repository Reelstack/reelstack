import './styles/global.css';
import './styles/theme.css';
import { MainRouter } from './routers/MainRouter';

import { Toaster } from 'react-hot-toast';
import TestAuth from './tests/TestAuth';
import { useEffect } from 'react';
import { testUserRecommendations } from './tests/TestAlgoritm';

export default function App() {
  useEffect(() => {
    testUserRecommendations();
  }, []);
  return (
    <>
      <TestAuth />

      <MainRouter />
      <Toaster position='top-center' toastOptions={{ duration: 3000 }} />
    </>
  );
}
