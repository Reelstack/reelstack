import React, { createContext, useReducer, useEffect } from 'react';
import { userReducer } from './userReducer';
import type { State } from './userTypes';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

interface ContextProps {
  state: State;
  getUsers: () => Promise<void>;
  addUser: (email: string) => Promise<void>;
  updateUser: (id: number, email: string) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const UserContext = createContext<ContextProps | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, { users: [] });

  async function getUsers() {
    const { data } = await supabase.from('users').select();
    if (data) dispatch({ type: 'SET_USERS', payload: data });
  }

  async function addUser(email: string) {
    const { data } = await supabase
      .from('users')
      .insert({ email })
      .select()
      .single();
    if (data) dispatch({ type: 'ADD_USER', payload: data });
  }

  async function updateUser(id: number, email: string) {
    const { data } = await supabase
      .from('users')
      .update({ email })
      .eq('id', id)
      .select()
      .single();
    if (data) dispatch({ type: 'UPDATE_USER', payload: data });
  }

  async function deleteUser(id: number) {
    await supabase.from('users').delete().eq('id', id);
    dispatch({ type: 'DELETE_USER', payload: id });
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <UserContext.Provider
      value={{ state, getUsers, addUser, updateUser, deleteUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
