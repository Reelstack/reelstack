import styles from './styles.module.css';
import { MoviesService, type Movie } from '../../services/api/supa-api/movies';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MOVIES_PER_PAGE = 18;

interface MovieStackProps {
  title: string;
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  color?: string;
  interactionType?: 'like' | 'dislike';
}

export function MovieStack({
  title,
  movies,
  setMovies,
  color = 'var(--success)',
  interactionType = 'like',
}: MovieStackProps) {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const shouldScroll = useRef(false);
  const [isHover, setHover] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserMovies() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error('User not logged in');

        const profileId = session.user.id;

        const userMovies = await MoviesService.getUserMovies(
          profileId,
          interactionType,
        );
        if (userMovies && userMovies.length > 0) {
          setMovies(userMovies);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies.');
      } finally {
        setLoading(false);
      }
    }

    loadUserMovies();
  }, [interactionType, setMovies]);

  async function handleAddMovie() {
    const titlePrompt = prompt('Movie name?');
    if (!titlePrompt) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('User not logged in');

      const profileId = session.user.id; // Supabase ID
      // Busca filmes com o título digitado
      const { data, error } = await MoviesService.searchMovies(
        {
          title: titlePrompt,
        },
        1,
      ); // limita a 1 resultado

      // TODO: Implement poster validation when available
      // if (!movie.posterUrl || movie.posterUrl === 'N/A') {
      //   setError('Poster not available.');
      //   return;
      // }
      if (error) throw error;
      if (!data || data.length === 0) {
        setError('Movie not found.');
        return;
      }

      const movie = data[0];

      // Checa duplicata
      setMovies(prev => {
        if (prev.some(m => m.tconst === movie.tconst)) {
          setError('Movie already added.');
          return prev;
        }
        return [movie, ...prev];
      });
      // atualiza a pagina
      setPage(0);
      //salva os filmes interagidos do usuario
      await MoviesService.addUserMovieInteraction({
        profileId,
        movieId: movie.tconst,
        interactionType,
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

      {loading && (
        <div className={styles.loading}>
          <p>Searching for movies...</p>
        </div>
      )}

      <div className={styles.historySpace} ref={historyRef}>
        {current.length === 0 && !loading && (
          <div className={styles.empty}>
            <p>No movies yet. Click edit and add some, will you?</p>
          </div>
        )}
        {current.map(m => (
          <div
            key={m.tconst}
            className={styles.moviePoster}
            onMouseEnter={() => setHover(m.tconst)} // passa o id
            onMouseLeave={() => setHover(null)} // reseta
          >
            <img
              /* src={m.posterUrl || '/placeholder-poster.jpg'} */
              src={'/goncha.jpg'}
              alt={m.primaryTitle ?? 'Movie poster'}
              onError={e => {
                (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
              }}
            />
            {isHover === m.tconst && ( // checa o id
              <div className={styles.movieName}>
                <p>{m.primaryTitle ?? 'Unknown Title'}</p>
                <p>({m.startYear ?? 'Unknown Year'})</p>
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
