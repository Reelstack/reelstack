import styles from './style.module.css';
import { LoginForm } from '../../components/LoginForm';
import { useState } from 'react';
import { SignUpForm } from '../../components/SignUpForm';

import { AnimatePresence, motion } from 'motion/react';

export function Login() {
  const [isSigning, setIsSigning] = useState(false);

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
