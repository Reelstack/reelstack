import { recommendMovies } from './prototypeRecommender';

// O Worker recebe dados do thread principal e envia a resposta de volta.
self.onmessage = async (event: MessageEvent) => {
  // Dados passados do thread principal
  const { profileId, limit } = event.data;

  try {
    console.time('Recommendation Worker Task');

    // Executa a função pesada (filme pra krl)
    const recommendations = await recommendMovies(profileId, limit);

    console.timeEnd('Recommendation Worker Task');

    // Envia o resultado de volta para o thread principal
    self.postMessage({ status: 'success', recommendations });
  } catch (error) {
    console.error('Worker error during recommendation:', error);
    self.postMessage({
      status: 'error',
      message: 'Failed to generate recommendations.',
    });
  }
};
