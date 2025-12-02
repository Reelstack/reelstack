import { fetchUserMovies } from '../recommendations/prototypeRecommender';

export type MovieRecommendation = {
  title: string;
  director: string | null;
  similarity: number;
};

export async function fetchRecommendationsViaWorker(
  profileId: string,
  limit: number,
): Promise<MovieRecommendation[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const likedMovies = await fetchUserMovies(profileId, 'like');
      const dislikedMovies = await fetchUserMovies(profileId, 'dislike');

      const worker = new Worker(
        new URL('./recommender.worker?worker', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = e => {
        const { status, recommendations, message } = e.data;

        if (status === 'success') {
          worker.terminate();
          resolve(recommendations || []);
        } else {
          worker.terminate();
          reject(message || 'Worker failed');
        }
      };

      worker.postMessage({
        profileId,
        limit,
        likedMovies,
        dislikedMovies,
      });
    } catch (err) {
      reject(err);
    }
  });
}
