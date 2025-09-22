import './styles/global.css';
import './styles/theme.css';
import { MainRouter } from './routers/MainRouter';
import { AuthProvider } from './contexts/AuthContext/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
