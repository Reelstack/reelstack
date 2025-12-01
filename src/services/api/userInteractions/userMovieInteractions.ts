import { supabase } from '../../../lib/supabaseClient';

export async function registerSwipeInteraction(
  profileId: string,
  movieId: string,
  interactionType: 'like' | 'dislike',
) {
  try {
    const { data, error } = await supabase
      .from('user_movie_interactions')
      .insert({
        interaction_type: interactionType,
        movie_id: movieId,
        profile_id: profileId,
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to register interaction:', err);
  }
}
