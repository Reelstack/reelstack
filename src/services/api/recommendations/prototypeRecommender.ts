import { supabase } from '../../../lib/supabaseClient';

// pega os generos relacionais
type Genre = { id: number; name: string };
// pega elementos importantes do filmes para o algoritmo
type Movie = {
  id: string;
  title: string;
  genres: Genre[];
  director: string;
  actors: any;
  average_rating: number;
};

// indexedDB pro cache local

async function getDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('MovieCacheDB', 1);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('movieVectors');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVector(movieId: string, vector: number[]) {
  const db = await getDB();
  const tx = db.transaction('movieVectors', 'readwrite');
  const store = tx.objectStore('movieVectors');
  store.put(vector, movieId);
  return await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getVector(movieId: string): Promise<number[] | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('movieVectors', 'readonly');
    const store = tx.objectStore('movieVectors');
    const request = store.get(movieId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// função para a similaridade de cosseno
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// função para pegar a média de vetores
function averageVectors(vectors: number[][]): number[] {
  const n = vectors.length;
  const sum = vectors[0].map((_, i) =>
    vectors.reduce((acc, v) => acc + v[i], 0),
  );
  return sum.map(x => x / n);
}

// separador das variaveis para evitar nesting
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
  weights = { genre: 0.6, director: 0.2, actor: 0.2 },
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
      actorList = movie.actors
        .split(',')
        .map(a => a?.trim())
        .filter(Boolean);
    } else if (Array.isArray(movie.actors)) {
      actorList = movie.actors.map(a => (a ? a.trim() : '')).filter(Boolean);
    }
  }

  const actorVector = allActors.map(a =>
    actorList.includes(a) ? weights.actor : 0,
  );

  return [...genreVector, ...directorVector, ...actorVector];
}

async function getMovieVector(
  movie: Movie,
  allGenres: string[],
  allDirectors: string[],
  allActors: string[],
  weights = { genre: 0.6, director: 0.2, actor: 0.2 },
): Promise<number[]> {
  const cached = await getVector(movie.id);
  if (cached) return cached;

  const vector = movieToVector(
    movie,
    allGenres,
    allDirectors,
    allActors,
    weights,
  );
  await saveVector(movie.id, vector);
  return vector;
}

export async function cacheAllMovieVectors() {
  const allMovies = await fetchAllMovies();
  const { allGenres, allDirectors, allActors } = buildFeatureLists(allMovies);

  // leitura rapida de primeira vez
  const db = await getDB();
  const tx = db.transaction('movieVectors', 'readonly');
  const store = tx.objectStore('movieVectors');

  const cachedIds: Set<string> = new Set();
  await new Promise<void>((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cachedIds.add(cursor.key as string);
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  console.log(`Already cached movie vectors: ${cachedIds.size}`);

  // checagem em batches
  const BATCH_SIZE = 2000;
  for (let i = 0; i < allMovies.length; i += BATCH_SIZE) {
    const batch = allMovies.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async movie => {
        if (cachedIds.has(movie.id)) {
          console.log(`Already cached "${movie.title}"`);
        } else {
          await getMovieVector(movie, allGenres, allDirectors, allActors);
          console.log(`Cached "${movie.title}"`);
        }
      }),
    );

    console.log(`Processed movies ${i + 1} to ${i + batch.length}`);
    await new Promise(r => setTimeout(r, 50)); // yield pra não travar a ui
  }

  console.log('All movie vectors processed!');
}

async function loadAllCachedVectors(): Promise<Record<string, number[]>> {
  const db = await getDB();
  const tx = db.transaction('movieVectors', 'readonly');
  const store = tx.objectStore('movieVectors');
  const allVectors: Record<string, number[]> = {};

  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        allVectors[cursor.key as string] = cursor.value as number[];
        cursor.continue();
      } else {
        console.log(`Loaded ${Object.keys(allVectors).length} cached vectors`);
        resolve(allVectors);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => console.log('IndexedDB read complete');
  });
}

// fetching dos filmes

