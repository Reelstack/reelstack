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

export interface MoviesResponse<T = Movie> {
    data: T[] | null;
    error: any;
}

export class MoviesService {
    /**
     * Pega todos os filmes com todas as colunas
     */
    static async getAllMovies(): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Pega todos os filmes com as colunas essenciais
     */
    static async getAllMoviesBasic(): Promise<MoviesResponse<BasicMovie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, startYear');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Paginando todos os filmes
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
     * Pega os filmes com as colunas essenciais e páginados 
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
     * Filmes por ano
     */
    static async getMoviesByYear(year: number): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .eq('startYear', year);

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Filmes por título
     */
    static async getMoviesByTitle(title: string): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .ilike('primaryTitle', `%${title}%`);

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Filmes no range de anos
     */
    static async getMoviesByYearRange(
        startYear: number,
        endYear: number
    ): Promise<MoviesResponse<Movie>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('*')
                .gte('startYear', startYear)
                .lte('startYear', endYear);

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

            return { data: data ? [data] : null, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     *  pega os filmes com filtros
     */
    static async getMoviesWithFilters(filters: {
        year?: number;
        yearFrom?: number;
        yearTo?: number;
        title?: string;
        limit?: number;
        offset?: number;
    }): Promise<MoviesResponse<Movie>> {
        try {
            let query = supabase
                .from('movies')
                .select('*');

            // filtros em questão
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

            // Apply pagination
            if (filters.limit) {
                const from = filters.offset || 0;
                const to = from + filters.limit - 1;
                query = query.range(from, to);
            }

            const { data, error } = await query;

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    // metodos para selecionar colunas específicas

    /**
     * pega os filmes com o título
     */
    static async getMoviesTitlesOnly(): Promise<MoviesResponse<{ tconst: string, primaryTitle: string | null, originalTitle: string | null }>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, originalTitle');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Pega os filmes com o rating
     */
    static async getMoviesWithRatings(): Promise<MoviesResponse<{ tconst: string, primaryTitle: string | null, averageRating: number | null, numVotes: number | null }>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, averageRating, numVotes');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Pega os filmes com o gênero
     */
    static async getMoviesWithGenres(): Promise<MoviesResponse<{ tconst: string, primaryTitle: string | null, genres: string | null, titleType: string | null }>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, genres, titleType');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * pega os filmes com o runtime
     */
    static async getMoviesWithRuntime(): Promise<MoviesResponse<{ tconst: string, primaryTitle: string | null, runtimeMinutes: number | null, startYear: number | null, endYear: number | null }>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('tconst, primaryTitle, runtimeMinutes, startYear, endYear');

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }

    /**
     * Pega os filmes com as colunas específicas
     */
    static async getMoviesWithCustomColumns(columns: string[]): Promise<MoviesResponse<any>> {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select(columns.join(', '));

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }
}

export default MoviesService;
