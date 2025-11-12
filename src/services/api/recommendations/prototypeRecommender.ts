import { supabase } from '../../../lib/supabaseClient';
import { getAllCachedMovies } from './movieLocalStorage';

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

// função para a similaridade de cosseno
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// função para pegar a média de vetores
export function averageVectors(vectors: number[][]): number[] {
  const n = vectors.length;
  const sum = vectors[0].map((_, i) =>
    vectors.reduce((acc, v) => acc + v[i], 0),
  );
  return sum.map(x => x / n);
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

  const movieIds = interactions.map(i => i.movie_id);
  if (movieIds.length === 0) return [];

  return fetchMoviesByIds(movieIds);
}

// logica de recomendação
export async function recommendMovies(
  profileId: string,
  limit = 10,
  likedMoviesId?: Movie[],
  dislikedMoviesId?: Movie[],
) {
  // Se recebeu do worker, usa. caso contrario busca do supa
  const likedMovies =
    likedMoviesId ?? (await fetchUserMovies(profileId, 'like'));
  const dislikedMovies =
    dislikedMoviesId ?? (await fetchUserMovies(profileId, 'dislike'));

  if (likedMovies.length === 0 && dislikedMovies.length === 0) {
    console.log('User has no interactions yet.');
    return [];
  }

  console.time('🔹 Load all cached vectors'); //'cachedMovies' traz os vetores, gêneros e ratings
  const allCachedMovies = await getAllCachedMovies();
  const allVectors = new Map(allCachedMovies.map(m => [m.id, m.vector]));
  console.timeEnd('🔹 Load all cached vectors'); //  cria a lista de todos os filmes a partir do cache para o scoring

  const allMoviesForScoring = allCachedMovies.map(m => ({
    // Mapeia os dados necessários do cache para o tipo 'Movie'
    id: m.id,
    title: m.title,
    average_rating: m.average_rating,
    genres: m.genres,
    director: m.director, // Opcional: caso precisar no futuro
    actors: null, // Não é usado
  })); // pega gêneros e frequência do CACHE, eliminando a lentidão do supa

  const allGenres = Array.from(
    new Set(allCachedMovies.flatMap(m => m.genres.map(g => g.name))),
  );

  console.log('🔍 likedMovies[0] structure:', {
    id: likedMovies[0]?.id,
    hasGenres: !!likedMovies[0]?.genres,
    genresLength: likedMovies[0]?.genres?.length,
    genres: likedMovies[0]?.genres,
    director: likedMovies[0]?.director,
    actors: likedMovies[0]?.actors,
    actorsType: typeof likedMovies[0]?.actors,
  });
  // Precomputa o usuario
  const likedVectors = likedMovies
    .map(m => allVectors.get(m.id))
    .filter((v): v is number[] => !!v);

  const dislikedVectors = dislikedMovies
    .map(m => allVectors.get(m.id))
    .filter((v): v is number[] => !!v); // determina o peso dos generos baseados em frequencia

  console.log(
    '📊 likedVectors encontrados:',
    likedVectors.length,
    'de',
    likedMovies.length,
  );
  console.log(
    '📊 dislikedVectors encontrados:',
    dislikedVectors.length,
    'de',
    dislikedMovies.length,
  );
  console.log(
    '📊 Sample likedVector (primeiros 10 valores):',
    likedVectors[0]?.slice(0, 10),
  );
  console.log('📊 Tamanho do vetor:', likedVectors[0]?.length);
  console.log('📊 Total de gêneros:', allGenres.length);

  // frequencia para equalizar generos de alta ocorrência com os de rara ocorrência
  const genreFrequency = allGenres.map(
    g =>
      1 /
      Math.log(
        1 +
          allMoviesForScoring.filter(m => m.genres.some(gg => gg.name === g))
            .length *
            0.3,
      ),
  );

  const L = likedVectors.length;
  const D = dislikedVectors.length;
  const likedProfile =
    L > 0 ? averageVectors(likedVectors) : new Array(allGenres.length).fill(0);
  const dislikedProfile =
    D > 0
      ? averageVectors(dislikedVectors)
      : new Array(allGenres.length).fill(0); // pega os pesos relativos

  const total = L + D;
  const wLike = total > 0 ? L / total : 0;
  const wDislike = total > 0 ? D / total : 0;

  // Beta controla a sensibilidade dos dislikes
  // aplica a frequencia de generos nos likes e dislikes
  const beta = 0.8 - 0.3 * Math.min(1, D / (2 * L + 1)); // o coeficiente diminui quanto mais ratio de like para 2x dislike, até 0.5

  for (let i = 0; i < allGenres.length; i++) {
    likedProfile[i] *= genreFrequency[i];
    dislikedProfile[i] *= genreFrequency[i];
  }

  // constroi o perfil
  const userProfile = likedProfile.map(
    (val, i) => wLike * val - beta * wDislike * dislikedProfile[i],
  );

  const relevantIndices = userProfile
    .map((val, idx) => ({ idx, val: Math.abs(val) }))
    .filter(item => item.val > 0.005) // Só mantém features com peso > 0.005
    .map(item => item.idx);

  console.log(
    `🎯 Features relevantes: ${relevantIndices.length} de ${userProfile.length}`,
  );

  // Cria versão reduzida do userProfile
  const compactUserProfile = relevantIndices.map(i => userProfile[i]);

  console.log('📊 L (likes):', L, 'D (dislikes):', D);
  console.log('📊 wLike:', wLike, 'wDislike:', wDislike, 'beta:', beta);

  const interactedIds = new Set([
    ...likedMovies.map(m => m.id),
    ...dislikedMovies.map(m => m.id),
  ]);

  console.time('Scoring movies'); // recomenda os filmes baseados no peso final

  const scored = allMoviesForScoring // Usa a lista vinda do cache
    .filter(m => !interactedIds.has(m.id))
    .map(movie => {
      const movieVector = allVectors.get(movie.id);
      if (!movieVector) return null;

      // Cria versão compacta do vetor do filme
      const compactMovieVector = relevantIndices.map(i => movieVector[i]);

      // Calcula similaridade só nas features relevantes
      const similarity = Math.min(
        1.0,
        cosineSimilarity(compactUserProfile, compactMovieVector) * 1.5,
      ); // leve boost na função

      const ratingScore = movie.average_rating
        ? movie.average_rating / 10
        : 0.5;
      const finalScore = 0.9 * Math.pow(similarity, 2) + 0.1 * ratingScore;
      return { ...movie, similarity, finalScore };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.finalScore ?? 0) - (a?.finalScore ?? 0))
    .slice(0, limit);
  console.timeEnd('Scoring movies');

  return scored;
}
