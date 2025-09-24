import React, { useState } from 'react';
import { useRanking } from '../../hooks/useRanking';
import type { MovieRanking } from '../../services/api/types';
import styles from './styles.module.css';

const Top10Movies: React.FC = () => {
  const {
    data,
    loading,
    error,
    getTop10AllTime,
    getTop10ByGenre,
    getTop10ByCustomList,
  } = useRanking();
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

  const formatScore = (score: number) => (score * 100).toFixed(1);
  const formatBoxOffice = (b: string) => (!b || b === 'N/A' ? 'N/A' : b);
  const getScoreClass = (s: number) =>
    s >= 0.8
      ? styles.scoreExcellent
      : s >= 0.6
        ? styles.scoreGood
        : styles.scorePoor;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎬 Top 10 Filmes - Algoritmo de Cascata</h1>

      {/* Controles */}
      <div className={styles.controlsContainer}>
        <button
          onClick={getTop10AllTime}
          disabled={loading}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          {loading ? 'Carregando...' : 'Top 10 de Todos os Tempos'}
        </button>

        <select
          value={selectedGenre}
          onChange={e => setSelectedGenre(e.target.value)}
          className={styles.genreSelect}
        >
          <option value='drama'>Drama</option>
          <option value='action'>Ação</option>
          <option value='comedy'>Comédia</option>
          <option value='sci-fi'>Ficção Científica</option>
        </select>

        <button
          onClick={() => getTop10ByGenre(selectedGenre)}
          disabled={loading}
          className={`${styles.btn} ${styles.btnSuccess}`}
        >
          {loading
            ? 'Carregando...'
            : `Top 10 ${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}`}
        </button>
      </div>

      {/* Lista Customizada */}
      <div className={styles.customListContainer}>
        <h3 className={styles.customListTitle}>Lista Personalizada</h3>
        <div className={styles.customListContent}>
          <textarea
            value={customMovies}
            onChange={e => setCustomMovies(e.target.value)}
            placeholder='Digite um filme por linha...'
            className={styles.customListTextarea}
            rows={4}
          />
          <button
            onClick={handleCustomList}
            disabled={loading || !customMovies.trim()}
            className={`${styles.btn} ${styles.btnPurple} ${styles.customListBtn}`}
          >
            {loading ? 'Carregando...' : 'Calcular Top 10'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>
            Calculando ranking com algoritmo de cascata...
          </p>
        </div>
      )}

      {data && data.movies.length > 0 && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsUpdate}>
              Última atualização:{' '}
              {new Date(data.lastUpdated).toLocaleString('pt-BR')}
            </p>
            <p className={styles.resultsSuccess}>
              Algoritmo de cascata aplicado com sucesso!
            </p>
          </div>

          {data.movies.map((ranking: MovieRanking) => (
            <div key={ranking.movie.imdbID} className={styles.movieCard}>
              <div className={styles.movieContent}>
                <div className={styles.moviePoster}>
                  <img
                    src={
                      ranking.movie.Poster !== 'N/A'
                        ? ranking.movie.Poster
                        : '/placeholder-movie.jpg'
                    }
                    alt={ranking.movie.Title}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        '/placeholder-movie.jpg';
                    }}
                  />
                </div>

                <div className={styles.movieInfo}>
                  <div className={styles.movieHeader}>
                    <div>
                      <h2 className={styles.movieTitle}>
                        #{ranking.ranking} - {ranking.movie.Title}
                      </h2>
                      <p className={styles.movieMeta}>
                        {ranking.movie.Year} • {ranking.movie.Runtime} •{' '}
                        {ranking.movie.Genre}
                      </p>
                      <p className={styles.movieDirector}>
                        Diretor: {ranking.movie.Director}
                      </p>
                    </div>

                    <div className={styles.movieScore}>
                      <div
                        className={`${styles.scoreValue} ${getScoreClass(ranking.score)}`}
                      >
                        {formatScore(ranking.score)}%
                      </div>
                      <p className={styles.scoreLabel}>Score Final</p>
                    </div>
                  </div>

                  <p className={styles.moviePlot}>{ranking.movie.Plot}</p>

                  <div className={styles.criteriaGrid}>
                    <div
                      className={`${styles.criteriaItem} ${styles.criteriaImdb}`}
                    >
                      <div className={styles.criteriaValue}>
                        {ranking.movie.imdbRating}/10
                      </div>
                      <div className={styles.criteriaLabel}>IMDB Rating</div>
                      <div className={styles.criteriaPercentage}>
                        {(ranking.criteria.imdbRating * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      className={`${styles.criteriaItem} ${styles.criteriaVotes}`}
                    >
                      <div className={styles.criteriaValue}>
                        {ranking.movie.imdbVotes.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ',',
                        )}
                      </div>
                      <div className={styles.criteriaLabel}>Votos</div>
                      <div className={styles.criteriaPercentage}>
                        {(ranking.criteria.imdbVotes * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      className={`${styles.criteriaItem} ${styles.criteriaYear}`}
                    >
                      <div className={styles.criteriaValue}>
                        {ranking.movie.Year}
                      </div>
                      <div className={styles.criteriaLabel}>Ano</div>
                      <div className={styles.criteriaPercentage}>
                        {(ranking.criteria.year * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      className={`${styles.criteriaItem} ${styles.criteriaRuntime}`}
                    >
                      <div className={styles.criteriaValue}>
                        {ranking.movie.Runtime}
                      </div>
                      <div className={styles.criteriaLabel}>Duração</div>
                      <div className={styles.criteriaPercentage}>
                        {(ranking.criteria.runtime * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      className={`${styles.criteriaItem} ${styles.criteriaBoxoffice}`}
                    >
                      <div className={styles.criteriaValue}>
                        {formatBoxOffice(ranking.movie.BoxOffice)}
                      </div>
                      <div className={styles.criteriaLabel}>Bilheteria</div>
                      <div className={styles.criteriaPercentage}>
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

      {!data && !loading && (
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionsTitle}>
            Como Funciona o Algoritmo de Cascata?
          </h3>
          <div className={styles.instructionsList}>
            <p>
              • <strong>IMDB Rating (35%):</strong> Avaliação dos usuários do
              IMDB
            </p>
            <p>
              • <strong>Número de Votos (25%):</strong> Popularidade e
              confiabilidade
            </p>
            <p>
              • <strong>Ano de Lançamento (15%):</strong> Relevância temporal
            </p>
            <p>
              • <strong>Duração (10%):</strong> Ideal entre 90-150 minutos
            </p>
            <p>
              • <strong>Bilheteria (15%):</strong> Sucesso comercial
            </p>
          </div>
          <p className={styles.instructionsFooter}>
            Clique em um dos botões acima para começar!
          </p>
        </div>
      )}
    </div>
  );
};

export default Top10Movies;
