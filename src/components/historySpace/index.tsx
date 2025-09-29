import styles from './styles.module.css';
import dots from '../../assets/dots-horizontal-svgrepo-com.svg';
import type { OMDBMovie } from '../../services/api/types';
import { omdb } from '../../services/ombdClient';
import { useEffect, useRef, useState } from 'react';

const MOVIES_PER_PAGE = 18;

export function HistorySpace() {
  const [likedMovies, setLikedMovies] = useState<OMDBMovie[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  async function handleAddMovie() {
    const title = prompt('Movie name?');
    if (!title) return;

    setLoading(true);
    setError(null);

    try {
      const movie = await omdb.getMovieByTitle(title);

      // checa por posteres
      if (!movie.Poster || movie.Poster === 'N/A') {
        setError('Poster not available.');
        return;
      }

      // checa duplicata
      setLikedMovies(prev => {
        const exists = prev.some(m => m.imdbID === movie.imdbID);
        if (exists) {
          setError('Movie already added.');
          return prev;
        }
        setPage(0);
        return [movie, ...prev];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // logica do indice das páginas, mudar movies per page caso mudança de design
  const start = page * MOVIES_PER_PAGE;
  const end = start + MOVIES_PER_PAGE;
  const currentPageMovies = likedMovies.slice(start, end);
  const totalPages = Math.ceil(likedMovies.length / MOVIES_PER_PAGE);

  // scrolla o usuario pra area de filmes(evitar irritação)
  useEffect(() => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [page]);
  return (
    <div className={styles.history}>
      <div className={styles.infoRow}>
        <h1 style={{ color: 'var(--success)' }}>Liked Movies</h1>

        <button
          className={styles.edit}
          onClick={handleAddMovie}
          disabled={loading}
        >
          {/* trocar svg no futuro */}
          <img src={dots} style={{ width: '4rem' }} />
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.historySpace} ref={historyRef}>
        {currentPageMovies.length === 0 && (
          <p className={styles.empty}>No movies yet. Click ... to add one!</p>
        )}
        {currentPageMovies.map(m => (
          <div key={m.imdbID} className={styles.moviePoster}>
            <img src={m.Poster} alt={m.Title} />
          </div>
        ))}
      </div>
      {totalPages >= 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`${styles.pageNumber} ${page === i ? styles.active : ''}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className={styles.pageBtn}
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
