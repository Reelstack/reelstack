import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestSession() {
  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error.message);
        } else if (session) {
          console.log('Session found:', session);
        } else {
          console.log('No active session.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    }
    checkSession();
  }, []);

  return <p>Open the console to see the session result.</p>;
}
