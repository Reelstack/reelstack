import React, { createContext, useReducer, useEffect } from 'react';
import { userReducer } from './userReducer';
import type { State } from './userTypes';
import { supabase } from '../../lib/supabaseClient';

interface ContextProps {
  state: State;
  getUsers: () => Promise<void>;
  addUser: (user: { email: string; password: string }) => Promise<Users | null>;
  updateUser: (id: number, email: string) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const UserContext = createContext<ContextProps | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, { users: [] as Users[] });

  async function getUsers() {
    const { data } = await supabase.from('users').select();
    if (data) dispatch({ type: 'SET_USERS', payload: data as Users[] });
  }

  async function updateUser(id: number, email: string) {
    const { data } = await supabase
      .from('users')
      .update({ email })
      .eq('id', id)
      .select()
      .single();

    if (data) dispatch({ type: 'UPDATE_USER', payload: data as Users });
  }

  async function addUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const { data: user, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error.message);
      return null;
    }

    if (user) {
      const { data: dbUser } = await supabase
        .from('users')
        .insert({ email })
        .select()
        .single();

      if (dbUser) dispatch({ type: 'ADD_USER', payload: dbUser });
      return dbUser;
    }

    return null;
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
