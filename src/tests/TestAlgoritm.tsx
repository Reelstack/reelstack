import { recommendMovies } from '../services/api/recommendations/prototypeRecommender';

/**
 * teste rápido de recomendações
 * abre o log do browser e vê se foi ou bombou
 */
export async function testUserRecommendations() {
  // colocar um id de usuario valido
  const testUserId = '0e2c681a-5599-43b7-a954-65a0abcad305';

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
        `${index + 1}. ${movie.title}, ${movie.director} (similarity: ${movie.similarity.toFixed(3)})`,
      );
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}
