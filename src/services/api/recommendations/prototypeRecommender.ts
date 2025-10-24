import { supabase } from '../../../lib/supabaseClient';

// pega os generos relacionais
type Genre = { id: number; name: string };
// pega elementos importantes do filmes para o algoritmo
type Movie = { id: string; title: string; genres: Genre[] };

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

// separador dos generos
function buildGenreList(movies: Movie[]): string[] {
  return Array.from(new Set(movies.flatMap(m => m.genres.map(g => g.name))));
}

// conversão de genero para vetor para tangibilidade dos calculos
function genresToVector(genres: Genre[], allGenres: string[]): number[] {
  return allGenres.map(g => (genres.some(gg => gg.name === g) ? 1 : 0));
}

// fetching de likes e dislikes

async function fetchAllMovies(): Promise<Movie[]> {
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('tconst, primary_title');
  if (moviesError) throw moviesError;

  // fetch nas relações filmes-genero
  const { data: movieGenres, error: mgError } = await supabase
    .from('movie_genres')
    .select('movie_id, genre_id');
  if (mgError) throw mgError;

  // fetch dos generos
  const { data: genres, error: gError } = await supabase
    .from('genres_name')
    .select('id, name');
  if (gError) throw gError;

  // merge manual (fix temporario?)
  return movies.map(movie => ({
    id: movie.tconst,
    title: movie.primary_title,
    genres: movieGenres
      .filter(mg => mg.movie_id === movie.tconst)
      .map(mg => ({
        id: mg.genre_id,
        name: genres.find(g => g.id === mg.genre_id)?.name || '',
      })),
  }));
}

async function fetchUserMovies(
  profileId: string,
  type: 'like' | 'dislike',
): Promise<Movie[]> {
  // fetch de interações do usuario
  const { data: interactions, error: iError } = await supabase
    .from('user_movie_interactions')
    .select('movie_id')
    .eq('profile_id', profileId)
    .eq('interaction_type', type);
  if (iError) throw iError;

  const movieIds = interactions.map((i: any) => i.movie_id);

  if (movieIds.length === 0) return [];

  // fetch dos filmes
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('tconst, primary_title')
    .in('tconst', movieIds);
  if (moviesError) throw moviesError;

  // fetch das relações filme-genero
  const { data: movieGenres, error: mgError } = await supabase
    .from('movie_genres')
    .select('movie_id, genre_id')
    .in('movie_id', movieIds);
  if (mgError) throw mgError;

  // fetch dos generos
  const { data: genres, error: gError } = await supabase
    .from('genres_name')
    .select('id, name');
  if (gError) throw gError;

  // merge manual (temporario?)
  return movies.map(movie => ({
    id: movie.tconst,
    title: movie.primary_title,
    genres: movieGenres
      .filter(mg => mg.movie_id === movie.tconst)
      .map(mg => ({
        id: mg.genre_id,
        name: genres.find(g => g.id === mg.genre_id)?.name || '',
      })),
  }));
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

  const allGenres = buildGenreList(allMovies);

  const likedVectors = likedMovies.map(m =>
    genresToVector(m.genres, allGenres),
  );
  const dislikedVectors = dislikedMovies.map(m =>
    genresToVector(m.genres, allGenres),
  );
  // determina peso dos generos baseados em frequência
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

  // recomenda os filmes baseados no peso final
  const scored = allMovies
    .filter(m => !interactedIds.has(m.id))
    .map(movie => ({
      ...movie,
      similarity: cosineSimilarity(
        userProfile,
        genresToVector(movie.genres, allGenres),
      ),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}
