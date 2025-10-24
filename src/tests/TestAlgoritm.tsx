import { recommendMovies } from '../services/api/recommendations/prototypeRecommender';

/**
 * teste rápido de recomendações
 * abre o log do browser e vê se foi ou bombou
 */
export async function testUserRecommendations() {
  // colocar um id de usuario valido
  const testUserId = 'e5638353-03ed-4af4-b962-999b0ea88f79';

  console.log(`Generating movie recommendations for user: ${testUserId}...`);

  try {
    const recommendations = await recommendMovies(testUserId, 10);

    if (!recommendations || recommendations.length === 0) {
      console.log('No recommendations found for this user.');
      return;
    }

    console.log(`Top ${recommendations.length} recommended movies:`);
    recommendations.forEach((movie, index) => {
      console.log(
        `${index + 1}. ${movie.title} (similarity: ${movie.similarity.toFixed(3)})`,
      );
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}
