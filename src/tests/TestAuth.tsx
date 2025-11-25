import { useAuth } from '../contexts/AuthContext/authContext';
import { supabase } from '../lib/supabaseClient';

export default function TestAuth() {
  const { user, loading } = useAuth();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    } else {
      console.log('Logged out successfully');
    }
  }

  if (loading) return <p>Checking session...</p>;

  return (
    <div style={{ position: 'absolute' }}>
      {user ? (
        <>
          <p>Logged in as {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
