import { supabase } from '../../../lib/supabaseClient';
import { getAllCachedMovies } from './movieLocalStorage';

// Types
type Genre = { id: number; name: string };

type Movie = {
  id: string;
  title: string;
  genres: Genre[];
  director: string | null;
  actors: string | string[] | null;
  average_rating: number | null;
};

type CachedMovie = {
  id: string;
  title: string;
  vector: number[]; // genre-space vector
  average_rating: number | null;
  genres: Genre[];
  director: string | null;
  actors: string | string[] | null;
  banner?: string | null;
};

type ScoredMovie = CachedMovie & {
  finalScore: number;
  similarityRaw?: number;
  boostedSimilarity?: number;
  genreLikeBoost?: number;
  genreDislikePenalty?: number;
  sharesGenre?: boolean;
  sharesDirector?: boolean;
};

// ----------------- similaridade -----------------
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const n = vectors.length;
  const dims = vectors[0].length;
  const sum = new Array(dims).fill(0);
  for (let i = 0; i < n; i++) {
    const v = vectors[i];
    for (let j = 0; j < dims; j++) sum[j] += v[j] ?? 0;
  }
  return sum.map(x => x / n);
}

function normalizeId(id: unknown): string {
  return String(id ?? '').trim();
}

function normalizeVector(vec: number[] | undefined, dim: number): number[] {
  if (!Array.isArray(vec)) return new Array(dim).fill(0);
  if (vec.length === dim) return vec.slice();
  if (vec.length > dim) return vec.slice(0, dim);
  const out = vec.slice();
  while (out.length < dim) out.push(0);
  return out;
}

function safeAverageVectors(
  vectors: number[][],
  expectedDim: number,
): number[] {
  const normalized = vectors.map(v => normalizeVector(v, expectedDim));
  if (normalized.length === 0) return new Array(expectedDim).fill(0);
  return averageVectors(normalized);
}

// ----------------- Fetch helpers -----------------
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

  return (data || []).map((movie: any) => ({
    id: movie.tconst,
    title: movie.primary_title,
    director: movie.director ?? null,
    actors: movie.actors ?? null,
    average_rating: movie.average_rating ?? null,
    genres:
      movie.movie_genres?.map((g: any) => ({
        id: g.genre_id,
        name: Array.isArray(g.genres_name)
          ? g.genres_name[0]?.name || ''
          : g.genres_name?.name || '',
      })) || [],
  }));
}

export async function fetchUserMovies(
  profileId: string,
  type: 'like' | 'dislike',
): Promise<Movie[]> {
  const { data: interactions, error } = await supabase
    .from('user_movie_interactions')
    .select('movie_id')
    .eq('profile_id', profileId)
    .eq('interaction_type', type);

  if (error) throw error;

  const movieIds = (interactions || []).map((i: any) => i.movie_id);
  if (movieIds.length === 0) return [];

  return fetchMoviesByIds(movieIds);
}

