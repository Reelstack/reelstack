import { openDB } from 'idb';
import { supabase } from '../../../lib/supabaseClient';

// IndexedDB setup
const DB_NAME = 'ReelStackDB';
const DB_VERSION = 1;
const STORE_NAME = 'movies';

// Types
export type CachedMovie = {
  id: string;
  title: string;
  vector: number[];
  banner: string | null;
  cast: string[];
  genres: Genre[]; // para cálculo de frequência
  average_rating: number; // para pontuação final
  director: string | null; // para exibição no log/home depois
};

type Genre = { id: number; name: string };
type Movie = {
  tconst: string;
  primary_title: string;
  genres: Genre[];
  banner: string | null;
  cast: string[];
  director: string;
  actors: string | string[];
  average_rating: number;
};

// pesos
const weights = { genre: 10, director: 8, actor: 6 };

// ---------------- IndexedDB ----------------
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function isCachePopulated(): Promise<boolean> {
  const db = await getDB();
  const count = await db.count(STORE_NAME);
  return count > 0;
}

export async function storeMoviesBatch(movies: CachedMovie[]) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  movies.forEach(movie => store.put(movie));
  await tx.done;
}

export async function getAllCachedMovies(): Promise<CachedMovie[]> {
  const db = await getDB(); // Obtém todos os dados brutos do IndexedDB
  const rawMovies = await db.getAll(STORE_NAME); // Mapeia os dados brutos para garantir que o tipo CachedMovie seja satisfeito
  return rawMovies.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    vector: movie.vector,
    banner: movie.banner ?? null, // ⭐ NEW
    cast: movie.cast ?? [],
    genres: movie.genres || [],
    average_rating: movie.average_rating || 0,
    director: movie.director || null,
  })) as CachedMovie[]; // Força a tipagem final para CachedMovie[]
}

// ---------------- Supabase Fetch ----------------
async function fetchMoviesFromSupabase(): Promise<Movie[]> {
  const { data, error } = await supabase.from('movies').select(`
    tconst,
    primary_title,
    director,
    actors,
    banner, 
    average_rating,
    movie_genres:movie_genres(
      genre_id,
      genres_name(name)
    )
  `);

  if (error) throw error;

  return data.map(movie => ({
    tconst: movie.tconst,
    primary_title: movie.primary_title,
    director: movie.director,
    actors: movie.actors,
    banner: movie.banner ?? null,
    cast:
      typeof movie.actors === 'string'
        ? movie.actors
            .split(',')
            .map(a => a.trim())
            .slice(0, 5) // ⭐ max 5
        : Array.isArray(movie.actors)
          ? movie.actors.map(a => a.trim()).slice(0, 5)
          : [],
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

// ---------------- computacão ----------------
function buildFeatureLists(movies: Movie[]) {
  const allGenres = Array.from(
    new Set(movies.flatMap(m => m.genres.map(g => g.name))),
  );

  // Conta frequência de diretores
  const directorCount = new Map<string, number>();
  movies.forEach(m => {
    if (m.director) {
      const dir = m.director.trim();
      directorCount.set(dir, (directorCount.get(dir) || 0) + 1);
    }
  });

  // Só diretores com 2+ filmes
  const allDirectors = Array.from(directorCount.entries())
    .filter(([_, count]) => count >= 2)
    .map(([dir]) => dir);

  // Conta frequência de atores
  const actorCount = new Map<string, number>();
  movies.forEach(m => {
    if (!m.actors) return;
    const actors =
      typeof m.actors === 'string'
        ? m.actors
            .split(',')
            .map(a => a.trim())
            .filter(Boolean)
        : Array.isArray(m.actors)
          ? m.actors.map(a => a.trim()).filter(Boolean)
          : [];

    actors.forEach(a => {
      actorCount.set(a, (actorCount.get(a) || 0) + 1);
    });
  });

  // Só atores com 3+ filmes
  const allActors = Array.from(actorCount.entries())
    .filter(([_, count]) => count >= 3)
    .map(([actor]) => actor);

  console.log(
    `📊 Features: ${allGenres.length} gêneros, ${allDirectors.length} diretores, ${allActors.length} atores = ${allGenres.length + allDirectors.length + allActors.length} dimensões totais`,
  );

  return { allGenres, allDirectors, allActors };
}

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

// ---------------- preparo pro cache----------------
export async function prepareLocalMovieCache() {
  const populated = await isCachePopulated();
  if (populated) return; // saida rapida se ja tiver coisa

  console.log('Fetching movies from Supabase...');
  const movies = await fetchMoviesFromSupabase();
  console.log(`Fetched ${movies.length} movies`);

  const { allGenres, allDirectors, allActors } = buildFeatureLists(movies);
  // em batches de 2000
  const BATCH_SIZE = 2000;
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const vectorizedBatch: CachedMovie[] = batch.map(movie => ({
      id: movie.tconst,
      title: movie.primary_title,
      banner: movie.banner ?? null,
      cast: movie.cast ?? [],
      vector: movieToVector(movie, allGenres, allDirectors, allActors),
      genres: movie.genres,
      average_rating: movie.average_rating,
      director: movie.director,
    }));

    await storeMoviesBatch(vectorizedBatch);
    console.log(
      `✅ Processed ${Math.min(i + BATCH_SIZE, movies.length)}/${movies.length} movies`,
    );
  }

  console.log('✅ Local cache populated with vectors!');
}
