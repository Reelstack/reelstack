import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/theme.css';
import App from './App.tsx';
import { UserProvider } from './contexts/UserContext/userContext.tsx';
import { AuthProvider } from './contexts/AuthContext/authContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </AuthProvider>
  </StrictMode>,
);
