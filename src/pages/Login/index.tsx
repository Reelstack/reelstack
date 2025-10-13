import styles from './style.module.css';
import { LoginForm } from '../../components/LoginForm';
import { SignUpForm } from '../../components/SignUpForm';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from '../../contexts/UserContext/userTypes';

export function Login() {
  const [isSigning, setIsSigning] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // pega usuarios pro log
  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {
    const { data } = await supabase.from('profiles').select();
    setUsers((data ?? []) as User[]);
  }

  // mostra usuarios no log
  useEffect(() => {
    console.log(users.map(user => user.email));
  }, [users]);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.formWrapper}
        layout
        key={isSigning ? 'signup' : 'login'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <AnimatePresence mode='wait'>
          {!isSigning ? (
            <LoginForm key='login' onSwitch={() => setIsSigning(true)} />
          ) : (
            <SignUpForm key='signup' onSwitch={() => setIsSigning(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
