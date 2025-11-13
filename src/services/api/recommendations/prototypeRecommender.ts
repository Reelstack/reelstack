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
        cosineSimilarity(compactUserProfile, compactMovieVector),
      );

      let comboBoost = 1.0;

      // Verifica se compartilha gênero com algum like
      const sharesGenre = likedMovies.some(liked =>
        liked.genres.some(lg => movie.genres.some(mg => mg.name === lg.name)),
      );

      // Verifica se compartilha diretor com algum like
      const sharesDirector = likedMovies.some(
        liked =>
          liked.director && movie.director && liked.director === movie.director,
      );

      // Aplica boost incremental
      if (sharesGenre) comboBoost += GENRE_COMBO_BOOST; // +5% por gênero compartilhado
      if (sharesDirector) comboBoost += DIRECTOR_COMBO_BOOST; // +20% por diretor compartilhado

      const boostedSimilarity = similarity * comboBoost;

      const ratingScore = movie.average_rating
        ? movie.average_rating / 10
        : 0.5;
      const finalScore =
        0.9 * Math.pow(boostedSimilarity, 2) + 0.1 * ratingScore;
      return { ...movie, similarity, boostedSimilarity, finalScore };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.finalScore ?? 0) - (a?.finalScore ?? 0));

  console.log(
    `🔢 Processando ${scored.length} filmes para diversificação (limit=${limit})`,
  );

  // Diversificação
  const diversified = [];
  const directorCount = new Map<string, number>();
  const genreCountInResults = new Map<string, number>(); // Conta no resultado final
  const maxPerGenre = 4; // Máximo de filmes por gênero nos resultados recomendados

  for (const movie of scored) {
    if (!movie) continue;

    // Verifica se algum gênero do filme já atingiu o limite
    let genreLimitReached = false;
    for (const genre of movie.genres) {
      const count = genreCountInResults.get(genre.name) || 0;
      if (count >= maxPerGenre) {
        genreLimitReached = true;
        break;
      }
    }

    // Pula se algum gênero já está saturado
    if (genreLimitReached) continue;

    let directorPenalty = 1;
    if (movie.director) {
      const director = movie.director;
      const directorOccurrences = directorCount.get(director) || 0;
      // Penaliza só por diretor repetido
      directorPenalty = Math.pow(0.85, directorOccurrences); // 15% de penalização por filme repetido
    }
    const diversifiedScore = movie.finalScore * directorPenalty;

    diversified.push({ ...movie, finalScore: diversifiedScore });

    // Atualiza contadores
    if (movie.director) {
      const director = movie.director;
      const directorOccurrences = directorCount.get(director) || 0;
      directorCount.set(director, directorOccurrences + 1);
    }
    for (const genre of movie.genres) {
      genreCountInResults.set(
        genre.name,
        (genreCountInResults.get(genre.name) || 0) + 1,
      );
    }

    // Para quando tiver filmes suficientes
    if (diversified.length >= limit) break;
  }

  // Re-ordena com diversificação aplicada
  const final = diversified
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  console.timeEnd('Scoring movies');
  return final;
}
