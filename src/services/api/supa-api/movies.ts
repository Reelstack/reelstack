import { supabase } from '../../../lib/supabaseClient';

// All columns
export interface Movie {
  tconst: string;
  title_type_id: string | null;
  primary_title: string | null;
  original_title: string | null;
  is_adult: boolean | null;
  start_year: number | null;
  end_year: number | null;
  runtime_minutes: number | null;
  genres: string | null;
  average_rating: number | null;
  num_votes: number | null;
  director: string | null;
  actors: string | null;
  banner: string | null;
}

// Essential fields only
export interface BasicMovie {
  tconst: string;
  primary_title: string | null;
  start_year: number | null;
}

// Interfaces para colunas específicas
export interface MovieTitles {
  tconst: string;
  primary_title: string | null;
  original_title: string | null;
}

export interface MovieRatings {
  tconst: string;
  primary_title: string | null;
  average_rating: number | null;
  num_votes: number | null;
}

export interface MovieGenres {
  tconst: string;
  primary_title: string | null;
  genres: string | null;
  title_type_id: string | null;
}

export interface MovieRuntime {
  tconst: string;
  primary_title: string | null;
  runtime_minutes: number | null;
  start_year: number | null;
  end_year: number | null;
}

export interface UserMovieInteraction {
  id?: number;
  profile_id: string;
  movie_id: string;
  interaction_type: 'like' | 'dislike';
  created_at?: string;
}

export interface MoviesResponse<T = Movie> {
  data: T[] | null;
  error: unknown;
}

