import styles from './styles.module.css';
import { useState } from 'react';
import type { OMDBMovie } from '../../services/api/types';
import { Collection } from '../historySpace';

export function ProfileSpace() {
  const [likedMovies, setLikedMovies] = useState<OMDBMovie[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<OMDBMovie[]>([]);
  return (
    <div className={styles.profileSpace}>
      <div className={styles.userSpace}>
        <div className={styles.userInfo}>
          <h1 style={{ textAlign: 'center' }}>nomem ipsum</h1>
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

      <Collection
        title='Liked Movies'
        movies={likedMovies}
        setMovies={setLikedMovies}
        color='var(--success)'
      />
      <Collection
        title='Disliked Movies'
        movies={dislikedMovies}
        setMovies={setDislikedMovies}
        color='var(--error)'
      />

      <div className={styles.footer}>teste 4</div>
    </div>
  );
}
