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

  const likedVectors = likedMovies.map(m =>
    movieToVector(m, allGenres, allDirectors, allActors),
  );
  const dislikedVectors = dislikedMovies.map(m =>
    movieToVector(m, allGenres, allDirectors, allActors),
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
    .map(movie => {
      const similarity = cosineSimilarity(
        userProfile,
        movieToVector(movie, allGenres, allDirectors, allActors),
      );

      // Normalise average_rating pra [0, 1]
      const ratingScore = movie.average_rating
        ? movie.average_rating / 10 // estilos proximos ao IMDB vão até 10
        : 0.5; // neutralizar caso estiver faltando

      // Combine similaridade + rating weight
      const finalScore = 0.7 * similarity + 0.3 * ratingScore;

      return { ...movie, similarity, finalScore };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  return scored;
}
