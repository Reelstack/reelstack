import { fetchUserMovies } from '../services/api/recommendations/prototypeRecommender';

// Definição do tipo para o retorno do log
type MovieRecommendation = {
  title: string;
  director: string | null;
  similarity: number;
};

// Cria e roda a lógica de recomendação via Web Worker
async function runWorkerRecommendation(profileId: string, limit: number) {
  // Fazer o fetch do Supabase no Thread Principal
  console.log('Fetching user interactions from Supabase...');
  const likedMovies = await fetchUserMovies(profileId, 'like');
  const dislikedMovies = await fetchUserMovies(profileId, 'dislike');
  console.log(
    `Fetched ${likedMovies.length} likes and ${dislikedMovies.length} dislikes.`,
  );
  console.log('📽️ Filmes curtidos pelo usuário:');
  likedMovies.slice(0, 10).forEach(m => {
    console.log(`  - ${m.title} (${m.director})`);
  });
  console.log('📽️ Filmes curtidos pelo usuário:');
  dislikedMovies.slice(0, 10).forEach(m => {
    console.log(`  - ${m.title} (${m.director})`);
  });

  // Cria a instância do Worker.
  const recommenderWorker = new Worker(
    new URL(
      '../services/api/recommendations/recommender.worker.ts',
      import.meta.url,
    ),
    { type: 'module' },
  );

  console.log(
    `Sending recommendation task to worker for user: ${profileId}...`,
  );
  console.log(
    `A UI permanecerá responsiva enquanto o cálculo (aprox. 10s) é executado em segundo plano.`,
  );

  // Ouve a resposta do Worker
  recommenderWorker.onmessage = (event: MessageEvent) => {
    const { status, recommendations, message } = event.data;

    if (status === 'success') {
      const top10 = recommendations as MovieRecommendation[];
      console.log('✅ Worker task finished. Top recommended movies:');

      if (top10.length === 0) {
        console.log('No recommendations found.');
      } else {
        top10.forEach((m, index) => {
          console.log(
            `${index + 1}. ${m.title}, ${m.director} (similarity: ${m.similarity?.toFixed(3) ?? 'N/A'})`,
          );
        });
      }
    } else if (status === 'error') {
      console.error('Worker failed:', message);
    }

    // Termina o worker após o uso(pra n fuder o usuario)
    recommenderWorker.terminate();
  };

  console.log('Sample likedMovie:', likedMovies[0]);
  console.log('Sample dislikedMovie:', dislikedMovies[0]);
  // envia a tarefa e os dados de interação para o Worker
  recommenderWorker.postMessage({
    profileId,
    limit,
    likedMovies,
    dislikedMovies,
  });
}

/**
 * Teste principal: Inicia a execução da recomendação no Web Worker.
 */
export async function testUserRecommendations() {
  // Coloque um id de usuário válido
  const testUserId = 'e3a29547-1e55-4d07-8f7d-c75a6ff8b896';

  // //TESTE DIRETO SEM WORKER
  // console.log('Testando SEM worker...');
  // const recommendations = await recommendMovies(testUserId, 10);
  // console.log('✅ Top 10 SEM WORKER:');
  // recommendations.slice(0, 10).forEach((m, i) => {
  //   if (m) {
  //     console.log(
  //       `${i + 1}. ${m.title} (similarity: ${m.similarity?.toFixed(3)})`,
  //     );
  //   }
  // });

  // O await é necessário porque runWorkerRecommendation é assíncrono
  await runWorkerRecommendation(testUserId, 10);
}
