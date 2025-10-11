import './styles/global.css';
import './styles/theme.css';
import { MainRouter } from './routers/MainRouter';
import TestAuth from './TestAuth';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <TestAuth />
      <MainRouter />
      <Toaster position='top-center' toastOptions={{ duration: 3000 }} />
    </>
  );
}
