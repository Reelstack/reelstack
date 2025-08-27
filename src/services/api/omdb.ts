// OMDb API service
const OMDB_API_BASE_URL = 'https://www.omdbapi.com/';
const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

// OMDb API response types
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

// API service class
export class OMDBService {
    private static async makeRequest<T>(params: Record<string, string>): Promise<T> {
        const url = new URL(OMDB_API_BASE_URL);

        // Add API key and other parameters
        Object.entries({ ...params, apikey: API_KEY }).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.Response === 'False') {
                throw new Error(data.Error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('OMDb API request failed:', error);
            throw error;
        }
    }

    // Search for movies by title
    static async searchMovies(query: string, year?: string, type?: 'movie' | 'series' | 'episode'): Promise<OMDBSearchResponse> {
        const params: Record<string, string> = { s: query };
        if (year) params.y = year;
        if (type) params.type = type;

        return this.makeRequest<OMDBSearchResponse>(params);
    }

    // Get movie details by IMDB ID
    static async getMovieById(imdbId: string): Promise<OMDBMovieDetail> {
        return this.makeRequest<OMDBMovieDetail>({ i: imdbId });
    }

    // Get movie details by title
    static async getMovieByTitle(title: string, year?: string): Promise<OMDBMovieDetail> {
        const params: Record<string, string> = { t: title };
        if (year) params.y = year;

        return this.makeRequest<OMDBMovieDetail>(params);
    }
}

// Export default instance
export default OMDBService;
