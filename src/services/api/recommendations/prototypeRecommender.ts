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
  vector: number[]; // genre-space vector (may be missing or different dim)
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

// ----------------- Configuration / constants -----------------
const CACHE_VECTOR_WEIGHT = 0.6; // blend cached vector with genre-built vector when available
const GENRE_VECTOR_WEIGHT = 1 - CACHE_VECTOR_WEIGHT;
const LIKE_BOOST_FACTOR = 0.25;
const DISLIKE_PENALTY_FACTOR = 0.6;
const POSITIVE_SCALE_POWER = 1.2;
const NEGATIVE_PENALTY_MULT = 0.6;
const BASE_RATING_FALLBACK = 0.5;
const RATING_WEIGHT = 0.1;
const SIMILARITY_WEIGHT = 0.85;
const MMR_CANDIDATE_POOL = 200; // consider top-N candidates for MMR
const MMR_LAMBDA = 0.7; // 1.0 => pure relevance, 0.0 => pure diversity

// ----------------- Utilities -----------------
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function magnitude(vec: number[]): number {
  return Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
}

function normalizeToUnit(vec: number[]): number[] {
  const mag = magnitude(vec);
  if (mag === 0) return new Array(vec.length).fill(0);
  return vec.map(v => v / mag);
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

// Ensure vector has length dim by padding/truncating
function normalizeVector(vec: number[] | undefined, dim: number): number[] {
  if (!Array.isArray(vec)) return new Array(dim).fill(0);
  if (vec.length === dim) return vec.slice();
  if (vec.length > dim) return vec.slice(0, dim);
  const out = vec.slice();
  while (out.length < dim) out.push(0);
  return out;
}

// ----------------- Fetch helpers (unchanged) -----------------
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

// ----------------- Helpers to construct robust vectors -----------------
function buildGenreIndex(allCachedMovies: CachedMovie[]): {
  genreList: string[];
  genreIndex: Map<string, number>;
} {
  const genreSet = new Set<string>();
  for (const m of allCachedMovies) {
    for (const g of m.genres || []) genreSet.add(g.name);
  }
  const genreList = Array.from(genreSet);
  const genreIndex = new Map<string, number>();
  genreList.forEach((g, i) => genreIndex.set(g, i));
  return { genreList, genreIndex };
}

function computeGenreIdfWeights(
  allCachedMovies: CachedMovie[],
  genreList: string[],
) {
  const N = Math.max(1, allCachedMovies.length);
  const k = 1;
  const alpha = 3;
  const idfs = genreList.map(g => {
    const df = allCachedMovies.filter(m =>
      (m.genres || []).some(gg => gg.name === g),
    ).length;
    const idf = Math.log((N + k) / (df + k));
    return idf;
  });
  const maxIdf = Math.max(1, ...idfs);
  return idfs.map(idf => (idf / maxIdf) * alpha);
}

function buildGenreVectorForMovie(
  movieGenres: Genre[] | undefined,
  dim: number,
  genreIndex: Map<string, number>,
  idfWeights: number[],
) {
  const vec = new Array(dim).fill(0);
  if (!movieGenres || movieGenres.length === 0) return vec;
  for (const g of movieGenres) {
    const idx = genreIndex.get(g.name);
    if (idx === undefined) continue;
    vec[idx] = 1 * (idfWeights[idx] ?? 1);
  }
  // normalize by count so multi-genre films aren't overweighted
  const countNonZero = vec.reduce((c, v) => c + (v !== 0 ? 1 : 0), 0) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / countNonZero;
  return vec;
}

function blendAndNormalizeVectors(
  cachedVec: number[] | undefined,
  genreVec: number[],
  dim: number,
) {
  const normGenre = normalizeVector(genreVec, dim);
  let final: number[];
  if (Array.isArray(cachedVec) && cachedVec.length > 0) {
    const normCached = normalizeVector(cachedVec, dim);
    // If cached length mismatches fewer dims, we already normalized shape above; blend
    const blended = new Array(dim).fill(0);
    for (let i = 0; i < dim; i++) {
      blended[i] =
        CACHE_VECTOR_WEIGHT * (normCached[i] ?? 0) +
        GENRE_VECTOR_WEIGHT * (normGenre[i] ?? 0);
    }
    final = normalizeToUnit(blended);
  } else {
    final = normalizeToUnit(normGenre);
  }
  return final;
}

// MMR selection: candidates are pre-scored for relevance (similarity to user)
// We'll rerank up to k items to balance relevance and diversity.
function mmrSelect<T extends { vector: number[]; score: number }>(
  candidates: T[],
  userVector: number[],
  k: number,
  lambda = MMR_LAMBDA,
) {
  if (candidates.length <= k) return candidates;
  const selected: T[] = [];
  // choose first by best relevance
  const remaining = candidates.slice();
  remaining.sort((a, b) => b.score - a.score);
  selected.push(remaining.shift()!);

  while (selected.length < k && remaining.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const simRelevant = cosineSimilarity(userVector, cand.vector);
      // find max similarity to already selected
      let maxSimSelected = -Infinity;
      for (const s of selected) {
        const sim = cosineSimilarity(cand.vector, s.vector);
        if (sim > maxSimSelected) maxSimSelected = sim;
      }
      if (maxSimSelected === -Infinity) maxSimSelected = 0;
      const mmrScore = lambda * simRelevant - (1 - lambda) * maxSimSelected;
      if (mmrScore > bestValue) {
        bestValue = mmrScore;
        bestIndex = i;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return selected;
}

// ----------------- Main recommender -----------------
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

  // Build canonical maps and genre index
  const cachedById = new Map<string, CachedMovie>();
  const cachedByTitle = new Map<string, CachedMovie>();

  for (const m of allCachedMovies) {
    const nId = normalizeId(m.id);
    const normalized: CachedMovie = {
      id: nId,
      title: m.title ?? '',
      vector: m.vector ?? [],
      average_rating: m.average_rating ?? null,
      genres: m.genres ?? [],
      director: m.director ?? null,
      actors: m.actors ?? null,
      banner: m.banner ?? null,
    };
    cachedById.set(nId, normalized);
    if (m.title) cachedByTitle.set(String(m.title).toLowerCase(), normalized);
  }

  const { genreList, genreIndex } = buildGenreIndex(allCachedMovies);
  const dim = Math.max(genreList.length, 1); // at least 1 dimension
  const idfWeights = computeGenreIdfWeights(allCachedMovies, genreList);

  console.log('🔎 Debug info:');
  console.log(' - likedMovies count:', likedMovies.length);
  console.log(' - dislikedMovies count:', dislikedMovies.length);
  console.log(' - cached movies count:', allCachedMovies.length);
  console.log(' - genre dim:', dim);
  console.log(' - genreList sample:', genreList.slice(0, 20));

  // Helper to find cached movie (improved)
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

  // Build robust normalized vectors for all cached movies (blend cached + genre-built)
  const allMoviesForScoring: (CachedMovie & { vectorNorm: number[] })[] = [];
  for (const movie of cachedById.values()) {
    const genreVec = buildGenreVectorForMovie(
      movie.genres,
      dim,
      genreIndex,
      idfWeights,
    );
    const blended = blendAndNormalizeVectors(movie.vector, genreVec, dim);
    allMoviesForScoring.push({ ...movie, vectorNorm: blended });
  }

  // Build liked/disliked weighted vectors (by rating if available)
  const likedVectors: number[][] = [];
  const dislikedVectors: number[][] = [];

  let likedMissing = 0;
  let dislikedMissing = 0;

  for (const lm of likedMovies) {
    const cached = findCachedForMovie(lm);
    if (!cached) {
      likedMissing++;
      continue;
    }
    const entry = allMoviesForScoring.find(
      m => m.id === normalizeId(cached.id),
    );
    if (!entry) {
      likedMissing++;
      continue;
    }
    const weight = lm.average_rating ? lm.average_rating / 10 : 1;
    likedVectors.push(entry.vectorNorm.map(v => v * weight));
  }
  for (const dm of dislikedMovies) {
    const cached = findCachedForMovie(dm);
    if (!cached) {
      dislikedMissing++;
      continue;
    }
    const entry = allMoviesForScoring.find(
      m => m.id === normalizeId(cached.id),
    );
    if (!entry) {
      dislikedMissing++;
      continue;
    }
    const weight = dm.average_rating ? dm.average_rating / 10 : 1;
    dislikedVectors.push(entry.vectorNorm.map(v => v * weight));
  }

  console.log(
    '📊 likedVectors length:',
    likedVectors.length,
    'missing:',
    likedMissing,
  );
  console.log(
    '📊 dislikedVectors length:',
    dislikedVectors.length,
    'missing:',
    dislikedMissing,
  );

  // Compute weighted average profiles
  const likedProfileRaw =
    likedVectors.length > 0
      ? averageVectors(likedVectors)
      : new Array(dim).fill(0);
  const dislikedProfileRaw =
    dislikedVectors.length > 0
      ? averageVectors(dislikedVectors)
      : new Array(dim).fill(0);

  // Normalize intermediate profiles
  const likedProfile = normalizeToUnit(likedProfileRaw);
  const dislikedProfile = normalizeToUnit(dislikedProfileRaw);

  const L = likedVectors.length;
  const D = dislikedVectors.length;
  const total = L + D;
  const wLike = total > 0 ? L / total : 0;
  const wDislike = total > 0 ? D / total : 0;

  // Beta controls dislike sensitivity - clamp and fallback
  const beta = Math.max(
    0.2,
    Math.min(0.8, 0.8 - 0.3 * Math.min(1, D / (2 * L + 1))),
  );

  // signed user profile (likes positive, dislikes negative)
  let userProfile = new Array(dim).fill(0);
  for (let i = 0; i < dim; i++) {
    userProfile[i] =
      wLike * (likedProfile[i] ?? 0) -
      beta * wDislike * (dislikedProfile[i] ?? 0);
  }
  userProfile = normalizeToUnit(userProfile);

  // Compute raw similarity to user and other metadata for scoring
  type Candidate = {
    movie: CachedMovie & { vectorNorm: number[] };
    similarityRaw: number;
    boostedSimilarity: number;
    genreLikeBoost: number;
    genreDislikePenalty: number;
    sharesGenre: boolean;
    sharesDirector: boolean;
    baseScore: number;
  };

  const genreLikeCounts = new Map<string, number>();
  const genreDislikeCounts = new Map<string, number>();
  for (const m of likedMovies)
    for (const g of m.genres || [])
      genreLikeCounts.set(g.name, (genreLikeCounts.get(g.name) || 0) + 1);
  for (const m of dislikedMovies)
    for (const g of m.genres || [])
      genreDislikeCounts.set(g.name, (genreDislikeCounts.get(g.name) || 0) + 1);
  const maxLike = Math.max(0, ...Array.from(genreLikeCounts.values()));
  const maxDislike = Math.max(0, ...Array.from(genreDislikeCounts.values()));
  const genreLikeWeight = (name: string) =>
    maxLike === 0 ? 0 : (genreLikeCounts.get(name) || 0) / maxLike;
  const genreDislikeWeight = (name: string) =>
    maxDislike === 0 ? 0 : (genreDislikeCounts.get(name) || 0) / maxDislike;

  const interactedIds = new Set<string>([
    ...likedMovies.map(m => normalizeId(m.id)),
    ...dislikedMovies.map(m => normalizeId(m.id)),
  ]);

  const candidates: Candidate[] = [];
  for (const m of allMoviesForScoring) {
    if (interactedIds.has(normalizeId(m.id))) continue;
    const movieVector = m.vectorNorm;
    const similarityRaw = cosineSimilarity(userProfile, movieVector);
    // combo boosts
    const sharesGenre = likedMovies.some(liked =>
      (liked.genres || []).some(lg =>
        (m.genres || []).some(mg => mg.name === lg.name),
      ),
    );
    const sharesDirector = likedMovies.some(
      liked => liked.director && m.director && liked.director === m.director,
    );
    let comboBoost = 1.0;
    if (sharesGenre) comboBoost += 0.05;
    if (sharesDirector) comboBoost += 0.2;
    const boostedSimilarity = similarityRaw * comboBoost;

    // genre-level explicit boost/penalty
    let genreLikeSum = 0;
    let genreDislikeSum = 0;
    for (const g of m.genres || []) {
      genreLikeSum += genreLikeWeight(g.name);
      genreDislikeSum += genreDislikeWeight(g.name);
    }
    const genreCount = Math.max(1, (m.genres || []).length);
    const genreLikeBoost = (genreLikeSum / genreCount) * LIKE_BOOST_FACTOR;
    const genreDislikePenalty =
      (genreDislikeSum / genreCount) * DISLIKE_PENALTY_FACTOR;

    // signed scaling
    const positivePart = Math.max(0, boostedSimilarity);
    const negativePart = Math.min(0, boostedSimilarity);
    let finalSimilarityContribution =
      Math.pow(positivePart, POSITIVE_SCALE_POWER) * (1 + genreLikeBoost) +
      negativePart * NEGATIVE_PENALTY_MULT -
      genreDislikePenalty;
    finalSimilarityContribution = Math.max(
      0,
      Math.min(1, finalSimilarityContribution),
    );

    const ratingScore = m.average_rating
      ? m.average_rating / 10
      : BASE_RATING_FALLBACK;
    const baseScore =
      SIMILARITY_WEIGHT * finalSimilarityContribution +
      RATING_WEIGHT * ratingScore;

    candidates.push({
      movie: m,
      similarityRaw,
      boostedSimilarity,
      genreLikeBoost,
      genreDislikePenalty,
      sharesGenre,
      sharesDirector,
      baseScore,
    });
  }

  // Sort candidates by baseScore descending, filter very tiny scores
  const sorted = candidates
    .filter(c => c.baseScore > 0.01)
    .sort((a, b) => b.baseScore - a.baseScore);

  console.log(`Found ${sorted.length} scored candidates.`);

  // Prepare a reduced candidate pool (top-N) for MMR selection to diversify
  const pool = sorted.slice(0, Math.max(MMR_CANDIDATE_POOL, limit * 5));

  // Map pool to mmr items with vector and score
  const mmrPool = pool.map(p => ({
    ...p,
    // ensure vector used in MMR is normalized
    vector: p.movie.vectorNorm,
    score: p.baseScore,
  }));

  // Run MMR selection to choose diversified set of up to 'limit' items
  const selected = mmrSelect(mmrPool, userProfile, limit, MMR_LAMBDA);

  // Final sorting by a final score that includes director penalty to prefer variety of directors
  const directorCount = new Map<string, number>();
  const finalScored: ScoredMovie[] = [];
  for (const sel of selected) {
    const movie = sel.movie;
    let directorPenalty = 1;
    if (movie.director) {
      const occurrences = directorCount.get(movie.director) || 0;
      directorPenalty = Math.pow(0.85, occurrences);
    }
    const diversifiedScore = sel.baseScore * directorPenalty;
    finalScored.push({
      ...movie,
      finalScore: diversifiedScore,
      similarityRaw: sel.similarityRaw,
      boostedSimilarity: sel.boostedSimilarity,
      genreLikeBoost: sel.genreLikeBoost,
      genreDislikePenalty: sel.genreDislikePenalty,
      sharesGenre: sel.sharesGenre,
      sharesDirector: sel.sharesDirector,
    });
    if (movie.director)
      directorCount.set(
        movie.director,
        (directorCount.get(movie.director) || 0) + 1,
      );
  }

  // final sort and slice
  const final = finalScored
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  console.log('User profile sample (first 20):', userProfile.slice(0, 20));
  console.log('Selected final count:', final.length);

  return final;
}
