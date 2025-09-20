import { motion } from 'motion/react';
import styles from './styles.module.css';
import { useState } from 'react';

type SignUpFormProps = {
  onSwitch: () => void;
};

export function SignUpForm({ onSwitch }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Simple validation
    if (!email || !password || !confirm) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    console.log('Sign Up Data:', { email, password, confirm });
  };

  return (
    <motion.form
      key='signup'
      className={styles.loginForm}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
    >
      <h2>Sign Up</h2>
      <div className={styles.formGroup}>
        <input
          className={styles.formInput}
          type='text'
          placeholder='Email'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className={styles.formInput}
          type='password'
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <input
          className={styles.formInput}
          type='password'
          placeholder='Confirm Password'
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
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
