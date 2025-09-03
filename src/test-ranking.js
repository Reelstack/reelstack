/**
 * Teste simples do algoritmo de cascata
 * Execute este arquivo para ver o algoritmo funcionando
 */

// Simulação de dados de filmes para teste
const mockMovies = [
    {
        Title: "The Shawshank Redemption",
        Year: "1994",
        imdbRating: "9.3",
        imdbVotes: "2500000",
        Runtime: "142 min",
        BoxOffice: "58.3M"
    },
    {
        Title: "The Godfather",
        Year: "1972",
        imdbRating: "9.2",
        imdbVotes: "1800000",
        Runtime: "175 min",
        BoxOffice: "245.1M"
    },
    {
        Title: "Pulp Fiction",
        Year: "1994",
        imdbRating: "8.9",
        imdbVotes: "2000000",
        Runtime: "154 min",
        BoxOffice: "213.9M"
    }
];

// Implementação simplificada do algoritmo de cascata
class SimpleRankingAlgorithm {
    constructor() {
        this.weights = {
            imdbRating: 0.35,
            imdbVotes: 0.25,
            year: 0.15,
            runtime: 0.10,
            boxOffice: 0.15
        };
    }

    normalizeImdbRating(rating) {
        return parseFloat(rating) / 10;
    }

    normalizeImdbVotes(votes) {
        const numVotes = parseInt(votes.replace(/,/g, ''));
        const maxVotes = 2000000;
        return Math.log(numVotes + 1) / Math.log(maxVotes + 1);
    }

    normalizeYear(year) {
        const numYear = parseInt(year);
        const currentYear = 2024;
        const minYear = 1900;
        const normalized = (numYear - minYear) / (currentYear - minYear);
        return Math.min(1, normalized * 1.1);
    }

    normalizeRuntime(runtime) {
        const minutes = parseInt(runtime.replace(/\D/g, ''));
        if (minutes >= 90 && minutes <= 150) return 1;
        if (minutes < 90) return minutes / 90;
        return Math.max(0, 1 - (minutes - 150) / 60);
    }

    normalizeBoxOffice(boxOffice) {
        if (!boxOffice || boxOffice === 'N/A') return 0;
        const amount = parseFloat(boxOffice.replace(/[^\d.]/g, ''));
        let millions = amount;
        if (boxOffice.includes('B')) millions = amount * 1000;
        if (boxOffice.includes('K')) millions = amount / 1000;
        
        const maxBoxOffice = 3000;
        return Math.log(millions + 1) / Math.log(maxBoxOffice + 1);
    }

    calculateScore(movie) {
        const criteria = {
            imdbRating: this.normalizeImdbRating(movie.imdbRating),
            imdbVotes: this.normalizeImdbVotes(movie.imdbVotes),
            year: this.normalizeYear(movie.Year),
            runtime: this.normalizeRuntime(movie.Runtime),
            boxOffice: this.normalizeBoxOffice(movie.BoxOffice)
        };

        let score = 0;
        score += criteria.imdbRating * this.weights.imdbRating;
        score += criteria.imdbVotes * this.weights.imdbVotes;
        score += criteria.year * this.weights.year;
        score += criteria.runtime * this.weights.runtime;
        score += criteria.boxOffice * this.weights.boxOffice;

        return { score, criteria };
    }

    rankMovies(movies) {
        const rankings = movies.map(movie => {
            const { score, criteria } = this.calculateScore(movie);
            return { movie, score, criteria };
        });

        rankings.sort((a, b) => b.score - a.score);
        
        return rankings.map((ranking, index) => ({
            ...ranking,
            ranking: index + 1
        }));
    }
}

// Função principal de teste
function testarAlgoritmoCascata() {
    console.log('🎬 TESTE DO ALGORITMO DE CASCATA\n');
    
    const algorithm = new SimpleRankingAlgorithm();
    const rankings = algorithm.rankMovies(mockMovies);
    
    console.log('📊 RESULTADOS DO RANKING:\n');
    
    rankings.forEach(ranking => {
        const movie = ranking.movie;
        console.log(`🏆 #${ranking.ranking} - ${movie.Title} (${movie.Year})`);
        console.log(`   Score Final: ${(ranking.score * 100).toFixed(1)}%`);
        console.log('');
        console.log('   Critérios normalizados:');
        console.log(`   • IMDB Rating (35%): ${movie.imdbRating}/10 → ${(ranking.criteria.imdbRating * 100).toFixed(1)}%`);
        console.log(`   • Votos (25%): ${movie.imdbVotes} → ${(ranking.criteria.imdbVotes * 100).toFixed(1)}%`);
        console.log(`   • Ano (15%): ${movie.Year} → ${(ranking.criteria.year * 100).toFixed(1)}%`);
        console.log(`   • Duração (10%): ${movie.Runtime} → ${(ranking.criteria.runtime * 100).toFixed(1)}%`);
        console.log(`   • Bilheteria (15%): ${movie.BoxOffice} → ${(ranking.criteria.boxOffice * 100).toFixed(1)}%`);
        console.log('');
        
        // Cálculo manual para verificação
        const manualScore = (
            ranking.criteria.imdbRating * 0.35 +
            ranking.criteria.imdbVotes * 0.25 +
            ranking.criteria.year * 0.15 +
            ranking.criteria.runtime * 0.10 +
            ranking.criteria.boxOffice * 0.15
        );
        
        console.log(`   ✅ Verificação: ${(manualScore * 100).toFixed(1)}%`);
        console.log('   ' + '─'.repeat(50));
        console.log('');
    });
    
    console.log('🎯 EXPLICAÇÃO DO ALGORITMO:');
    console.log('O algoritmo de cascata funciona em 3 etapas:');
    console.log('1. Normaliza cada critério para escala 0-1');
    console.log('2. Aplica pesos específicos a cada critério');
    console.log('3. Soma ponderada para obter o score final');
    console.log('');
    console.log('📈 VANTAGENS:');
    console.log('• Balanceia múltiplos critérios de qualidade');
    console.log('• Evita que um critério domine o ranking');
    console.log('• Usa normalização científica para dados diferentes');
    console.log('• Pesos configuráveis conforme necessidade');
}

// Executa o teste se o arquivo for executado diretamente
if (typeof window === 'undefined') {
    testarAlgoritmoCascata();
}

// Exporta para uso em outros módulos
export { SimpleRankingAlgorithm, testarAlgoritmoCascata };
