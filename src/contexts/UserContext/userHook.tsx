import { useContext } from 'react';
import { UserContext } from './userContext';
export function useUsers() {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUsers must be inside <UserProvider></UserProvider>');
  return context;
}
