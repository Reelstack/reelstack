import { BaseAPIClient } from './base';
import type {
    OMDBSearchResponse,
    OMDBMovieDetail,
    APIConfig
} from './types';

export class OMDBService extends BaseAPIClient {
    constructor() {
        const config: APIConfig = {
            baseURL: 'https://www.omdbapi.com/',
            apiKey: import.meta.env.VITE_OMDB_API_KEY,
            timeout: 10000 // 10 segundos
        };
        super(config);
    }

    // Busca filmes por título
    async searchMovies(
        query: string,
        year?: string,
        type?: 'movie' | 'series' | 'episode'
    ): Promise<OMDBSearchResponse> {
        const params: Record<string, string> = {
            s: query,
            apikey: this.config.apiKey
        };

        if (year) params.y = year;
        if (type) params.type = type;

        const response = await this.makeRequest<OMDBSearchResponse>('', params);

        if (response.Response === 'False') {
            this.handleAPIError(response, 'Falha na busca de filmes');
        }

        return response;
    }

    // Obtém detalhes do filme por ID do IMDB
    async getMovieById(imdbId: string): Promise<OMDBMovieDetail> {
        const params = {
            i: imdbId,
            apikey: this.config.apiKey
        };

        const response = await this.makeRequest<OMDBMovieDetail>('', params);

        if (response.Response === 'False') {
            this.handleAPIError(response, 'Falha ao obter detalhes do filme');
        }

        return response;
    }

    // Obtém detalhes do filme por título
    async getMovieByTitle(title: string, year?: string): Promise<OMDBMovieDetail> {
        const params: Record<string, string> = {
            t: title,
            apikey: this.config.apiKey
        };

        if (year) params.y = year;

        const response = await this.makeRequest<OMDBMovieDetail>('', params);

        if (response.Response === 'False') {
            this.handleAPIError(response, 'Falha ao obter detalhes do filme');
        }

        return response;
    }

    // Obtém múltiplos filmes por título (útil para séries)
    async getMoviesByTitle(title: string, year?: string): Promise<OMDBSearchResponse> {
        const params: Record<string, string> = {
            s: title,
            apikey: this.config.apiKey
        };

        if (year) params.y = year;

        const response = await this.makeRequest<OMDBSearchResponse>('', params);

        if (response.Response === 'False') {
            this.handleAPIError(response, 'Falha ao obter filmes');
        }

        return response;
    }
}

// Exporta instância padrão
export default OMDBService;
