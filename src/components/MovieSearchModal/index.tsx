import { useState, useEffect, useRef, useCallback } from 'react';
import { MoviesService, type Movie } from '../../services/api/supa-api/movies';
import styles from './styles.module.css';

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  loading?: boolean;
  excludedMovieIds?: string[]; // ids já na lista do usuario
}

export function MovieSearchModal({
  isOpen,
  onClose,
  onSelectMovie,
  loading: externalLoading = false,
  excludedMovieIds = [],
}: MovieSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef<string>('');
  const resultsRef = useRef<Movie[]>([]);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    resultsRef.current = results;
    setSelectedIndex(-1);
  }, [results]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      setSearchQuery('');
      setError(null);
      searchQueryRef.current = '';
      return;
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const currentQuery = searchQuery.trim();

      setLoading(true);
      setError(null);

      try {
        const { data, error: searchError } = await MoviesService.searchMovies(
          {
            title: currentQuery,
          },
          20,
          0,
          'primary_title',
          true,
        );

        if (searchQueryRef.current.trim() !== currentQuery) {
          setLoading(false);
          return;
        }

        if (searchError) {
          setError('Failed to search movies. Please try again.');
          setResults([]);
          return;
        }

        if (!data || data.length === 0) {
          setError('No movies found. Try a different search term.');
          setResults([]);
          return;
        }

        setResults(data);
      } catch (err) {
        if (searchQueryRef.current.trim() === currentQuery) {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred',
          );
          setResults([]);
        }
      } finally {
        if (
          searchQueryRef.current.trim() === currentQuery ||
          !searchQueryRef.current.trim()
        ) {
          setLoading(false);
        }
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const handleSelectMovie = useCallback(
    (movie: Movie) => {
      // Prevent selecting already added movies
      if (excludedMovieIds.includes(movie.tconst)) {
        return;
      }
      onSelectMovie(movie);
      onClose();
      setSearchQuery('');
      setResults([]);
    },
    [onSelectMovie, onClose, excludedMovieIds],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const maxIndex = resultsRef.current.length - 1;
          return prev < maxIndex ? prev + 1 : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedMovie = resultsRef.current[selectedIndex];
        if (selectedMovie) {
          handleSelectMovie(selectedMovie);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, handleSelectMovie]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2>Search for a Movie</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input
            ref={inputRef}
            type='text'
            className={styles.searchInput}
            placeholder='Type movie name...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            disabled={externalLoading}
            aria-label='Search for movies'
            aria-autocomplete='list'
            aria-expanded={results.length > 0}
            role='combobox'
          />
          {loading && (
            <div className={styles.loadingIndicator}>Searching...</div>
          )}
        </div>

        <div className={styles.resultsContainer}>
          {error && <div className={styles.error}>{error}</div>}

          {!loading &&
            !error &&
            results.length === 0 &&
            searchQuery.trim().length >= 2 && (
              <div className={styles.empty}>
                No results found. Try typing more of the movie name.
              </div>
            )}

          {!loading &&
            !error &&
            searchQuery.trim().length > 0 &&
            searchQuery.trim().length < 2 && (
              <div className={styles.empty}>
                Type at least 2 characters to search...
              </div>
            )}

          {!loading && !error && searchQuery.trim() && results.length > 0 && (
            <ul className={styles.resultsList} role='listbox'>
              {results.map((movie, index) => {
                const isAlreadyAdded = excludedMovieIds.includes(movie.tconst);
                return (
                  <li
                    key={movie.tconst}
                    ref={selectedIndex === index ? selectedItemRef : null}
                    className={`${styles.resultItem} ${selectedIndex === index ? styles.selected : ''} ${isAlreadyAdded ? styles.alreadyAdded : ''}`}
                    onClick={() => !isAlreadyAdded && handleSelectMovie(movie)}
                    role='option'
                    aria-selected={selectedIndex === index}
                    aria-disabled={isAlreadyAdded}
                  >
                    <div className={styles.resultContent}>
                      <div className={styles.movieInfo}>
                        <h3 className={styles.movieTitle}>
                          {movie.primary_title || 'Unknown Title'}
                        </h3>
                        {movie.original_title &&
                          movie.original_title !== movie.primary_title && (
                            <p className={styles.originalTitle}>
                              {movie.original_title}
                            </p>
                          )}
                        <div className={styles.movieMeta}>
                          {movie.start_year && (
                            <span className={styles.metaItem}>
                              {movie.start_year}
                            </span>
                          )}
                          {movie.genres && (
                            <span className={styles.metaItem}>
                              {movie.genres.split(',')[0].trim()}
                            </span>
                          )}
                          {movie.average_rating && (
                            <span className={styles.metaItem}>
                              ⭐ {movie.average_rating.toFixed(1)}
                            </span>
                          )}
                          {isAlreadyAdded && (
                            <span className={styles.alreadyAddedLabel}>
                              Already added
                            </span>
                          )}
                        </div>
                      </div>
                      {movie.banner && movie.banner !== 'N/A' && (
                        <img
                          src={movie.banner}
                          alt={movie.primary_title || 'Movie poster'}
                          className={styles.moviePoster}
                          onError={e => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!searchQuery.trim() && !loading && (
            <div className={styles.empty}>
              Start typing to search for movies...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
