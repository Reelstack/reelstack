import { motion } from 'motion/react';
import styles from './styles.module.css';

type SignUpFormProps = {
  onSwitch: () => void;
};

export function SignUpForm({ onSwitch }: SignUpFormProps) {
  return (
    <motion.form
      key='signup'
      className={styles.loginForm}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
    >
      <h2>Sign Up</h2>
      <div className={styles.formGroup}>
        <input className={styles.formInput} type='text' placeholder='Email' />

        <input
          className={styles.formInput}
          type='password'
          placeholder='Password'
        />

        <input
          className={styles.formInput}
          type='password'
          placeholder='Confirm Password'
        />
      </div>

      <div className={styles.formGroup}>
        <button className={styles.formButton}>Sign Up</button>
      </div>
      <div className={styles.formGroup}>
        <div className={styles.signup}>
          Already have an account?
          <a
            href='#'
            onClick={e => {
              e.preventDefault();
              onSwitch();
            }}
          >
            Login Now
          </a>
        </div>
      </div>
    </motion.form>
  );
}
