import { supabase } from '../../lib/supabaseClient';

// todas as colunas
export interface Movie {
    tconst: string;
    titleType: string | null;
    primaryTitle: string | null;
    originalTitle: string | null;
    isAdult: boolean | null;
    startYear: number | null;
    endYear: number | null;
    runtimeMinutes: number | null;
    genres: string | null;
    averageRating: number | null;
    numVotes: number | null;
}

// Só o essencial
export interface BasicMovie {
    tconst: string;
    primaryTitle: string | null;
    startYear: number | null;
}

// Interfaces para colunas específicas
export interface MovieTitles {
    tconst: string;
    primaryTitle: string | null;
    originalTitle: string | null;
}

export interface MovieRatings {
    tconst: string;
    primaryTitle: string | null;
    averageRating: number | null;
    numVotes: number | null;
}

export interface MovieGenres {
    tconst: string;
    primaryTitle: string | null;
    genres: string | null;
    titleType: string | null;
}

export interface MovieRuntime {
    tconst: string;
    primaryTitle: string | null;
    runtimeMinutes: number | null;
    startYear: number | null;
    endYear: number | null;
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
        to: number = 9
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
        to: number = 9
    ): Promise<MoviesResponse<BasicMovie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, startYear')
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
     * @param orderBy Campo para ordenação (padrão: 'primaryTitle')
     * @param ascending Ordenação crescente ou decrescente (padrão: true)
     */
    static async searchMovies(
        filters: {
            year?: number;
            yearFrom?: number;
            yearTo?: number;
            title?: string;
            originalTitle?: string;
            genre?: string;
            titleType?: string;
            isAdult?: boolean;
            minRating?: number;
            maxRating?: number;
            minVotes?: number;
            minRuntime?: number;
            maxRuntime?: number;
        },
        limit: number = 20,
        offset: number = 0,
        orderBy: keyof Movie = 'primaryTitle',
        ascending: boolean = true
    ): Promise<MoviesResponse<Movie>> {
        try {
            let query = supabase
                .from('movies')
                .select('*');

            // Aplicar filtros de ano
            if (filters.year) {
                query = query.eq('startYear', filters.year);
            }
            if (filters.yearFrom) {
                query = query.gte('startYear', filters.yearFrom);
            }
            if (filters.yearTo) {
                query = query.lte('startYear', filters.yearTo);
            }

            // Aplicar filtros de título
            if (filters.title) {
                query = query.ilike('primaryTitle', `%${filters.title}%`);
            }
            if (filters.originalTitle) {
                query = query.ilike('originalTitle', `%${filters.originalTitle}%`);
            }

            // Aplicar filtros de gênero e tipo
            if (filters.genre) {
                query = query.ilike('genres', `%${filters.genre}%`);
            }
            if (filters.titleType) {
                query = query.eq('titleType', filters.titleType);
            }
            if (filters.isAdult !== undefined) {
                query = query.eq('isAdult', filters.isAdult);
            }

            // Aplicar filtros de rating
            if (filters.minRating) {
                query = query.gte('averageRating', filters.minRating);
            }
            if (filters.maxRating) {
                query = query.lte('averageRating', filters.maxRating);
            }
            if (filters.minVotes) {
                query = query.gte('numVotes', filters.minVotes);
            }

            // Aplicar filtros de runtime
            if (filters.minRuntime) {
                query = query.gte('runtimeMinutes', filters.minRuntime);
            }
            if (filters.maxRuntime) {
                query = query.lte('runtimeMinutes', filters.maxRuntime);
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

            // Consistent with other methods - return array or null
            return { data: data ? [data] : null, error };
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
        offset: number = 0
    ): Promise<MoviesResponse<Record<string, unknown>>> {
        try {
            // Validação básica
            if (!columns || columns.length === 0) {
                return { data: null, error: new Error('Columns array cannot be empty') };
            }

            const { data, error } = await supabase
                .from('movies')
                .select(columns.join(', '))
                .range(offset, offset + limit - 1);

            return { data: data as unknown as Record<string, unknown>[] | null, error };
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
        minVotes: number = 1000
    ): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .gte('numVotes', minVotes)
                .not('averageRating', 'is', null)
                .order('averageRating', { ascending: false })
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
        offset: number = 0
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
        titleType?: string;
        isAdult?: boolean;
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
                    query = query.eq('startYear', filters.year);
                }
                if (filters.yearFrom) {
                    query = query.gte('startYear', filters.yearFrom);
                }
                if (filters.yearTo) {
                    query = query.lte('startYear', filters.yearTo);
                }
                if (filters.title) {
                    query = query.ilike('primaryTitle', `%${filters.title}%`);
                }
                if (filters.genre) {
                    query = query.ilike('genres', `%${filters.genre}%`);
                }
                if (filters.titleType) {
                    query = query.eq('titleType', filters.titleType);
                }
                if (filters.isAdult !== undefined) {
                    query = query.eq('isAdult', filters.isAdult);
                }
                if (filters.minRating) {
                    query = query.gte('averageRating', filters.minRating);
                }
                if (filters.maxRating) {
                    query = query.lte('averageRating', filters.maxRating);
                }
                if (filters.minVotes) {
                    query = query.gte('numVotes', filters.minVotes);
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
        offset: number = 0
    ): Promise<MoviesResponse<Movie>> {
        try {
            if (!genres || genres.length === 0) {
                return { data: null, error: new Error('Genres array cannot be empty') };
            }

            // Criar filtro OR para múltiplos gêneros
            const genreFilters = genres.map(genre => `genres.ilike.%${genre}%`).join(',');

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
     * @param titleTypes Array de tipos de título (movie, tvSeries, etc.)
     * @param limit Limite de resultados (padrão: 20)
     * @param offset Offset para paginação (padrão: 0)
     */
    static async getMoviesByTitleTypes(
        titleTypes: string[],
        limit: number = 20,
        offset: number = 0
    ): Promise<MoviesResponse<Movie>> {
        try {
            if (!titleTypes || titleTypes.length === 0) {
                return { data: null, error: new Error('Title types array cannot be empty') };
            }

            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .in('titleType', titleTypes)
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
        yearTo?: number
    ): Promise<MoviesResponse<Movie>> {
        try {
            let query = supabase
                .from('movies')
                .select('*')
                .not('numVotes', 'is', null)
                .order('numVotes', { ascending: false });

            if (yearFrom) {
                query = query.gte('startYear', yearFrom);
            }
            if (yearTo) {
                query = query.lte('startYear', yearTo);
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
        offset: number = 0
    ): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .gte('runtimeMinutes', minMinutes)
                .lte('runtimeMinutes', maxMinutes)
                .range(offset, offset + limit - 1);

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

}

export default MoviesService;