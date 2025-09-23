import type { JSX } from 'react';
import { useAuth } from '../../contexts/AuthContext/authContext';
import { Navigate } from 'react-router-dom';

type GuardedRouteProps = {
  children: JSX.Element;
  requireAuth?: boolean; // true = somente loggado acessa, false = somente convidados
  redirectTo?: string; // redireciona caso falhe
};

export function GuardedRoute({
  children,
  requireAuth = true,
  redirectTo,
}: GuardedRouteProps) {
  const { user, loading } = useAuth();

  // temporario até ter animações
  if (loading) return <p>Loading...</p>;

  // logged requerido e não está logado → redirect
  if (requireAuth && !user) return <Navigate to={redirectTo || '/'} replace />;

  // logado porém não pode → redirect
  if (!requireAuth && user)
    return <Navigate to={redirectTo || '/home'} replace />;

  return children;
}
