import { useState, useCallback } from 'react';
import OMDBService from '../services/api/omdb';
import type { OMDBSearchResponse, OMDBMovieDetail } from '../services/api/omdb';

interface UseOMDBState {
    loading: boolean;
    error: string | null;
    data: OMDBSearchResponse | OMDBMovieDetail | null;
}

export const useOMDB = () => {
    const [state, setState] = useState<UseOMDBState>({
        loading: false,
        error: null,
        data: null,
    });

    const searchMovies = useCallback(async (
        query: string,
        year?: string,
        type?: 'movie' | 'series' | 'episode'
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await OMDBService.searchMovies(query, year, type);
            setState({ loading: false, error: null, data: result });
        } catch (error) {
            setState({
                loading: false,
                error: error instanceof Error ? error.message : 'An error occurred',
                data: null
            });
        }
    }, []);

    const getMovieById = useCallback(async (imdbId: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await OMDBService.getMovieById(imdbId);
            setState({ loading: false, error: null, data: result });
        } catch (error) {
            setState({
                loading: false,
                error: error instanceof Error ? error.message : 'An error occurred',
                data: null
            });
        }
    }, []);

    const getMovieByTitle = useCallback(async (title: string, year?: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await OMDBService.getMovieByTitle(title, year);
            setState({ loading: false, error: null, data: result });
        } catch (error) {
            setState({
                loading: false,
                error: error instanceof Error ? error.message : 'An error occurred',
                data: null
            });
        }
    }, []);

    const clearData = useCallback(() => {
        setState({ loading: false, error: null, data: null });
    }, []);

    return {
        ...state,
        searchMovies,
        getMovieById,
        getMovieByTitle,
        clearData,
    };
};
