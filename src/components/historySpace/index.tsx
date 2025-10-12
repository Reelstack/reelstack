import styles from './styles.module.css';
import type { OMDBMovie } from '../../services/api/omdb/types';
import { omdb } from '../../services/ombdClient';
import { useEffect, useRef, useState } from 'react';

const MOVIES_PER_PAGE = 18;

interface CollectionProps {
  title: string;
  movies: OMDBMovie[];
  setMovies: React.Dispatch<React.SetStateAction<OMDBMovie[]>>;
  color?: string;
}

export function Collection({
  title,
  movies,
  setMovies,
  color = 'var(--success)',
}: CollectionProps) {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const shouldScroll = useRef(false);
  const [isHover, setHover] = useState<string | null>(null);

  async function handleAddMovie() {
    const titlePrompt = prompt('Movie name?');
    if (!titlePrompt) return;

    setLoading(true);
    setError(null);

    try {
      const movie = await omdb.getMovieByTitle(titlePrompt);

      // checa por posteres
      if (!movie.Poster || movie.Poster === 'N/A') {
        setError('Poster not available.');
        return;
      }

      // checa duplicata
      setMovies(prev => {
        if (prev.some(m => m.imdbID === movie.imdbID)) {
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
  const current = movies.slice(start, start + MOVIES_PER_PAGE);
  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);

  // scrolla o usuario pra area de filmes(evitar irritação)
  useEffect(() => {
    if (shouldScroll.current) {
      historyRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScroll.current = false; // desliga o scroll
    }
  }, [page]);
  return (
    <div className={styles.history}>
      <div className={styles.infoRow}>
        <h1 style={{ color }}>{title}</h1>

        <button
          className={styles.edit}
          onClick={handleAddMovie}
          disabled={loading}
        >
          {/* trocar svg no futuro */}
          <h3 style={{ color: 'var(--contrast)' }}>Edit</h3>
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.historySpace} ref={historyRef}>
        {current.length === 0 && (
          <div className={styles.empty}>
            <p>No movies yet. Click edit and add some, will you?</p>
          </div>
        )}
        {current.map(m => (
          <div
            key={m.imdbID}
            className={styles.moviePoster}
            onMouseEnter={() => setHover(m.imdbID)} // passa o id
            onMouseLeave={() => setHover(null)} // reseta
          >
            <img src={m.Poster} alt={m.Title} />
            {isHover === m.imdbID && ( // checa o id
              <div className={styles.movieName}>
                <p>{m.Title}</p>
                <p>({m.Year})</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => {
              setPage(p => p - 1);
              shouldScroll.current = true;
            }}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`${styles.pageNumber} ${page === i ? styles.active : ''}`}
              onClick={() => {
                setPage(i);
                shouldScroll.current = true;
              }}
            >
              {i + 1}
            </button>
          ))}

          <button
            className={styles.pageBtn}
            disabled={page === totalPages - 1}
            onClick={() => {
              setPage(p => p + 1);
              shouldScroll.current = true;
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
