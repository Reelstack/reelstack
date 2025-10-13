import { createContext, useReducer, useEffect } from 'react';
import { userReducer } from './userReducer';
import type { State, User } from './userTypes';
import { supabase } from '../../lib/supabaseClient';

interface ContextProps {
  state: State;
  getUsers: () => Promise<void>;
  addUser: (user: { email: string; password: string }) => Promise<User | null>;
  updateUser: (id: string, email: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const UserContext = createContext<ContextProps | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, { users: [] as User[] });

  async function getUsers() {
    const { data } = await supabase.from('profiles').select();
    if (data) dispatch({ type: 'SET_USERS', payload: data });
  }

  async function updateUser(id: string, email: string) {
    const { data } = await supabase
      .from('profiles')
      .update({ email })
      .eq('id', id)
      .select()
      .single();

    if (data) dispatch({ type: 'UPDATE_USER', payload: data });
  }

  async function addUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<User | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Signup error:', error.message);
      return null;
    }

    if (data.user) {
      // convert Supabase Auth user to your User type
      const newUser = { id: data.user.id, email: data.user.email ?? null };
      // Insert the new user into the 'users' table
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: newUser.id, email: newUser.email }]);
      if (insertError) {
        console.error(
          'Error inserting user into users table:',
          insertError.message,
        );
        return null;
      }
      dispatch({ type: 'ADD_USER', payload: newUser });
      return newUser;
    }

    return null;
  }

  async function deleteUser(id: string) {
    await supabase.from('profiles').delete().eq('id', id);
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
