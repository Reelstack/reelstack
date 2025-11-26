import styles from './styles.module.css';
import { MoviesService, type Movie } from '../../services/api/supa-api/movies';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { MovieSearchModal } from '../MovieSearchModal';

const MOVIES_PER_PAGE = 18;

interface MovieStackProps {
  title: string;
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  color?: string;
  interactionType?: 'like' | 'dislike';
  allUserMovies?: Movie[];
}

export function MovieStack({
  title,
  movies,
  setMovies,
  color = 'var(--success)',
  interactionType = 'like',
  allUserMovies = [],
}: MovieStackProps) {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const historyRef = useRef<HTMLDivElement | null>(null);
  const shouldScroll = useRef(false);
  const [isHover, setHover] = useState<string | null>(null);
  const [removingMovieId, setRemovingMovieId] = useState<string | null>(null);
  const [newlyAddedMovieId, setNewlyAddedMovieId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserMovies() {
      setLoading(true);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) throw toast.error('User not logged in');

        const profileId = session.user.id;

        const userMovies = await MoviesService.getUserMovies(
          profileId,
          interactionType,
        );
        if (userMovies && userMovies.length > 0) {
          setMovies(userMovies);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load movies.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadUserMovies();
  }, [interactionType, setMovies]);

  async function handleSelectMovie(movie: Movie) {
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('User not logged in');
        return;
      }

      const profileId = session.user.id;

      const allMoviesToCheck = allUserMovies.length > 0 ? allUserMovies : movies;
      const isDuplicate = allMoviesToCheck.some(m => m.tconst === movie.tconst);
      if (isDuplicate) {
        const duplicateMovie = allMoviesToCheck.find(m => m.tconst === movie.tconst);
        toast.error(`"${duplicateMovie?.primary_title || 'This movie'}" is already in your list.`);
        setLoading(false);
        return;
      }

      try {
        const { data: existing } = await supabase
          .from('user_movie_interactions')
          .select('id, interaction_type')
          .eq('profile_id', profileId)
          .eq('movie_id', movie.tconst)
          .maybeSingle();

        if (existing) {
          const interactionTypeText = existing.interaction_type === 'like' ? 'liked' : 'disliked';
          toast.error(`This movie is already in your ${interactionTypeText} list.`);
          setLoading(false);
          return;
        }
      } catch (dbCheckError) {
        console.warn('Failed to check duplicate in database:', dbCheckError);
      }

      setMovies(prev => [movie, ...prev]);
      setNewlyAddedMovieId(movie.tconst);

      setPage(0);

      await MoviesService.addUserMovieInteraction({
        profileId,
        movieId: movie.tconst,
        interactionType,
      });

      setTimeout(() => {
        setNewlyAddedMovieId(null);
      }, 350);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMovie(movie: Movie, event: React.MouseEvent) {
    event.stopPropagation();

    setRemovingMovieId(movie.tconst);

    setTimeout(async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          toast.error('User not logged in');
          setRemovingMovieId(null);
          return;
        }

        const profileId = session.user.id;

        await MoviesService.removeUserMovieInteraction({
          profileId,
          movieId: movie.tconst,
          interactionType,
        });

        const updatedMovies = movies.filter(m => m.tconst !== movie.tconst);

        const newTotalPages = Math.ceil(updatedMovies.length / MOVIES_PER_PAGE);
        if (newTotalPages === 0) {
          setPage(0);
        } else if (page >= newTotalPages) {
          setPage(newTotalPages - 1);
        }


        setMovies(updatedMovies);
        setRemovingMovieId(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove movie');
        setRemovingMovieId(null);
      }
    }, 250);
  }

  function handleAddMovie() {
    setIsSearchModalOpen(true);
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
          <h3 style={{ color: 'var(--contrast)' }}>Add</h3>
        </button>
      </div>

      <MovieSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectMovie={handleSelectMovie}
        loading={loading}
        excludedMovieIds={allUserMovies.length > 0 ? allUserMovies.map(m => m.tconst) : movies.map(m => m.tconst)}
      />

      {loading && (
        <div className={styles.loading}>
          <p>Processing...</p>
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
            className={`${styles.moviePoster} ${removingMovieId === m.tconst ? styles.removing : ''
              } ${newlyAddedMovieId === m.tconst ? styles.adding : ''
              }`}
            onMouseEnter={() => !removingMovieId && setHover(m.tconst)} // passa o id
            onMouseLeave={() => setHover(null)} // reseta
          >
            <img
              src={m.banner || '/placeholder-poster.jpg'}

              alt={m.primary_title ?? 'Movie poster'}
              onError={e => {
                (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
              }}
            />
            {isHover === m.tconst && !removingMovieId && ( // checa o id
              <div className={styles.movieName}>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleRemoveMovie(m, e)}
                  disabled={loading || removingMovieId !== null}
                  aria-label={`Remove ${m.primary_title ?? 'movie'}`}
                  title="Remove movie"
                >
                  ×
                </button>
                <p>{m.primary_title ?? 'Unknown Title'}</p>
                <p>({m.start_year ?? 'Unknown Year'})</p>
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
