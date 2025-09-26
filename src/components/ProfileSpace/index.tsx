import styles from './styles.module.css';

export function ProfileSpace() {
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
            <h4>Favourite Genre:</h4>
            <p className={styles.stats}>Action</p>
            <h4>Movies Disliked:</h4>
            <p className={styles.stats}>210</p>
          </div>
          <div className={styles.statsRow}>
            <h4>Favourite Actor:</h4>
            <p className={styles.stats}>Kevin Spacey</p>
            <h4>Favourite Director:</h4>
            <p className={styles.stats}>Jeffrey Epstein</p>
            <h4>Favourite Decade:</h4>
            <p className={styles.stats}>2001</p>
          </div>
        </div>
      </div>
      {/* componentizar no futuro*/}
      <div className={styles.history}>
        <h1>Liked Movies</h1>
        <div className={styles.historySpace}>
          <div className={styles.moviePoster}>
            <img src='/goncha.jpg' />
          </div>
          <div className={styles.moviePoster}>
            <img src='/goncha.jpg' />
          </div>
          <div className={styles.moviePoster}>
            <img src='/goncha.jpg' />
          </div>
          <div className={styles.moviePoster}>
            <img src='/goncha.jpg' />
          </div>
          <div className={styles.moviePoster}>
            <img src='/goncha.jpg' />
          </div>
        </div>
      </div>
      <div className={styles.footer}>teste 4</div>
    </div>
  );
}
