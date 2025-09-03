// Serviços da API
export { default as OMDBService } from './api/omdb';
export { default as RankingService } from './api/ranking';

// Tipos
export type {
    OMDBMovie,
    OMDBSearchResponse,
    OMDBMovieDetail,
    APIResponse,
    APIConfig,
    MovieRanking,
    RankingCriteria,
    TopMoviesResponse
} from './api/types';

// Classes Base
export { BaseAPIClient } from './api/base';
