import styles from './style.module.css';
import MovieSearch from '../../components/MovieSearch';

export function Home() {
  return (
    <>
      <div className={styles.header}>
        <h1>BeelBack</h1>
        <p>
        </p>
      </div>
      <MovieSearch />
    </>
  );
}