// ----------------- recommender -----------------
export async function recommendMovies(
  profileId: string,
  limit = 10,
  likedMoviesId?: Movie[],
  dislikedMoviesId?: Movie[],
): Promise<ScoredMovie[]> {
  const likedMovies =
    likedMoviesId ?? (await fetchUserMovies(profileId, 'like'));
  const dislikedMovies =
    dislikedMoviesId ?? (await fetchUserMovies(profileId, 'dislike'));

  if (likedMovies.length === 0 && dislikedMovies.length === 0) {
    console.log('User has no interactions yet.');
    return [];
  }

  console.time('🔹 Load all cached vectors');
  const allCachedMovies = (await getAllCachedMovies()) || [];
  console.timeEnd('🔹 Load all cached vectors');

  const cachedById = new Map<string, CachedMovie>();
  const cachedByTitle = new Map<string, CachedMovie>();

  for (const m of allCachedMovies) {
    const nId = normalizeId(m.id);
    cachedById.set(nId, {
      id: nId,
      title: m.title ?? '',
      vector: m.vector ?? [],
      average_rating: m.average_rating ?? null,
      genres: m.genres ?? [],
      director: m.director ?? null,
      actors: m.actors ?? null,
      banner: m.banner ?? null,
    });
    if (m.title)
      cachedByTitle.set(String(m.title).toLowerCase(), cachedById.get(nId)!);
  }

  const allGenres = Array.from(
    new Set(
      allCachedMovies.flatMap(m => (m.genres || []).map((g: any) => g.name)),
    ),
  );
  const firstVecLen = allCachedMovies[0]?.vector?.length ?? 0;
  const expectedDim = Math.max(firstVecLen || 0, allGenres.length || 0, 0);

  // debug
  console.log('🔎 Debug info:');
  console.log(' - likedMovies count:', likedMovies.length);
  console.log(' - dislikedMovies count:', dislikedMovies.length);
  console.log(' - cached movies count:', allCachedMovies.length);
  console.log(
    ' - sample cached IDs (first 10):',
    Array.from(cachedById.keys()).slice(0, 10),
  );
  console.log(
    ' - sample cached titles (first 10):',
    Array.from(cachedByTitle.keys()).slice(0, 10),
  );
  console.log(' - expected vector dim:', expectedDim);
  if (likedMovies[0]) {
    console.log(' - sample likedMovie (first):', {
      id: normalizeId(likedMovies[0].id),
      rawId: likedMovies[0].id,
      title: likedMovies[0].title,
      genres: likedMovies[0].genres?.map(g => g.name),
    });
  }

  // like/dislike count
  const genreLikeCounts = new Map<string, number>();
  const genreDislikeCounts = new Map<string, number>();

  for (const m of likedMovies) {
    for (const g of m.genres || []) {
      genreLikeCounts.set(g.name, (genreLikeCounts.get(g.name) || 0) + 1);
    }
  }
  for (const m of dislikedMovies) {
    for (const g of m.genres || []) {
      genreDislikeCounts.set(g.name, (genreDislikeCounts.get(g.name) || 0) + 1);
    }
  }

  const maxLike = Math.max(0, ...Array.from(genreLikeCounts.values()));
  const maxDislike = Math.max(0, ...Array.from(genreDislikeCounts.values()));

  const genreLikeWeight = (name: string) =>
    maxLike === 0 ? 0 : (genreLikeCounts.get(name) || 0) / maxLike;
  const genreDislikeWeight = (name: string) =>
    maxDislike === 0 ? 0 : (genreDislikeCounts.get(name) || 0) / maxDislike;

  // Helper pra achar o filme
  const findCachedForMovie = (m: Movie): CachedMovie | undefined => {
    const nId = normalizeId(m.id);
    if (cachedById.has(nId)) return cachedById.get(nId);
    const altId = nId.replace(/^tt/, '');
    if (cachedById.has(altId)) return cachedById.get(altId);
    if (m.title) {
      const t = String(m.title).toLowerCase();
      if (cachedByTitle.has(t)) return cachedByTitle.get(t);
    }
    return undefined;
  };

  // liked/disliked vectors
  const likedVectors: number[][] = [];
  const dislikedVectors: number[][] = [];

  // Debug counters
  let likedMissing = 0;
  let dislikedMissing = 0;

  for (const lm of likedMovies) {
    const cached = findCachedForMovie(lm);
    if (!cached) {
      likedMissing++;
      continue;
    }
    likedVectors.push(normalizeVector(cached.vector, expectedDim));
  }

  for (const dm of dislikedMovies) {
    const cached = findCachedForMovie(dm);
    if (!cached) {
      dislikedMissing++;
      continue;
    }
    dislikedVectors.push(normalizeVector(cached.vector, expectedDim));
  }

  console.log(
    '📊 likedVectors encontrados (after normalization):',
    likedVectors.length,
    'missing:',
    likedMissing,
  );
  console.log(
    '📊 dislikedVectors encontrados (after normalization):',
    dislikedVectors.length,
    'missing:',
    dislikedMissing,
  );

  const likedProfile = safeAverageVectors(likedVectors, expectedDim);
  const dislikedProfile = safeAverageVectors(dislikedVectors, expectedDim);

  const L = likedVectors.length;
  const D = dislikedVectors.length;
  const total = L + D;
  const wLike = total > 0 ? L / total : 0;
  const wDislike = total > 0 ? D / total : 0;

  // Betapros dislikes
  const beta = Math.max(
    0.2,
    Math.min(0.8, 0.8 - 0.3 * Math.min(1, D / (2 * L + 1))),
  );

  const userProfile = likedProfile.map(
    (val, i) => wLike * val - beta * wDislike * (dislikedProfile[i] ?? 0),
  );

  // TF-IDF
  const genreFrequency = (() => {
    const N = allCachedMovies.length || 1;
    const k = 1;
    const alpha = 3;
    const idfs = allGenres.map(g => {
      const df = allCachedMovies.filter(m =>
        (m.genres || []).some((gg: any) => gg.name === g),
      ).length;
      const idf = Math.log((N + k) / (df + k));
      return idf;
    });
    const maxIdf = Math.max(1, ...idfs);
    return idfs.map(idf => (idf / maxIdf) * alpha);
  })();

  for (let i = 0; i < userProfile.length; i++) {
    userProfile[i] *= genreFrequency[i] ?? 1;
  }

  const relevantIndices = userProfile
    .map((val, idx) => ({ idx, val: Math.abs(val) }))
    .filter(item => item.val > 0.005)
    .map(item => item.idx);

  const compactUserProfile = relevantIndices.map(i => userProfile[i]);

  console.log('📊 L (likes):', L, 'D (dislikes):', D);
  console.log('📊 wLike:', wLike, 'wDislike:', wDislike, 'beta:', beta);
  console.log(
    `🎯 Features relevantes: ${relevantIndices.length} de ${userProfile.length}`,
  );

  // lista normalizada
  const allMoviesForScoring: CachedMovie[] = Array.from(cachedById.values());

  const interactedIds = new Set<string>([
    ...likedMovies.map(m => normalizeId(m.id)),
    ...dislikedMovies.map(m => normalizeId(m.id)),
  ]);

  console.time('Scoring movies');

  const scoredMaybe = allMoviesForScoring
    .filter(m => !interactedIds.has(normalizeId(m.id)))
    .map(movie => {
      const movieVector = normalizeVector(movie.vector, expectedDim);
      // indice compacto
      const compactMovieVector = relevantIndices.map(i => movieVector[i] ?? 0);

      let similarityRaw = 0;
      if (compactUserProfile.length === 0 || compactMovieVector.length === 0) {
        similarityRaw = 0;
      } else {
        similarityRaw = cosineSimilarity(
          compactUserProfile,
          compactMovieVector,
        );
        similarityRaw = Math.max(-1, Math.min(1, similarityRaw));
      }

      let comboBoost = 1.0;
      const sharesGenre = likedMovies.some(liked =>
        (liked.genres || []).some(lg =>
          (movie.genres || []).some(mg => mg.name === lg.name),
        ),
      );

      const sharesDirector = likedMovies.some(
        liked =>
          liked.director && movie.director && liked.director === movie.director,
      );

      if (sharesGenre) comboBoost += 0.05;
      if (sharesDirector) comboBoost += 0.2;

      const boostedSimilarity = similarityRaw * comboBoost;

      // Genre-level boost/penalty
      const LIKE_BOOST_FACTOR = 0.25;
      const DISLIKE_PENALTY_FACTOR = 0.6;

      let genreLikeSum = 0;
      let genreDislikeSum = 0;
      for (const g of movie.genres || []) {
        genreLikeSum += genreLikeWeight(g.name);
        genreDislikeSum += genreDislikeWeight(g.name);
      }

      const genreCount = Math.max(1, (movie.genres || []).length);
      const genreLikeBoost = (genreLikeSum / genreCount) * LIKE_BOOST_FACTOR;
      const genreDislikePenalty =
        (genreDislikeSum / genreCount) * DISLIKE_PENALTY_FACTOR;

      const POSITIVE_SCALE_POWER = 1.2;
      const positivePart = Math.max(0, boostedSimilarity);
      const negativePart = Math.min(0, boostedSimilarity);
      const NEGATIVE_PENALTY_MULT = 0.6;

      let finalSimilarityContribution =
        Math.pow(positivePart, POSITIVE_SCALE_POWER) * (1 + genreLikeBoost) +
        negativePart * NEGATIVE_PENALTY_MULT -
        genreDislikePenalty;

      finalSimilarityContribution = Math.max(
        0,
        Math.min(1, finalSimilarityContribution),
      );

      const ratingScore = movie.average_rating
        ? movie.average_rating / 10
        : 0.5;

      const finalScore = 0.85 * finalSimilarityContribution + 0.1 * ratingScore;

      return {
        ...movie,
        finalScore,
        similarityRaw,
        boostedSimilarity,
        genreLikeBoost,
        genreDislikePenalty,
        sharesGenre,
        sharesDirector,
      } as ScoredMovie;
    });

  const isScored = (m: ScoredMovie | null): m is ScoredMovie => m !== null;

  const scored = (scoredMaybe.filter(isScored) as ScoredMovie[]).sort(
    (a, b) => b.finalScore - a.finalScore,
  );

  console.log(
    `🔢 Processando ${scored.length} filmes para diversificação (limit=${limit})`,
  );

  const filteredScored = scored.filter(item => item.finalScore > 0.01);

  // diversificação
  const diversified: ScoredMovie[] = [];
  const directorCount = new Map<string, number>();
  const genreCountInResults = new Map<string, number>();
  const maxPerGenre = 4;

  for (const movie of filteredScored) {
    if (!movie) continue;

    // limite por genero
    let wouldExceedGenreLimit = false;
    for (const genre of movie.genres || []) {
      const count = genreCountInResults.get(genre.name) || 0;
      if (count + 1 > maxPerGenre) {
        wouldExceedGenreLimit = true;
        break;
      }
    }
    if (wouldExceedGenreLimit) continue;

    let directorPenalty = 1;
    if (movie.director) {
      const director = movie.director;
      const directorOccurrences = directorCount.get(director) || 0;
      directorPenalty = Math.pow(0.85, directorOccurrences);
    }
    const diversifiedScore = movie.finalScore * directorPenalty;

    diversified.push({ ...movie, finalScore: diversifiedScore });

    if (movie.director) {
      const director = movie.director;
      const directorOccurrences = directorCount.get(director) || 0;
      directorCount.set(director, directorOccurrences + 1);
    }
    for (const genre of movie.genres || []) {
      genreCountInResults.set(
        genre.name,
        (genreCountInResults.get(genre.name) || 0) + 1,
      );
    }

    if (diversified.length >= limit) break;
  }

  const final = diversified
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  console.timeEnd('Scoring movies');

  console.log('User profile raw (slice):', userProfile.slice(0, 50));
  console.log('Negative components:', userProfile.filter(x => x < 0).length);
  console.log('Min userProfile:', Math.min(...userProfile));
  console.log('After TF-IDF (sample):', (genreFrequency || []).slice(0, 10));
  console.log('Compact userProfile (slice):', compactUserProfile.slice(0, 50));

  return final;
}