async function fetchMoviesByIds(movieIds?: string[]): Promise<Movie[]> {
  const query = supabase.from('movies').select(`
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

  if (movieIds && movieIds.length > 0) {
    query.in('tconst', movieIds);
  }

  const { data, error } = await query;
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
        // ajeita os arrays e os objetos unicos
        name: Array.isArray(g.genres_name)
          ? g.genres_name[0]?.name || ''
          : g.genres_name?.name || '',
      })) || [],
  }));
}
// fetch dos likes e dislikes
async function fetchUserMovies(
  profileId: string,
  type: 'like' | 'dislike',
): Promise<Movie[]> {
  const { data: interactions, error } = await supabase
    .from('user_movie_interactions')
    .select('movie_id')
    .eq('profile_id', profileId)
    .eq('interaction_type', type);

  if (error) throw error;

  const movieIds = interactions.map(i => i.movie_id);
  if (movieIds.length === 0) return [];

  return fetchMoviesByIds(movieIds);
}

async function fetchAllMovies(): Promise<Movie[]> {
  return fetchMoviesByIds(); // fetch de uma vez só pra evitar gasto
}

// logica de recomendação

export async function recommendMovies(profileId: string, limit = 10) {
  const allMovies = await fetchAllMovies();
  const likedMovies = await fetchUserMovies(profileId, 'like');
  const dislikedMovies = await fetchUserMovies(profileId, 'dislike');

  if (likedMovies.length === 0 && dislikedMovies.length === 0) {
    console.log('User has no interactions yet.');
    return [];
  }

  const { allGenres, allDirectors, allActors } = buildFeatureLists(allMovies);

  console.time('🔹 Load all cached vectors');
  const allVectors = await loadAllCachedVectors();
  console.timeEnd('🔹 Load all cached vectors');

  // Precomputa o usuario
  const likedVectors = await Promise.all(
    likedMovies.map(m => getMovieVector(m, allGenres, allDirectors, allActors)),
  );

  const dislikedVectors = await Promise.all(
    dislikedMovies.map(m =>
      getMovieVector(m, allGenres, allDirectors, allActors),
    ),
  );

  // determina o peso dos generos baseados em frequencia
  const genreFrequency = allGenres.map(
    g =>
      1 /
      Math.log(
        1 + allMovies.filter(m => m.genres.some(gg => gg.name === g)).length,
      ),
  );

  const L = likedVectors.length;
  const D = dislikedVectors.length;
  const likedProfile =
    L > 0 ? averageVectors(likedVectors) : new Array(allGenres.length).fill(0);
  const dislikedProfile =
    D > 0
      ? averageVectors(dislikedVectors)
      : new Array(allGenres.length).fill(0);

  // pega os pesos relativos(muito mais dislike do que like acontecerá, logo os pesos precisam de certa banalidade ao exagero)
  const total = L + D;
  const wLike = total > 0 ? L / total : 0;
  const wDislike = total > 0 ? D / total : 0;

  // Beta controla a sensibilidade dos dislikes baseados na quantidade deles
  const beta = 0.6; // valores entre 0.5 a 0.8 como base, TESTAR O VALOR CASO ALTERAÇÃO

  // aplica a frequencia de generos nos likes e dislikes
  for (let i = 0; i < allGenres.length; i++) {
    likedProfile[i] *= genreFrequency[i];
    dislikedProfile[i] *= genreFrequency[i];
  }

  // constroi o perfil
  const userProfile = likedProfile.map(
    (val, i) => wLike * val - beta * wDislike * dislikedProfile[i],
  );

  const interactedIds = new Set([
    ...likedMovies.map(m => m.id),
    ...dislikedMovies.map(m => m.id),
  ]);

  console.time('Scoring movies');

  // recomenda os filmes baseados no peso final
  const scored = allMovies
    .filter(m => !interactedIds.has(m.id))
    .map(movie => {
      const movieVector = allVectors[movie.id];
      if (!movieVector) return null; // pula se não estiver no cache
      const similarity = cosineSimilarity(userProfile, movieVector);
      const ratingScore = movie.average_rating
        ? movie.average_rating / 10
        : 0.5;
      // aplica os ratings pós similaridade
      const finalScore = 0.7 * similarity + 0.3 * ratingScore;
      return { ...movie, similarity, finalScore };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.finalScore ?? 0) - (a?.finalScore ?? 0))
    .slice(0, limit);
  console.timeEnd('Scoring movies');

  return scored;
}
