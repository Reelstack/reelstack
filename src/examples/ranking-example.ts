import { RankingService } from '../services/api/ranking';

/**
 * Exemplo de uso do algoritmo de cascata para ranking de filmes
 * 
 * Este exemplo demonstra como o RankingService implementa um sistema
 * de pontuação baseado em múltiplos critérios com pesos normalizados.
 */

async function exemploRanking() {
    console.log('🎬 Iniciando exemplo do algoritmo de cascata...\n');
    
    const rankingService = new RankingService();
    
    try {
        // Exemplo 1: Top 10 filmes de todos os tempos
        console.log('📊 Calculando Top 10 de todos os tempos...');
        const top10AllTime = await rankingService.getTop10AllTime();
        
        console.log(`✅ Encontrados ${top10AllTime.totalCount} filmes`);
        console.log(`🕒 Última atualização: ${top10AllTime.lastUpdated}\n`);
        
        // Exibe os 3 primeiros filmes como exemplo
        top10AllTime.movies.slice(0, 3).forEach((ranking, index) => {
            const movie = ranking.movie;
            console.log(`🏆 #${ranking.ranking} - ${movie.Title} (${movie.Year})`);
            console.log(`   Score: ${(ranking.score * 100).toFixed(1)}%`);
            console.log(`   IMDB: ${movie.imdbRating}/10 (${(ranking.criteria.imdbRating * 100).toFixed(1)}%)`);
            console.log(`   Votos: ${movie.imdbVotes.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} (${(ranking.criteria.imdbVotes * 100).toFixed(1)}%)`);
            console.log(`   Ano: ${movie.Year} (${(ranking.criteria.year * 100).toFixed(1)}%)`);
            console.log(`   Duração: ${movie.Runtime} (${(ranking.criteria.runtime * 100).toFixed(1)}%)`);
            console.log(`   Bilheteria: ${movie.BoxOffice} (${(ranking.criteria.boxOffice * 100).toFixed(1)}%)`);
            console.log('');
        });
        
        // Exemplo 2: Top 10 por gênero
        console.log('🎭 Calculando Top 10 de filmes de ação...');
        const top10Action = await rankingService.getTop10ByGenre('action');
        
        console.log(`✅ Encontrados ${top10Action.totalCount} filmes de ação`);
        console.log(`🏆 Melhor filme de ação: ${top10Action.movies[0].movie.Title} (Score: ${(top10Action.movies[0].score * 100).toFixed(1)}%)\n`);
        
        // Exemplo 3: Lista customizada
        console.log('📝 Calculando ranking de lista customizada...');
        const customMovies = [
            'The Shawshank Redemption',
            'The Godfather',
            'Pulp Fiction',
            'Fight Club',
            'Inception'
        ];
        
        const customRanking = await rankingService.getTop10Movies(customMovies);
        console.log(`✅ Ranking calculado para ${customRanking.totalCount} filmes customizados`);
        console.log(`🏆 Melhor da lista: ${customRanking.movies[0].movie.Title} (Score: ${(customRanking.movies[0].score * 100).toFixed(1)}%)\n`);
        
        // Exemplo 4: Análise detalhada de um filme
        console.log('🔍 Análise detalhada do melhor filme...');
        const bestMovie = top10AllTime.movies[0];
        console.log(`📊 ${bestMovie.movie.Title} - Análise completa:`);
        console.log(`   Score Final: ${(bestMovie.score * 100).toFixed(1)}%`);
        console.log('');
        console.log('   Critérios individuais:');
        console.log(`   • IMDB Rating (35%): ${bestMovie.movie.imdbRating}/10 → ${(bestMovie.criteria.imdbRating * 100).toFixed(1)}%`);
        console.log(`   • Número de Votos (25%): ${bestMovie.movie.imdbVotes.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} → ${(bestMovie.criteria.imdbVotes * 100).toFixed(1)}%`);
        console.log(`   • Ano de Lançamento (15%): ${bestMovie.movie.Year} → ${(bestMovie.criteria.year * 100).toFixed(1)}%`);
        console.log(`   • Duração (10%): ${bestMovie.movie.Runtime} → ${(bestMovie.criteria.runtime * 100).toFixed(1)}%`);
        console.log(`   • Bilheteria (15%): ${bestMovie.movie.BoxOffice} → ${(bestMovie.criteria.boxOffice * 100).toFixed(1)}%`);
        console.log('');
        
        // Cálculo manual para verificação
        const manualScore = (
            bestMovie.criteria.imdbRating * 0.35 +
            bestMovie.criteria.imdbVotes * 0.25 +
            bestMovie.criteria.year * 0.15 +
            bestMovie.criteria.runtime * 0.10 +
            bestMovie.criteria.boxOffice * 0.15
        );
        
        console.log(`   Cálculo manual: ${(manualScore * 100).toFixed(1)}%`);
        console.log(`   Score do algoritmo: ${(bestMovie.score * 100).toFixed(1)}%`);
        console.log(`   ✅ Diferença: ${Math.abs(manualScore - bestMovie.score) < 0.001 ? 'Correto' : 'Incorreto'}`);
        
    } catch (error) {
        console.error('❌ Erro durante o exemplo:', error);
    }
}

/**
 * Exemplo de como o algoritmo de cascata funciona internamente
 */
function explicarAlgoritmoCascata() {
    console.log('\n🧠 EXPLICAÇÃO DO ALGORITMO DE CASCATA\n');
    console.log('O algoritmo de cascata funciona em 3 etapas principais:\n');
    
    console.log('1️⃣ NORMALIZAÇÃO DOS CRITÉRIOS:');
    console.log('   • IMDB Rating: 0-10 → 0-1 (divisão por 10)');
    console.log('   • Votos: 0-2M → 0-1 (normalização logarítmica)');
    console.log('   • Ano: 1900-2024 → 0-1 (com bônus para filmes recentes)');
    console.log('   • Duração: 0-∞ → 0-1 (ideal: 90-150 min)');
    console.log('   • Bilheteria: 0-3B → 0-1 (normalização logarítmica)\n');
    
    console.log('2️⃣ APLICAÇÃO DOS PESOS:');
    console.log('   • IMDB Rating: 35% (mais importante)');
    console.log('   • Número de Votos: 25% (popularidade)');
    console.log('   • Ano: 15% (relevância temporal)');
    console.log('   • Duração: 10% (qualidade narrativa)');
    console.log('   • Bilheteria: 15% (sucesso comercial)\n');
    
    console.log('3️⃣ CÁLCULO DO SCORE FINAL:');
    console.log('   Score = Σ(Critério × Peso)');
    console.log('   Exemplo: (0.9 × 0.35) + (0.8 × 0.25) + (0.7 × 0.15) + (0.9 × 0.10) + (0.6 × 0.15) = 0.815\n');
    
    console.log('🎯 VANTAGENS DO ALGORITMO:');
    console.log('   • Balanceia múltiplos critérios de qualidade');
    console.log('   • Evita que um único critério domine o ranking');
    console.log('   • Usa normalização para comparar valores diferentes');
    console.log('   • Permite ajuste fino dos pesos conforme necessidade');
}

// Executa os exemplos se o arquivo for executado diretamente
if (typeof window === 'undefined') {
    // Ambiente Node.js
    exemploRanking().then(() => {
        explicarAlgoritmoCascata();
    });
}

export { exemploRanking, explicarAlgoritmoCascata };
