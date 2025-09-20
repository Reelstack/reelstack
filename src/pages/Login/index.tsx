import styles from './style.module.css';
import { LoginForm } from '../../components/LoginForm';
import { useEffect, useState } from 'react';
import { SignUpForm } from '../../components/SignUpForm';
import { AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export function Login() {
  const [isSigning, setIsSigning] = useState(false);
  const [users, setUsers] = useState<Users[]>([]);

  useEffect(() => {
    getUsers();
  }, []);
  async function getUsers() {
    const { data } = await supabase.from<'users', Users>('users').select();
    setUsers(data ?? []);
  }

  useEffect(() => {
    console.log(users.map(user => user.email));
  }, [users]);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.formWrapper}>
          <AnimatePresence mode='wait'>
            {!isSigning ? (
              <LoginForm key='login' onSwitch={() => setIsSigning(true)} />
            ) : (
              <SignUpForm key='signup' onSwitch={() => setIsSigning(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
