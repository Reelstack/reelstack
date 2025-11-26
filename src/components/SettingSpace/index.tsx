import styles from './styles.module.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/authContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function SettingSpace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountCreated, setAccountCreated] = useState<string>('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_name, created_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setProfileName(profile.profile_name || '');
          if (profile.created_at) {
            const date = new Date(profile.created_at);
            setAccountCreated(date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }));
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_name: profileName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including movies, collections, and preferences.')) {
      return;
    }

    if (!confirm('Final confirmation: This will permanently delete your account and ALL associated data. This cannot be undone. Continue?')) {
      return;
    }

    if (!user) return;

    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out the user
      await supabase.auth.signOut();

      toast.success('Account deleted successfully');
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account');
    }
  }

  if (loading) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.loading}>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1>Settings</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Email</label>
            <p>{user?.email || 'N/A'}</p>
          </div>
          <div className={styles.infoItem}>
            <label>User ID</label>
            <p className={styles.userId}>{user?.id || 'N/A'}</p>
          </div>
          <div className={styles.infoItem}>
            <label>Account Created</label>
            <p>{accountCreated || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile Settings</h2>
        <div className={styles.formGroup}>
          <label htmlFor="profileName">Profile Name</label>
          <input
            id="profileName"
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter your profile name"
            className={styles.input}
          />
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving || !profileName.trim()}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>
        <button
          onClick={handleLogout}
          className={styles.logoutButton}
        >
          Logout
        </button>
      </div>

      <div className={`${styles.section} ${styles.dangerZone}`}>
        <h2 className={styles.sectionTitle}>Danger Zone</h2>
        <p className={styles.warningText}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className={styles.deleteButton}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