export class MoviesService {
  /**
   * Pega filmes paginados com todas as colunas
   * @param from Índice inicial (padrão: 0)
   * @param to Índice final (padrão: 9)
   */
  static async getMoviesPaginated(
    from: number = 0,
    to: number = 9,
  ): Promise<MoviesResponse<Movie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .range(from, to);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Pega filmes paginados com colunas essenciais
   * @param from Índice inicial (padrão: 0)
   * @param to Índice final (padrão: 9)
   */
  static async getMoviesPaginatedBasic(
    from: number = 0,
    to: number = 9,
  ): Promise<MoviesResponse<BasicMovie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('tconst, primary_title, start_year')
        .range(from, to);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca avançada de filmes com múltiplos filtros
   * @param filters Filtros para busca
   * @param limit Limite de resultados (padrão: 20)
   * @param offset Offset para paginação (padrão: 0)
   * @param orderBy Campo para ordenação (padrão: 'primary_title')
   * @param ascending Ordenação crescente ou decrescente (padrão: true)
   */
  static async searchMovies(
    filters: {
      year?: number;
      yearFrom?: number;
      yearTo?: number;
      title?: string;
      original_title?: string;
      genre?: string;
      title_type_id?: string;
      is_adult?: boolean;
      minRating?: number;
      maxRating?: number;
      minVotes?: number;
      minRuntime?: number;
      maxRuntime?: number;
    },
    limit: number = 20,
    offset: number = 0,
    orderBy: keyof Movie = 'primary_title',
    ascending: boolean = true,
  ): Promise<MoviesResponse<Movie>> {
    try {
      let query = supabase.from('movies').select('*');

      // Aplicar filtros de ano
      if (filters.year) {
        query = query.eq('start_year', filters.year);
      }
      if (filters.yearFrom) {
        query = query.gte('start_year', filters.yearFrom);
      }
      if (filters.yearTo) {
        query = query.lte('start_year', filters.yearTo);
      }

      // Aplicar filtros de título
      // Melhorar busca para encontrar por primary_title OU original_title
      if (filters.title) {
        // Busca em ambos os campos usando OR para melhor matching
        query = query.or(
          `primary_title.ilike.%${filters.title}%,original_title.ilike.%${filters.title}%`
        );
      }
      if (filters.original_title && !filters.title) {
        // Se apenas original_title foi fornecido, busca apenas nele
        query = query.ilike('original_title', `%${filters.original_title}%`);
      }

      // Aplicar filtros de gênero e tipo
      if (filters.genre) {
        query = query.ilike('genres', `%${filters.genre}%`);
      }
      if (filters.title_type_id) {
        query = query.eq('title_type_id', filters.title_type_id);
      }
      if (filters.is_adult !== undefined) {
        query = query.eq('is_adult', filters.is_adult);
      }

      // Aplicar filtros de rating
      if (filters.minRating) {
        query = query.gte('average_rating', filters.minRating);
      }
      if (filters.maxRating) {
        query = query.lte('average_rating', filters.maxRating);
      }
      if (filters.minVotes) {
        query = query.gte('num_votes', filters.minVotes);
      }

      // Aplicar filtros de runtime
      if (filters.minRuntime) {
        query = query.gte('runtime_minutes', filters.minRuntime);
      }
      if (filters.maxRuntime) {
        query = query.lte('runtime_minutes', filters.maxRuntime);
      }

      // Aplicar ordenação
      query = query.order(orderBy, { ascending });

      // Aplicar paginação
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Pega um filme específico pelo tconst
   */
  static async getMovieById(tconst: string): Promise<MoviesResponse<Movie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('tconst', tconst)
        .single();

      // Return a single movie object or null
      return { data: data ?? null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca filmes por colunas específicas com limite
   * @param columns Colunas a serem selecionadas
   * @param limit Limite de resultados (padrão: 50)
   * @param offset Offset para paginação (padrão: 0)
   */
  static async getMoviesByColumns(
    columns: string[],
    limit: number = 50,
    offset: number = 0,
  ): Promise<MoviesResponse<Record<string, unknown>>> {
    try {
      // Validação básica
      if (!columns || columns.length === 0) {
        return {
          data: null,
          error: new Error('Columns array cannot be empty'),
        };
      }

      const { data, error } = await supabase
        .from('movies')
        .select(columns.join(', '))
        .range(offset, offset + limit - 1);

      return { data: data as Record<string, unknown>[] | null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca os filmes mais bem avaliados
   * @param limit Limite de resultados (padrão: 20)
   * @param minVotes Mínimo de votos para considerar (padrão: 1000)
   */
  static async getTopRatedMovies(
    limit: number = 20,
    minVotes: number = 1000,
  ): Promise<MoviesResponse<Movie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .gte('num_votes', minVotes)
        .not('average_rating', 'is', null)
        .order('average_rating', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca filmes por gênero específico
   * @param genre Gênero a ser buscado
   * @param limit Limite de resultados (padrão: 20)
   * @param offset Offset para paginação (padrão: 0)
   */
  static async getMoviesByGenre(
    genre: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<MoviesResponse<Movie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('genres', `%${genre}%`)
        .range(offset, offset + limit - 1);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Conta o total de filmes que atendem aos critérios
   * @param filters Filtros opcionais para contagem
   */
  static async countMovies(filters?: {
    year?: number;
    yearFrom?: number;
    yearTo?: number;
    title?: string;
    genre?: string;
    title_type_id?: string;
    is_adult?: boolean;
    minRating?: number;
    maxRating?: number;
    minVotes?: number;
  }): Promise<{ count: number | null; error: unknown }> {
    try {
      let query = supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });

      if (filters) {
        if (filters.year) {
          query = query.eq('start_year', filters.year);
        }
        if (filters.yearFrom) {
          query = query.gte('start_year', filters.yearFrom);
        }
        if (filters.yearTo) {
          query = query.lte('start_year', filters.yearTo);
        }
        if (filters.title) {
          query = query.ilike('primary_title', `%${filters.title}%`);
        }
        if (filters.genre) {
          query = query.ilike('genres', `%${filters.genre}%`);
        }
        if (filters.title_type_id) {
          query = query.eq('title_type_id', filters.title_type_id);
        }
        if (filters.is_adult !== undefined) {
          query = query.eq('is_adult', filters.is_adult);
        }
        if (filters.minRating) {
          query = query.gte('average_rating', filters.minRating);
        }
        if (filters.maxRating) {
          query = query.lte('average_rating', filters.maxRating);
        }
        if (filters.minVotes) {
          query = query.gte('num_votes', filters.minVotes);
        }
      }

      const { count, error } = await query;
      return { count, error };
    } catch (err) {
      return { count: null, error: err };
    }
  }

  /**
   * Busca filmes por múltiplos gêneros
   * @param genres Array de gêneros
   * @param limit Limite de resultados (padrão: 20)
   * @param offset Offset para paginação (padrão: 0)
   */
  static async getMoviesByMultipleGenres(
    genres: string[],
    limit: number = 20,
    offset: number = 0,
  ): Promise<MoviesResponse<Movie>> {
    // Helper function to validate genre strings (letters, numbers, spaces, hyphens, underscores)
    function isValidGenre(genre: string): boolean {
      // Permite letras com acentos, números, espaços, hífens e underscores
      return /^[\p{L}\p{N}\s_-]+$/u.test(genre);
    }

    try {
      if (!genres || genres.length === 0) {
        return { data: null, error: new Error('Genres array cannot be empty') };
      }

      // Sanitize genres: normalize and only allow valid strings
      const safeGenres = genres
        .map(g => g.trim().toLowerCase())
        .filter(isValidGenre);

      if (safeGenres.length === 0) {
        return { data: null, error: new Error('No valid genres provided') };
      }

      // Criar filtro OR para múltiplos gêneros
      const genreFilters = safeGenres
        .map(genre => `genres.ilike.%${genre}%`)
        .join(',');

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .or(genreFilters)
        .range(offset, offset + limit - 1);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca filmes por tipo de título
   * @param title_type_ids Array de tipos de título (movie, tvSeries, etc.)
   * @param limit Limite de resultados (padrão: 20)
   * @param offset Offset para paginação (padrão: 0)
   */
  static async getMoviesBytitle_type_ids(
    title_type_ids: string[],
    limit: number = 20,
    offset: number = 0,
  ): Promise<MoviesResponse<Movie>> {
    try {
      if (!title_type_ids || title_type_ids.length === 0) {
        return {
          data: null,
          error: new Error('Title types array cannot be empty'),
        };
      }

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .in('title_type_id', title_type_ids)
        .range(offset, offset + limit - 1);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca filmes mais populares por número de votos
   * @param limit Limite de resultados (padrão: 20)
   * @param yearFrom Ano mínimo (opcional)
   * @param yearTo Ano máximo (opcional)
   */
  static async getMostPopularMovies(
    limit: number = 20,
    yearFrom?: number,
    yearTo?: number,
  ): Promise<MoviesResponse<Movie>> {
    try {
      let query = supabase
        .from('movies')
        .select('*')
        .not('num_votes', 'is', null)
        .order('num_votes', { ascending: false });

      if (yearFrom) {
        query = query.gte('start_year', yearFrom);
      }
      if (yearTo) {
        query = query.lte('start_year', yearTo);
      }

      query = query.limit(limit);
      const { data, error } = await query;

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Busca filmes por duração específica
   * @param minMinutes Duração mínima em minutos
   * @param maxMinutes Duração máxima em minutos
   * @param limit Limite de resultados (padrão: 20)
   * @param offset Offset para paginação (padrão: 0)
   */
  static async getMoviesByRuntime(
    minMinutes: number,
    maxMinutes: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<MoviesResponse<Movie>> {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .gte('runtime_minutes', minMinutes)
        .lte('runtime_minutes', maxMinutes)
        .range(offset, offset + limit - 1);

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async addUserMovieInteraction({
    profileId,
    movieId,
    interactionType,
  }: {
    profileId: string;
    movieId: string;
    interactionType: 'like' | 'dislike';
  }) {
    // checa se ja existe interações
    const { data: existing, error: selectError } = await supabase
      .from('user_movie_interactions')
      .select('id')
      .eq('profile_id', profileId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      // atualiza as interações caso exista
      const { data, error } = await supabase
        .from('user_movie_interactions')
        .update({ interaction_type: interactionType })
        .eq('id', existing.id)
        .select();

      if (error) throw error;
      return data;
    } else {
      // caso não exista, insere uma interação
      const { data, error } = await supabase
        .from('user_movie_interactions')
        .insert({
          profile_id: profileId,
          movie_id: movieId,
          interaction_type: interactionType,
        })
        .select();

      if (error) throw error;
      return data;
    }
  }
  static async getUserMovies(
    profileId: string,
    interactionType: 'like' | 'dislike',
  ) {
    const { data, error } = await supabase
      .from('user_movie_interactions')
      .select(`
        movies(
          *,
          movie_genres:movie_genres(
            genre_id,
            genres_name(
              name
            )
          )
        )
      `)
      .eq('profile_id', profileId)
      .eq('interaction_type', interactionType)
      .order('created_at', { ascending: false }); // organiza em ordem do mais recente

    if (error) throw error;

    const movies = data // muda o array de arrays em um array simples
      .map((d: any) => {
        const movie = d.movies;
        if (!movie) return null;
        
        // Join genres from the relationship and format as comma-separated string
        let genresString: string | null = null;
        
        if (movie.movie_genres && Array.isArray(movie.movie_genres)) {
          const genresArray = movie.movie_genres
            .map((mg: any) => {
              if (!mg) return null;
              const genre = Array.isArray(mg.genres_name)
                ? mg.genres_name[0]?.name || ''
                : mg.genres_name?.name || '';
              return genre;
            })
            .filter(Boolean);
          
          genresString = genresArray.length > 0 ? genresArray.join(', ') : null;
        }
        
        // Remove movie_genres from the spread since we've extracted genres
        const { movie_genres, ...movieWithoutGenres } = movie;
        
        return {
          ...movieWithoutGenres,
          genres: genresString,
        };
      })
      .filter((m: any): m is Movie => !!m); // filtro para evitar problemas
    return movies;
  }

  /**
   * Remove a movie interaction (like/dislike) from the user's profile
   * @param profileId User's profile ID
   * @param movieId Movie ID (tconst)
   * @param interactionType Type of interaction to remove
   */
  static async removeUserMovieInteraction({
    profileId,
    movieId,
    interactionType,
  }: {
    profileId: string;
    movieId: string;
    interactionType: 'like' | 'dislike';
  }) {
    const { error } = await supabase
      .from('user_movie_interactions')
      .delete()
      .eq('profile_id', profileId)
      .eq('movie_id', movieId)
      .eq('interaction_type', interactionType);

    if (error) throw error;
    return { success: true };
  }
}
