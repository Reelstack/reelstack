import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../../lib/supabaseClient';

type AuthContextType = {
  user: Users | null;
  setUser: (user: Users | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Users | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const authUser = sessionData.user;

      if (authUser?.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();

        setUser(dbUser ?? null);
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user?.email) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          setUser(dbUser ?? null);
        } else {
          setUser(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
