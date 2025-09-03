import React, { useState } from 'react';
import { useRanking } from '../hooks/useRanking';
import type { MovieRanking } from '../services/api/types';
import '../styles/top10movies.css';

const Top10Movies: React.FC = () => {
    const { data, loading, error, getTop10AllTime, getTop10ByGenre, getTop10ByCustomList } = useRanking();
    const [customMovies, setCustomMovies] = useState<string>('');
    const [selectedGenre, setSelectedGenre] = useState<string>('drama');

    const handleCustomList = () => {
        const movies = customMovies
            .split('\n')
            .map(m => m.trim())
            .filter(m => m.length > 0);
        
        if (movies.length > 0) {
            getTop10ByCustomList(movies);
        }
    };

    const formatScore = (score: number) => {
        return (score * 100).toFixed(1);
    };

    const formatBoxOffice = (boxOffice: string) => {
        if (!boxOffice || boxOffice === 'N/A') return 'N/A';
        return boxOffice;
    };

    const getScoreClass = (score: number) => {
        if (score >= 0.8) return 'score-excellent';
        if (score >= 0.6) return 'score-good';
        return 'score-poor';
    };

    return (
        <div className="top10-container">
            <h1 className="top10-title">
                🎬 Top 10 Filmes - Algoritmo de Cascata
            </h1>
            
            {/* Controles */}
            <div className="controls-container">
                <button
                    onClick={getTop10AllTime}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Carregando...' : 'Top 10 de Todos os Tempos'}
                </button>

                <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="genre-select"
                >
                    <option value="drama">Drama</option>
                    <option value="action">Ação</option>
                    <option value="comedy">Comédia</option>
                    <option value="sci-fi">Ficção Científica</option>
                </select>

                <button
                    onClick={() => getTop10ByGenre(selectedGenre)}
                    disabled={loading}
                    className="btn btn-success"
                >
                    {loading ? 'Carregando...' : `Top 10 ${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}`}
                </button>
            </div>

            {/* Lista Customizada */}
            <div className="custom-list-container">
                <h3 className="custom-list-title">Lista Personalizada</h3>
                <div className="custom-list-content">
                    <textarea
                        value={customMovies}
                        onChange={(e) => setCustomMovies(e.target.value)}
                        placeholder="Digite um filme por linha...&#10;Exemplo:&#10;The Shawshank Redemption&#10;The Godfather&#10;Pulp Fiction"
                        className="custom-list-textarea"
                        rows={4}
                    />
                    <button
                        onClick={handleCustomList}
                        disabled={loading || !customMovies.trim()}
                        className="btn btn-purple custom-list-btn"
                    >
                        {loading ? 'Carregando...' : 'Calcular Top 10'}
                    </button>
                </div>
            </div>

            {/* Exibição de Erro */}
            {error && (
                <div className="error-message">
                    <strong>Erro:</strong> {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Calculando ranking com algoritmo de cascata...</p>
                </div>
            )}

            {/* Resultados */}
            {data && data.movies.length > 0 && (
                <div className="results-container">
                    <div className="results-header">
                        <p className="results-update">
                            Última atualização: {new Date(data.lastUpdated).toLocaleString('pt-BR')}
                        </p>
                        <p className="results-success">
                            Algoritmo de cascata aplicado com sucesso!
                        </p>
                    </div>

                    {data.movies.map((ranking: MovieRanking) => (
                        <div key={ranking.movie.imdbID} className="movie-card">
                            <div className="movie-content">
                                {/* Poster */}
                                <div className="movie-poster">
                                    <img
                                        src={ranking.movie.Poster !== 'N/A' ? ranking.movie.Poster : '/placeholder-movie.jpg'}
                                        alt={ranking.movie.Title}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMjI1QzE2Ni41IDIyNSAxODAgMjExLjUgMTgwIDE5NUMxODAgMTc4LjUgMTY2LjUgMTY1IDE1MCAxNjVDMTMzLjUgMTY1IDEyMCAxNzguNSAxMjAgMTk1QzEyMCAyMTEuNSAxMzMuNSAyMjUgMTUwIDIyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB4PSIxMDAiIHk9IjEyMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMTAwIDUwQzEwMCA3Ny42MTQgNzcuNjE0IDEwMCA1MCAxMDBDMjIuMzg2IDEwMCAwIDc3LjYxNCAwIDUwQzAgMjIuMzg2IDIyLjM4NiAwIDUwIDBDNzcuNjE0IDAgMTAwIDIyLjM4NiAxMDAgNTBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIvPgo8L3N2Zz4KPC9zdmc+';
                                        }}
                                    />
                                </div>

                                {/* Informações */}
                                <div className="movie-info">
                                    <div className="movie-header">
                                        <div>
                                            <h2 className="movie-title">
                                                #{ranking.ranking} - {ranking.movie.Title}
                                            </h2>
                                            <p className="movie-meta">
                                                {ranking.movie.Year} • {ranking.movie.Runtime} • {ranking.movie.Genre}
                                            </p>
                                            <p className="movie-director">
                                                Diretor: {ranking.movie.Director}
                                            </p>
                                        </div>
                                        
                                        {/* Score */}
                                        <div className="movie-score">
                                            <div className={`score-value ${getScoreClass(ranking.score)}`}>
                                                {formatScore(ranking.score)}%
                                            </div>
                                            <p className="score-label">Score Final</p>
                                        </div>
                                    </div>

                                    <p className="movie-plot">
                                        {ranking.movie.Plot}
                                    </p>

                                    {/* Critérios de Avaliação */}
                                    <div className="criteria-grid">
                                        <div className="criteria-item criteria-imdb">
                                            <div className="criteria-value">
                                                {ranking.movie.imdbRating}/10
                                            </div>
                                            <div className="criteria-label">IMDB Rating</div>
                                            <div className="criteria-percentage">
                                                {(ranking.criteria.imdbRating * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <div className="criteria-item criteria-votes">
                                            <div className="criteria-value">
                                                {ranking.movie.imdbVotes.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            </div>
                                            <div className="criteria-label">Votos</div>
                                            <div className="criteria-percentage">
                                                {(ranking.criteria.imdbVotes * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <div className="criteria-item criteria-year">
                                            <div className="criteria-value">
                                                {ranking.movie.Year}
                                            </div>
                                            <div className="criteria-label">Ano</div>
                                            <div className="criteria-percentage">
                                                {(ranking.criteria.year * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <div className="criteria-item criteria-runtime">
                                            <div className="criteria-value">
                                                {ranking.movie.Runtime}
                                            </div>
                                            <div className="criteria-label">Duração</div>
                                            <div className="criteria-percentage">
                                                {(ranking.criteria.runtime * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <div className="criteria-item criteria-boxoffice">
                                            <div className="criteria-value">
                                                {formatBoxOffice(ranking.movie.BoxOffice)}
                                            </div>
                                            <div className="criteria-label">Bilheteria</div>
                                            <div className="criteria-percentage">
                                                {(ranking.criteria.boxOffice * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Instruções */}
            {!data && !loading && (
                <div className="instructions-container">
                    <h3 className="instructions-title">Como Funciona o Algoritmo de Cascata?</h3>
                    <div className="instructions-list">
                        <p>• <strong>IMDB Rating (35%):</strong> Avaliação dos usuários do IMDB</p>
                        <p>• <strong>Número de Votos (25%):</strong> Popularidade e confiabilidade da avaliação</p>
                        <p>• <strong>Ano de Lançamento (15%):</strong> Relevância temporal com pequeno bônus para filmes recentes</p>
                        <p>• <strong>Duração (10%):</strong> Duração ideal entre 90-150 minutos</p>
                        <p>• <strong>Bilheteria (15%):</strong> Sucesso comercial usando normalização logarítmica</p>
                    </div>
                    <p className="instructions-footer">
                        Clique em um dos botões acima para começar!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Top10Movies;
