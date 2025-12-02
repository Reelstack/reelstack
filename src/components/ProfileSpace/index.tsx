import styles from './styles.module.css';
import { useState, useEffect, useMemo } from 'react';
import { MovieStack } from '../MovieStack';
import type { Movie } from '../../services/api/supa-api/movies';
import { MoviesService } from '../../services/api/supa-api/movies';
import { supabase } from '../../lib/supabaseClient';

// calcular favoritos
function getMostFrequent<T>(
  items: T[],
  extractor: (item: T) => string | string[] | null,
): string | null {
  if (items.length === 0) return null;

  const frequency = new Map<string, number>();

  items.forEach(item => {
    const value = extractor(item);
    if (!value) return;

    const values = Array.isArray(value) ? value : [value];
    values.forEach(v => {
      const trimmed = v.trim();
      if (trimmed) {
        frequency.set(trimmed, (frequency.get(trimmed) || 0) + 1);
      }
    });
  });

  if (frequency.size === 0) return null;

  let maxCount = 0;
  let mostFrequent: string | null = null;

  frequency.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  });

  return mostFrequent;
}

function getFavoriteActor(movies: Movie[]): string | null {
  return getMostFrequent(movies, movie => {
    if (!movie.actors) return null;
    return movie.actors
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
  });
}

function getFavoriteDirector(movies: Movie[]): string | null {
  return getMostFrequent(movies, movie => movie.director);
}

function getFavoriteGenre(movies: Movie[]): string | null {
  return getMostFrequent(movies, movie => {
    if (!movie.genres) return null;
    return movie.genres
      .split(',')
      .map(g => g.trim())
      .filter(Boolean);
  });
}

function getFavoriteDecade(movies: Movie[]): string | null {
  if (movies.length === 0) return null;

  const decadeFrequency = new Map<string, number>();

  movies.forEach(movie => {
    if (!movie.start_year) return;
    const decade = Math.floor(movie.start_year / 10) * 10;
    const decadeKey = `${decade}s`;
    decadeFrequency.set(decadeKey, (decadeFrequency.get(decadeKey) || 0) + 1);
  });

  if (decadeFrequency.size === 0) return null;

  let maxCount = 0;
  let favoriteDecade: string | null = null;

  decadeFrequency.forEach((count, decade) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteDecade = decade;
    }
  });

  return favoriteDecade;
}

interface ProfileSpaceProps {
  onLoadingChange?: (loading: boolean) => void;
}

export function ProfileSpace({ onLoadingChange }: ProfileSpaceProps) {
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<Movie[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // calcular favoritos baseados em like
  const favoriteActor = useMemo(
    () => getFavoriteActor(likedMovies),
    [likedMovies],
  );
  const favoriteDirector = useMemo(
    () => getFavoriteDirector(likedMovies),
    [likedMovies],
  );
  const favoriteGenre = useMemo(
    () => getFavoriteGenre(likedMovies),
    [likedMovies],
  );
  const favoriteDecade = useMemo(
    () => getFavoriteDecade(likedMovies),
    [likedMovies],
  );

  async function loadProfileData(showLoading = true) {
    const shouldShowLoading = showLoading && !hasLoadedOnce;

    if (shouldShowLoading) {
      setLoading(true);
    }
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        if (shouldShowLoading) {
          setLoading(false);
        }
        return;
      }

      setEmail(user.email ?? null);
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_name')
        .eq('id', user.id)
        .single();
      if (profile?.profile_name) setDisplayName(profile.profile_name);

      // stats do liked e disliked
      const [liked, disliked] = await Promise.all([
        MoviesService.getUserMovies(user.id, 'like').catch(() => []),
        MoviesService.getUserMovies(user.id, 'dislike').catch(() => []),
      ]);

      setLikedMovies(liked || []);
      setDislikedMovies(disliked || []);
      setError(null);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data. Please try refreshing the page.');
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (onLoadingChange) {
      const isCurrentlyLoading =
        loading &&
        !hasLoadedOnce &&
        !displayName &&
        likedMovies.length === 0 &&
        dislikedMovies.length === 0;
      onLoadingChange(isCurrentlyLoading);
    }
  }, [
    loading,
    hasLoadedOnce,
    displayName,
    likedMovies.length,
    onLoadingChange,
  ]);

  useEffect(() => {
    // só mostra loading na montagem inicial
    if (!hasLoadedOnce) {
      loadProfileData(true);
    }

    //listener de mudança nas settings
    const handleProfileUpdate = () => {
      loadProfileData(false);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (
    loading &&
    !hasLoadedOnce &&
    !displayName &&
    likedMovies.length === 0 &&
    dislikedMovies.length === 0
  ) {
    return (
      <div className={styles.profileSpace}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileSpace}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileSpace}>
      <div className={styles.userSpace}>
        <div className={styles.userInfo}>
          <h1>{displayName || 'Loading name...'}</h1>
          <h3>{email || 'Loading email...'}</h3>
        </div>
        {/* componentizar no futuro*/}
        <div className={styles.userStats}>
          <div className={styles.statsRow}>
            <h4>Movies Liked:</h4>
            <p className={styles.stats}>{likedMovies.length}</p>
            <h4>Movies Disliked:</h4>
            <p className={styles.stats}>{dislikedMovies.length}</p>
          </div>
          <div className={styles.statsRow}>
            <h4>Favourite Actor:</h4>
            <p className={styles.stats}>
              {favoriteActor ||
                (likedMovies.length === 0
                  ? 'Add movies to see your favorites'
                  : 'Not enough data')}
            </p>
            <h4>Favourite Director:</h4>
            <p className={styles.stats}>
              {favoriteDirector ||
                (likedMovies.length === 0
                  ? 'Add movies to see your favorites'
                  : 'Not enough data')}
            </p>
          </div>
          <div className={styles.statsRow}>
            <h4>Favourite Genre:</h4>
            <p className={styles.stats}>
              {favoriteGenre ||
                (likedMovies.length === 0
                  ? 'Add movies to see your favorites'
                  : 'Not enough data')}
            </p>
            <h4>Favourite Decade:</h4>
            <p className={styles.stats}>
              {favoriteDecade ||
                (likedMovies.length === 0
                  ? 'Add movies to see your favorites'
                  : 'Not enough data')}
            </p>
          </div>
        </div>
      </div>

      <MovieStack
        title='Liked Movies'
        movies={likedMovies}
        setMovies={setLikedMovies}
        color='var(--success)'
        interactionType='like'
        allUserMovies={[...likedMovies, ...dislikedMovies]}
      />
      <MovieStack
        title='Disliked Movies'
        movies={dislikedMovies}
        setMovies={setDislikedMovies}
        color='var(--error)'
        interactionType='dislike'
        allUserMovies={[...likedMovies, ...dislikedMovies]}
      />
    </div>
  );
}
