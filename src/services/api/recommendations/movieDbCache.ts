import { supabase } from '../../../lib/supabaseClient.ts';

// Types
type Genre = { id: number; name: string };
type Movie = {
  id: string;
  title: string;
  genres: Genre[];
  director: string;
  actors: any;
  average_rating: number;
};

// pesos das variaveis
const weights = { genre: 10, director: 8, actor: 6 };

// organizador dos vetores e separador para evitar nesting
function buildFeatureLists(movies: Movie[]) {
  const allGenres = Array.from(
    new Set(movies.flatMap(m => m.genres.map(g => g.name))),
  );

  const allDirectors = Array.from(
    new Set(
      movies
        .map(m => (m.director ? m.director.trim() : null))
        .filter((d): d is string => !!d),
    ),
  );

  const allActors = Array.from(
    new Set(
      movies.flatMap(m => {
        if (!m.actors) return [];
        if (typeof m.actors === 'string') {
          return m.actors
            .split(',')
            .map(a => a?.trim())
            .filter(Boolean);
        }
        if (Array.isArray(m.actors)) {
          return m.actors
            .map(a => (a ? a.trim() : null))
            .filter((a): a is string => !!a);
        }
        return [];
      }),
    ),
  );

  return { allGenres, allDirectors, allActors };
}

// conversão de variaveis para vetor para tangibilidade dos calculos
function movieToVector(
  movie: Movie,
  allGenres: string[],
  allDirectors: string[],
  allActors: string[],
): number[] {
  const genreVector = allGenres.map(g =>
    movie.genres.some(gg => gg.name === g) ? weights.genre : 0,
  );

  const directorVector = allDirectors.map(d =>
    movie.director && movie.director === d ? weights.director : 0,
  );

  let actorList: string[] = [];
  if (movie.actors) {
    if (typeof movie.actors === 'string') {
      actorList = movie.actors.split(',').map(a => a.trim());
    } else if (Array.isArray(movie.actors)) {
      actorList = movie.actors.map(a => a.trim());
    }
  }

  const actorVector = allActors.map(a =>
    actorList.includes(a) ? weights.actor : 0,
  );

  return [...genreVector, ...directorVector, ...actorVector];
}

// Fetch dos filmes
async function fetchAllMovies(): Promise<Movie[]> {
  const { data, error } = await supabase.from('movies').select(`
    tconst,
    primary_title,
    director,
    actors,
    average_rating,
    movie_genres:movie_genres(
      genre_id,
      genres_name(
        name
      )
    )
  `);

  if (error) throw error;

  return data.map(movie => ({
    id: movie.tconst,
    title: movie.primary_title,
    director: movie.director,
    actors: movie.actors,
    average_rating: movie.average_rating,
    genres:
      movie.movie_genres?.map((g: any) => ({
        id: g.genre_id,
        name: Array.isArray(g.genres_name)
          ? g.genres_name[0]?.name || ''
          : g.genres_name?.name || '',
      })) || [],
  }));
}

// função do cache
export async function cacheAllMovieVectors() {
  const allMovies = await fetchAllMovies();
  const { allGenres, allDirectors, allActors } = buildFeatureLists(allMovies);

  const BATCH_SIZE = 50;
  const total = allMovies.length;
  console.log('Starting caching script...');
  console.log(`Total movies to cache: ${total}`);

  console.log(`Starting vector caching for ${total} movies...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = allMovies.slice(i, i + BATCH_SIZE);

    const vectors = batch.map(movie => ({
      movie_id: movie.id,
      vector: movieToVector(movie, allGenres, allDirectors, allActors),
    }));

    const { error } = await supabase
      .from('movie_vectors_old')
      .upsert(vectors, { onConflict: 'movie_id' });

    if (error) {
      console.error(`Error on batch ${i / BATCH_SIZE + 1}:`, error);
    } else {
      console.log(`Uploaded batch ${i / BATCH_SIZE + 1}`);
    }

    await new Promise(r => setTimeout(r, 2000)); // delay
  }

  console.log('ALL movie vectors stored in Supabase!');
}

// para rodar o script
// npx ts-node src/services/api/recommendations/movieCache.ts
(async () => {
  try {
    await cacheAllMovieVectors();
  } catch (error) {
    console.error(error);
  }
})();
