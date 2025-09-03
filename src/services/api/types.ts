// Tipos de resposta da API OMDb
export interface OMDBMovie {
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
}

export interface OMDBSearchResponse {
    Search: OMDBMovie[];
    totalResults: string;
    Response: string;
}

export interface OMDBMovieDetail {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Poster: string;
    Ratings: Array<{ Source: string; Value: string }>;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    DVD: string;
    BoxOffice: string;
    Production: string;
    Website: string;
    Response: string;
}

// Wrapper genérico de resposta da API
export interface APIResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

// Configuração da API
export interface APIConfig {
    baseURL: string;
    apiKey: string;
    timeout: number;
}

// Tipos para o sistema de ranking
export interface MovieRanking {
    movie: OMDBMovieDetail;
    score: number;
    ranking: number;
    criteria: RankingCriteria;
}

export interface RankingCriteria {
    imdbRating: number;
    imdbVotes: number;
    year: number;
    runtime: number;
    boxOffice: number;
}

export interface TopMoviesResponse {
    movies: MovieRanking[];
    totalCount: number;
    lastUpdated: string;
}
