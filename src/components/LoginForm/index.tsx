import { motion } from 'motion/react';
import styles from './styles.module.css';

type LoginFormProps = {
  onSwitch: () => void;
};

export function LoginForm({ onSwitch }: LoginFormProps) {
  return (
    <motion.form
      key='login'
      className={styles.loginForm}
      initial={{ opacity: 0, x: +30 }}
      animate={{ opacity: 1, x: +0 }}
      exit={{ opacity: 0, x: +30 }}
      transition={{ duration: 0.2 }}
    >
      <h2>ReelStack</h2>
      <div className={styles.formGroup}>
        <input className={styles.formInput} type='text' placeholder='Email' />

        <input
          className={styles.formInput}
          type='password'
          placeholder='Password'
        />
        <h6>Forgot your password?</h6>
      </div>

      <div className={styles.formGroup}>
        <button className={styles.formButton}>Login</button>
      </div>
      <div className={styles.formGroup}>
        <div className={styles.signup}>
          Don't have an account yet?
          <a
            href='#'
            onClick={e => {
              e.preventDefault();
              onSwitch();
            }}
          >
            Sign Up
          </a>
        </div>
      </div>
    </motion.form>
  );
}
