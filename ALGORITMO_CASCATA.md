# 🎬 Algoritmo de Cascata para Top 10 Filmes

Este projeto implementa um algoritmo de cascata sofisticado para elencar os melhores filmes baseado em múltiplos critérios de avaliação.

## 🧠 Como Funciona o Algoritmo

### 1. **Sistema de Critérios em Cascata**

O algoritmo utiliza 5 critérios principais, cada um com um peso específico:

| Critério | Peso | Descrição |
|----------|------|-----------|
| **IMDB Rating** | 35% | Avaliação dos usuários do IMDB (0-10) |
| **Número de Votos** | 25% | Popularidade e confiabilidade da avaliação |
| **Ano de Lançamento** | 15% | Relevância temporal com bônus para filmes recentes |
| **Duração** | 10% | Duração ideal entre 90-150 minutos |
| **Bilheteria** | 15% | Sucesso comercial usando normalização logarítmica |

### 2. **Processo de Normalização**

Cada critério é normalizado para uma escala de 0-1:

- **IMDB Rating**: Divisão simples por 10
- **Votos**: Normalização logarítmica para suavizar diferenças extremas
- **Ano**: Normalização linear com 10% de bônus para filmes recentes
- **Duração**: Penalização para durações muito curtas ou longas
- **Bilheteria**: Normalização logarítmica para valores monetários

### 3. **Cálculo do Score Final**

```
Score = (IMDB × 0.35) + (Votos × 0.25) + (Ano × 0.15) + (Duração × 0.10) + (Bilheteria × 0.15)
```

## 🚀 Como Usar

### 1. **Importar o Serviço**

```typescript
import { RankingService } from './src/services/api/ranking';

const rankingService = new RankingService();
```

### 2. **Top 10 de Todos os Tempos**

```typescript
const top10 = await rankingService.getTop10AllTime();
console.log(`Melhor filme: ${top10.movies[0].movie.Title}`);
console.log(`Score: ${(top10.movies[0].score * 100).toFixed(1)}%`);
```

### 3. **Top 10 por Gênero**

```typescript
const top10Action = await rankingService.getTop10ByGenre('action');
const top10Drama = await rankingService.getTop10ByGenre('drama');
const top10Comedy = await rankingService.getTop10ByGenre('comedy');
```

### 4. **Lista Personalizada**

```typescript
const customMovies = [
    'The Shawshank Redemption',
    'The Godfather',
    'Pulp Fiction',
    'Fight Club',
    'Inception'
];

const ranking = await rankingService.getTop10Movies(customMovies);
```

### 5. **Hook React**

```typescript
import { useRanking } from './src/hooks/useRanking';

const { data, loading, error, getTop10AllTime } = useRanking();

useEffect(() => {
    getTop10AllTime();
}, []);
```

## 🎯 Vantagens do Algoritmo

### ✅ **Balanceamento Inteligente**
- Evita que um único critério domine o ranking
- Considera múltiplas dimensões de qualidade
- Pesos configuráveis conforme necessidade

### ✅ **Normalização Científica**
- Usa logaritmos para dados com distribuição exponencial
- Trata adequadamente outliers e valores extremos
- Mantém comparações justas entre diferentes escalas

### ✅ **Flexibilidade**
- Fácil ajuste dos pesos dos critérios
- Suporte a diferentes categorias de filmes
- Extensível para novos critérios

## 🔧 Configuração dos Pesos

Os pesos podem ser facilmente ajustados no `RankingService`:

```typescript
private readonly CRITERIA_WEIGHTS = {
    imdbRating: 0.35,    // 35% - Avaliação do IMDB
    imdbVotes: 0.25,     // 25% - Número de votos
    year: 0.15,          // 15% - Ano de lançamento
    runtime: 0.10,       // 10% - Duração do filme
    boxOffice: 0.15      // 15% - Bilheteria
};
```

## 📊 Exemplo de Resultado

```
🏆 #1 - The Shawshank Redemption (1994)
   Score: 89.2%
   IMDB: 9.3/10 (93.0%)
   Votos: 2,500,000 (100.0%)
   Ano: 1994 (85.0%)
   Duração: 142 min (100.0%)
   Bilheteria: $58.3M (45.0%)
```

## 🎨 Interface Visual

O componente `Top10Movies` oferece uma interface completa com:

- **Controles de navegação** para diferentes categorias
- **Lista personalizada** para filmes específicos
- **Exibição detalhada** de cada critério
- **Visualização responsiva** para diferentes dispositivos
- **Indicadores visuais** de qualidade (cores por score)

## 🧪 Testando o Algoritmo

Execute o arquivo de exemplo para ver o algoritmo em ação:

```typescript
import { exemploRanking } from './src/examples/ranking-example';

// Executa exemplos completos
exemploRanking();
```

## 🔍 Análise Técnica

### **Complexidade**
- **Tempo**: O(n × m) onde n = número de filmes, m = número de critérios
- **Espaço**: O(n) para armazenar os rankings

### **Precisão**
- Normalização logarítmica para dados com distribuição exponencial
- Tratamento especial para valores ausentes (N/A)
- Validação de dados antes do processamento

### **Extensibilidade**
- Fácil adição de novos critérios
- Sistema de pesos configurável
- Suporte a diferentes APIs de filmes

## 🌟 Casos de Uso

1. **Recomendação de filmes** para usuários
2. **Análise de tendências** cinematográficas
3. **Comparação de filmes** por diferentes métricas
4. **Ranking personalizado** baseado em preferências
5. **Análise de mercado** para produtores

## 📝 Notas de Implementação

- O algoritmo é **determinístico** - mesmos dados sempre produzem mesmo resultado
- **Thread-safe** para uso em aplicações concorrentes
- **Cache-friendly** para melhor performance
- **Error handling** robusto para dados inconsistentes

---

*Desenvolvido com ❤️ para entusiastas de cinema e desenvolvedores que apreciam algoritmos elegantes.*
