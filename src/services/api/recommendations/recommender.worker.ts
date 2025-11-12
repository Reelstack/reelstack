import { recommendMovies } from './prototypeRecommender';

self.onmessage = async (event: MessageEvent) => {
  const { profileId, limit, likedMovies, dislikedMovies } = event.data;
  console.log('Worker received likedMovies:', likedMovies?.length);
  console.log('Worker sample liked:', likedMovies?.[0]);
  try {
    console.time('Recommendation Worker Task');

    // Passa os dados já buscados
    const recommendations = await recommendMovies(
      profileId,
      limit,
      likedMovies,
      dislikedMovies,
    );

    console.timeEnd('Recommendation Worker Task');
    self.postMessage({ status: 'success', recommendations });
  } catch (error) {
    console.error('Worker error during recommendation:', error);
    self.postMessage({
      status: 'error',
      message: 'Failed to generate recommendations.',
    });
  }
};
