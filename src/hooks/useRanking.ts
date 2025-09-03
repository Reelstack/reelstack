import { useState, useCallback } from 'react';
import { RankingService } from '../services/api/ranking';
import type { TopMoviesResponse, MovieRanking } from '../services/api/types';

export const useRanking = () => {
    const [data, setData] = useState<TopMoviesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const rankingService = new RankingService();

    const getTop10AllTime = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await rankingService.getTop10AllTime();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, []);

    const getTop10ByGenre = useCallback(async (genre: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await rankingService.getTop10ByGenre(genre);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, []);

    const getTop10ByCustomList = useCallback(async (movieTitles: string[]) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await rankingService.getTop10Movies(movieTitles);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, []);

    const clearData = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return {
        data,
        loading,
        error,
        getTop10AllTime,
        getTop10ByGenre,
        getTop10ByCustomList,
        clearData
    };
};
