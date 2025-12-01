import { createContext, useReducer, useEffect } from 'react';
import { userReducer } from './userReducer';
import type { State, UserProfile } from './userTypes';
import { supabase } from '../../lib/supabaseClient';

interface ContextProps {
  state: State;
  getUsers: () => Promise<void>;
  addUser: (user: {
    email: string;
    password: string;
  }) => Promise<UserProfile | null>;
  updateUser: (id: string, email: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const UserContext = createContext<ContextProps | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, {
    users: [] as UserProfile[],
    loading: false,
    error: null,
  });

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
  }): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Signup error:', error.message);
      return null;
    }

    if (data.user) {
      // Gera um identificador único e não sensível para profile_name
      const uniqueProfileName = `user_${crypto.randomUUID()}`;
      const newUser: UserProfile = {
        id: data.user.id,
        profile_name: uniqueProfileName, // valor único e não sensível
        avatar_url: null, // valor padrão null
        bio: null, // valor padrão null
        created_at: new Date().toISOString(), // ou deixe o banco preencher
        updated_at: new Date().toISOString(), // ou deixe o banco preencher
      };
      // Insert the new user into the 'profiles' table
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([newUser]);
      if (insertError) {
        console.error(
          'Error inserting user into profiles table:',
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
