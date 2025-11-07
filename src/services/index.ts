// Serviços da API
export { default as OMDBService } from './api/omdb/omdb';
export * as MoviesService from './api/supa-api/movies';

// Tipos
export type {
  OMDBMovie,
  OMDBSearchResponse,
  OMDBMovieDetail,
  APIResponse,
  APIConfig,
} from './api/omdb/types';

export type {
  Movie,
  BasicMovie,
  MoviesResponse,
  MovieTitles,
  MovieRatings,
  MovieGenres,
  MovieRuntime,
} from './api/supa-api/movies';

// Classes Base
export { BaseAPIClient } from './api/omdb/base';
