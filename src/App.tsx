import './styles/global.css';
import './styles/theme.css';
import { MainRouter } from './routers/MainRouter';
import TestAuth from './TestAuth';

export default function App() {
  return (
    <>
      <TestAuth />
      <MainRouter />
    </>
  );
}
