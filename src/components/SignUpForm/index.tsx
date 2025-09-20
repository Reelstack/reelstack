import { AnimatePresence, motion } from 'motion/react';
import styles from './styles.module.css';
import { useState } from 'react';
import { useUsers } from '../../contexts/UserContext/userHook';

type SignUpFormProps = {
  onSwitch: () => void;
};

export function SignUpForm({ onSwitch }: SignUpFormProps) {
  const { addUser } = useUsers();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rules = [
      { test: () => !!email, msg: 'Email is required.' },
      {
        test: () => email.includes('@') && email.endsWith('.com'),
        msg: 'Invalid email format.',
      },
      { test: () => !!password, msg: 'Password is required.' },
      {
        test: () => password.length >= 8,
        msg: 'Password must be at least 12 characters.',
      },
      {
        test: () => /[A-Z]/.test(password),
        msg: 'Password must include at least one uppercase letter.',
      },
      {
        test: () => /[a-z]/.test(password),
        msg: 'Password must include at least one lowercase letter.',
      },
      {
        test: () => /[0-9]/.test(password),
        msg: 'Password must include at least one number.',
      },
      {
        test: () => /[!@#$%^&*]/.test(password),
        msg: 'Password must include at least one symbol.',
      },
      { test: () => password === confirm, msg: 'Passwords do not match.' },
    ];

    const errors = rules.filter(rule => !rule.test()).map(rule => rule.msg);

    if (errors.length) {
      setError(errors.join('\n'));
      return;
    }

    setError('');
    setLoading(true);

    // call addUser from your context
    const newUser = await addUser({ email, password });

    setLoading(false);

    if (newUser) {
      setEmail('');
      setPassword('');
      setConfirm('');
      console.log('User signed up:', newUser);
    } else {
      setError('Failed to create user.');
    }
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
        <AnimatePresence mode='wait'>
          {error && (
            <motion.p
              className={styles.error}
              key={error}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <button className={styles.formButton} disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
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
