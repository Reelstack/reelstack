import styles from './style.module.css';
import { LoginForm } from '../../components/LoginForm';
import { useEffect, useState } from 'react';
import { SignUpForm } from '../../components/SignUpForm';
import { supabase } from '../../lib/supabaseClient';
import { AnimatePresence, motion } from 'motion/react';


type Users = {
  email: string;
  // Add other user properties as needed
};
export function Login() {
  const [isSigning, setIsSigning] = useState(false);
  const [users, setUsers] = useState<DBusers[]>([]);

  // pega usuarios pro log
  useEffect(() => {
    getUsers();
  }, []);
  async function getUsers() {
    const { data } = await supabase.from<'users', DBusers>('users').select();
    setUsers(data ?? []);
  }
  // mostra usuarios no log
  useEffect(() => {
    console.log(users.map(user => user.email));
  }, [users]);

  return (
    <>
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
    </>
  );
}
