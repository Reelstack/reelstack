// Serviços da API
export { default as OMDBService } from './api/omdb';
export { default as MoviesService } from './api/movies';

// Tipos
export type {
    OMDBMovie,
    OMDBSearchResponse,
    OMDBMovieDetail,
    APIResponse,
    APIConfig
} from './api/types';

export type {
    Movie,
    BasicMovie,
    MoviesResponse,
    MovieTitles,
    MovieRatings,
    MovieGenres,
    MovieRuntime
} from './api/movies';

// Classes Base
export { BaseAPIClient } from './api/base';
