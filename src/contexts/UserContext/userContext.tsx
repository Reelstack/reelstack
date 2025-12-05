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
    display_name: string;
  }) => Promise<UserProfile | null>;
  updateUser: (
    id: string,
    email: string,
    display_name: string,
  ) => Promise<void>;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    dispatch({
      type: 'SET_USERS',
      payload: [
        {
          ...profile,
          display_name: user.user_metadata?.display_name ?? null,
        },
      ],
    });
  }

  async function updateUser(id: string, email: string, display_name: string) {
    // updates the metadata
    await supabase.auth.updateUser({
      email,
      data: { display_name },
    });

    // atualizar table caso necessário (bio,imagem)
    const { data } = await supabase
      .from('profiles')
      .update({})
      .eq('id', id)
      .select()
      .single();

    dispatch({
      type: 'UPDATE_USER',
      payload: {
        ...data,
        display_name,
      },
    });
  }

  async function addUser({
    email,
    password,
    display_name,
  }: {
    email: string;
    password: string;
    display_name: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      return null;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user!.id,
          bio: null,
          avatar_url: null,
        },
      ])
      .select()
      .single();

    return {
      ...profileData,
      display_name,
    };
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
