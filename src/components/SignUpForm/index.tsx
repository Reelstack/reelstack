import { AnimatePresence, motion } from 'motion/react';
import styles from './styles.module.css';
import { useState } from 'react';
import { useUsers } from '../../contexts/UserContext/userHook';
import toast from 'react-hot-toast';
import type { Movie } from '../../services/api/supa-api/movies';
import { MovieSearchModal } from '../MovieSearchModal';

type SignUpFormProps = {
  onSwitch: () => void;
};

export function SignUpForm({ onSwitch }: SignUpFormProps) {
  const { addUser } = useUsers();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
  const [openLikeModal, setOpenLikeModal] = useState(false);
  const [openDislikeModal, setOpenDislikeModal] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rules = [
      { test: () => !!email, msg: 'Email is required.' },
      {
        test: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        msg: 'Invalid email format.',
      },
      { test: () => !!name.trim(), msg: 'Name is required.' },
      {
        test: () => likedMovies.length >= 5,
        msg: 'Please select at least 5 movies you like.',
      },
      {
        test: () => dislikedMovies.length >= 5,
        msg: 'Please select at least 5 movies you dislike.',
      },
      { test: () => !!password, msg: 'Password is required.' },
      {
        test: () => password.length >= 8,
        msg: 'Password must be at least 8 characters.',
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
      setError(errors);
      return;
    }

    setError([]);
    setLoading(true);

    // call addUser
    const authUser = await addUser({ email, password, display_name: name });

    setLoading(false);

    if (authUser) {
      toast.success(
        <>
          Account created successfully!
          <br />
          Please check your email notifications
          <br />
          to authenticate your account.
          <br />
          <br />
          Welcome to ReelStack!
        </>,
      );
      setEmail('');
      setPassword('');
      setName('');
      setConfirm('');
      console.log('User signed up:', authUser);
    } else {
      toast.error('Failed to create user. Please try again.');
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

      {/* ------------------ 3 colunas ------------------ */}
      <div className={styles.columns}>
        {/* esquerda/inputs */}
        <div className={styles.column}>
          <div className={styles.formGroup}>
            <input
              className={styles.formInput}
              type='text'
              placeholder='Name'
              value={name}
              onChange={e => setName(e.target.value)}
            />

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
        </div>

        {/* meio/liked */}
        <div className={styles.column}>
          <div className={styles.formGroup}>
            <h4>Select at least 5 movies you LIKE</h4>

            <button
              type='button'
              className={styles.formButton}
              onClick={() => setOpenLikeModal(true)}
            >
              Add Liked Movie
            </button>

            <ul>
              {likedMovies.map(m => (
                <li key={m.tconst}>{m.primary_title}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* direita/disliked */}
        <div className={styles.column}>
          <div className={styles.formGroup}>
            <h4>Select at least 5 movies you DISLIKE</h4>

            <button
              type='button'
              className={styles.formButton}
              onClick={() => setOpenDislikeModal(true)}
            >
              Add Disliked Movie
            </button>

            <ul>
              {dislikedMovies.map(m => (
                <li key={m.tconst}>{m.primary_title}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ------------------ erros e submit ------------------ */}
      <div className={styles.formGroup}>
        {error.length > 0 && (
          <div>
            <AnimatePresence mode='wait'>
              {error.map((err, index) => (
                <motion.p
                  key={index}
                  className={styles.error}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {err}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        )}

        <MovieSearchModal
          isOpen={openLikeModal}
          onClose={() => setOpenLikeModal(false)}
          onSelectMovie={movie =>
            setLikedMovies(prev =>
              prev.some(m => m.tconst === movie.tconst)
                ? prev
                : [...prev, movie],
            )
          }
          excludedMovieIds={[
            ...likedMovies.map(m => m.tconst),
            ...dislikedMovies.map(m => m.tconst),
          ]}
        />

        <MovieSearchModal
          isOpen={openDislikeModal}
          onClose={() => setOpenDislikeModal(false)}
          onSelectMovie={movie =>
            setDislikedMovies(prev =>
              prev.some(m => m.tconst === movie.tconst)
                ? prev
                : [...prev, movie],
            )
          }
          excludedMovieIds={[
            ...likedMovies.map(m => m.tconst),
            ...dislikedMovies.map(m => m.tconst),
          ]}
        />

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
