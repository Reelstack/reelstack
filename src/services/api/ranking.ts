import { OMDBService } from './omdb';
import type { 
    MovieRanking, 
    RankingCriteria, 
    TopMoviesResponse,
    OMDBMovieDetail 
} from './types';

export class RankingService {
    private omdbService: OMDBService;
    
    // Pesos para cada critério de avaliação (cascata)
    private readonly CRITERIA_WEIGHTS = {
        imdbRating: 0.35,    // 35% - Avaliação do IMDB
        imdbVotes: 0.25,     // 25% - Número de votos (popularidade)
        year: 0.15,          // 15% - Ano de lançamento (relevância temporal)
        runtime: 0.10,       // 10% - Duração do filme
        boxOffice: 0.15      // 15% - Bilheteria (sucesso comercial)
    };

    constructor() {
        this.omdbService = new OMDBService();
    }

    /**
     * Calcula o score de um filme baseado em múltiplos critérios
     * Implementa algoritmo de cascata com pesos normalizados
     */
    private calculateMovieScore(movie: OMDBMovieDetail): { score: number; criteria: RankingCriteria } {
        const criteria: RankingCriteria = {
            imdbRating: this.normalizeImdbRating(movie.imdbRating),
            imdbVotes: this.normalizeImdbVotes(movie.imdbVotes),
            year: this.normalizeYear(movie.Year),
            runtime: this.normalizeRuntime(movie.Runtime),
            boxOffice: this.normalizeBoxOffice(movie.BoxOffice)
        };

        // Aplicação da cascata de critérios
        let score = 0;
        score += criteria.imdbRating * this.CRITERIA_WEIGHTS.imdbRating;
        score += criteria.imdbVotes * this.CRITERIA_WEIGHTS.imdbVotes;
        score += criteria.year * this.CRITERIA_WEIGHTS.year;
        score += criteria.runtime * this.CRITERIA_WEIGHTS.runtime;
        score += criteria.boxOffice * this.CRITERIA_WEIGHTS.boxOffice;

        return { score, criteria };
    }

    /**
     * Normaliza a avaliação do IMDB (0-10) para 0-1
     */
    private normalizeImdbRating(rating: string): number {
        const numRating = parseFloat(rating);
        return isNaN(numRating) ? 0 : numRating / 10;
    }

    /**
     * Normaliza o número de votos do IMDB para 0-1
     * Usa logaritmo para suavizar a diferença entre filmes muito populares
     */
    private normalizeImdbVotes(votes: string): number {
        const numVotes = parseInt(votes.replace(/,/g, ''));
        if (isNaN(numVotes) || numVotes === 0) return 0;
        
        // Normalização logarítmica para suavizar diferenças extremas
        const maxVotes = 2000000; // Aproximadamente o máximo de votos no IMDB
        return Math.log(numVotes + 1) / Math.log(maxVotes + 1);
    }

    /**
     * Normaliza o ano de lançamento para 0-1
     * Filmes mais recentes recebem pontuação ligeiramente maior
     */
    private normalizeYear(year: string): number {
        const numYear = parseInt(year);
        if (isNaN(numYear)) return 0;
        
        const currentYear = new Date().getFullYear();
        const minYear = 1900;
        const maxYear = currentYear;
        
        // Normalização com pequeno bônus para filmes recentes
        const normalized = (numYear - minYear) / (maxYear - minYear);
        return Math.min(1, normalized * 1.1); // 10% de bônus para filmes recentes
    }

    /**
     * Normaliza a duração do filme para 0-1
     * Durações entre 90-150 minutos recebem pontuação máxima
     */
    private normalizeRuntime(runtime: string): number {
        const minutes = parseInt(runtime.replace(/\D/g, ''));
        if (isNaN(minutes)) return 0;
        
        // Duração ideal entre 90-150 minutos
        if (minutes >= 90 && minutes <= 150) return 1;
        
        // Penaliza durações muito curtas ou muito longas
        if (minutes < 90) {
            return minutes / 90;
        } else {
            return Math.max(0, 1 - (minutes - 150) / 60);
        }
    }

