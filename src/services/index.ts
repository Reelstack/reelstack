// Serviços da API
export { default as OMDBService } from './api/omdb';

// Tipos
export type {
    OMDBMovie,
    OMDBSearchResponse,
    OMDBMovieDetail,
    APIResponse,
    APIConfig
} from './api/types';

// Classes Base
export { BaseAPIClient } from './api/base';
