import styles from './style.module.css';
import { LoginForm } from '../../components/LoginForm';
import { useState } from 'react';
import { SignUpForm } from '../../components/SignUpForm';
import { AnimatePresence } from 'motion/react';

export function Login() {
  const [isSigning, setIsSigning] = useState(false);

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