    /**
     * Normaliza a bilheteria para 0-1
     * Usa logaritmo para suavizar diferenças extremas
     */
    private normalizeBoxOffice(boxOffice: string): number {
        if (!boxOffice || boxOffice === 'N/A') return 0;
        
        // Remove caracteres não numéricos e converte para número
        const amount = parseFloat(boxOffice.replace(/[^\d.]/g, ''));
        if (isNaN(amount)) return 0;
        
        // Converte para milhões de dólares
        let millions = amount;
        if (boxOffice.includes('M')) {
            millions = amount;
        } else if (boxOffice.includes('B')) {
            millions = amount * 1000;
        } else if (boxOffice.includes('K')) {
            millions = amount / 1000;
        }
        
        // Normalização logarítmica
        const maxBoxOffice = 3000; // Aproximadamente 3 bilhões (Avatar)
        return Math.log(millions + 1) / Math.log(maxBoxOffice + 1);
    }

    /**
     * Obtém o top 10 filmes baseado em uma lista de títulos
     * Implementa algoritmo de cascata para ranking
     */
    async getTop10Movies(movieTitles: string[]): Promise<TopMoviesResponse> {
        try {
            const movieDetails: OMDBMovieDetail[] = [];
            
            // Busca detalhes de cada filme
            for (const title of movieTitles) {
                try {
                    const movie = await this.omdbService.getMovieByTitle(title);
                    if (movie.Response !== 'False') {
                        movieDetails.push(movie);
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar filme "${title}":`, error);
                }
            }

            // Calcula scores e aplica algoritmo de cascata
            const rankings: MovieRanking[] = movieDetails.map(movie => {
                const { score, criteria } = this.calculateMovieScore(movie);
                return {
                    movie,
                    score,
                    ranking: 0, // Será definido após ordenação
                    criteria
                };
            });

            // Ordena por score (maior para menor)
            rankings.sort((a, b) => b.score - a.score);

            // Aplica ranking final e limita ao top 10
            const top10 = rankings.slice(0, 10).map((ranking, index) => ({
                ...ranking,
                ranking: index + 1
            }));

            return {
                movies: top10,
                totalCount: top10.length,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Erro ao calcular top 10 filmes: ${error}`);
        }
    }

    /**
     * Obtém o top 10 filmes de um gênero específico
     */
    async getTop10ByGenre(genre: string): Promise<TopMoviesResponse> {
        // Lista de filmes populares por gênero (pode ser expandida)
        const genreMovies: Record<string, string[]> = {
            'action': [
                'The Dark Knight', 'Mad Max: Fury Road', 'John Wick', 'Mission: Impossible',
                'Die Hard', 'Terminator 2', 'Raiders of the Lost Ark', 'The Matrix',
                'Gladiator', 'Top Gun: Maverick', 'Black Panther', 'Avengers: Endgame'
            ],
            'drama': [
                'The Shawshank Redemption', 'The Godfather', 'Forrest Gump', 'Pulp Fiction',
                'Fight Club', 'Goodfellas', 'The Silence of the Lambs', 'Schindler\'s List',
                'The Green Mile', 'American Beauty', 'The Departed', '12 Years a Slave'
            ],
            'comedy': [
                'The Grand Budapest Hotel', 'Superbad', 'Bridesmaids', 'The Hangover',
                'Shaun of the Dead', 'Hot Fuzz', 'The Big Lebowski', 'Groundhog Day',
                'When Harry Met Sally', 'The Princess Bride', 'Monty Python and the Holy Grail'
            ],
            'sci-fi': [
                'Interstellar', 'Inception', 'The Matrix', 'Blade Runner', '2001: A Space Odyssey',
                'Alien', 'The Terminator', 'Back to the Future', 'E.T.', 'Close Encounters'
            ]
        };

        const movies = genreMovies[genre.toLowerCase()] || genreMovies['drama'];
        return this.getTop10Movies(movies);
    }

    /**
     * Obtém o top 10 filmes de todos os tempos (lista pré-definida)
     */
    async getTop10AllTime(): Promise<TopMoviesResponse> {
        const allTimeClassics = [
            'The Shawshank Redemption', 'The Godfather', 'The Dark Knight',
            'The Godfather Part II', '12 Angry Men', 'Schindler\'s List',
            'The Lord of the Rings: The Return of the King', 'Pulp Fiction',
            'The Good, the Bad and the Ugly', 'Fight Club', 'Forrest Gump',
            'Inception', 'The Lord of the Rings: The Fellowship of the Ring',
            'Star Wars: Episode V - The Empire Strikes Back', 'Goodfellas'
        ];

        return this.getTop10Movies(allTimeClassics);
    }
}

export default RankingService;
