import styles from './styles.module.css';
import { useState } from 'react';
import { MovieStack } from '../MovieStack';
import type { Movie } from '../../services/api/supa-api/movies';

export function ProfileSpace() {
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
  return (
    <div className={styles.profileSpace}>
      <div className={styles.userSpace}>
        <div className={styles.userInfo}>
          <h1 style={{ textAlign: 'center' }}>nome ipsum</h1>
          <h3>email ipsum dolor si amet</h3>
          <h3>telefonen ipsum</h3>
        </div>
        {/* componentizar no futuro*/}
        <div className={styles.userStats}>
          <div className={styles.statsRow}>
            <h4>Movies Liked:</h4>
            <p className={styles.stats}>420</p>
            <h4>Movies Disliked:</h4>
            <p className={styles.stats}>210</p>
          </div>
          <div className={styles.statsRow}>
            <h4>Favourite Actor:</h4>
            <p className={styles.stats}>Idris Elba</p>
            <h4>Favourite Director:</h4>
            <p className={styles.stats}>Quentin Tarantino</p>
          </div>
          <div className={styles.statsRow}>
            <h4>Favourite Genre:</h4>
            <p className={styles.stats}>Action</p>
            <h4>Favourite Decade:</h4>
            <p className={styles.stats}>2001</p>
          </div>
        </div>
      </div>

      <MovieStack
        title='Liked Movies'
        movies={likedMovies}
        setMovies={setLikedMovies}
        color='var(--success)'
        interactionType='like'
      />
      <MovieStack
        title='Disliked Movies'
        movies={dislikedMovies}
        setMovies={setDislikedMovies}
        color='var(--error)'
        interactionType='dislike'
      />

      <div className={styles.footer}>teste 4</div>
    </div>
  );
}
