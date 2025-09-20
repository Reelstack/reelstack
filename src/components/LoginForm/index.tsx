import { motion } from 'motion/react';
import styles from './styles.module.css';
import { useState } from 'react';
import { useUsers } from '../../contexts/UserContext/userHook';
import { supabase } from '../../lib/supabaseClient';

type LoginFormProps = {
  onSwitch: () => void;
};

export function LoginForm({ onSwitch }: LoginFormProps) {
  const { getUsers } = useUsers();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    // Sign in
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
    } else {
      console.log('Logged in user:', data.user);
      // refresh
      getUsers();
      setEmail('');
      setPassword('');
    }
  };

  return (
    <motion.form
      key='login'
      className={styles.loginForm}
      initial={{ opacity: 0, x: 30, height: 'auto' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleLogin}
    >
      <h2>Login</h2>
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
      </div>

      <div className={styles.formGroup}>
        {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
        <button className={styles.formButton}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.signup}>
          Don't have an account?
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
