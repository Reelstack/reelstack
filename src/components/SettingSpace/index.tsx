import styles from './styles.module.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/authContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '../ConfirmationModal';

export function SettingSpace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string>('');
  const [originalProfileName, setOriginalProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountCreated, setAccountCreated] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

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
          setOriginalProfileName(profile.profile_name || '');
          if (profile.created_at) {
            const date = new Date(profile.created_at);
            setAccountCreated(date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }));
          }
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        const errorMessage = err?.message || 'Failed to load profile information';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  function validateProfileName(name: string): string | null {
    const trimmed = name.trim();

    if (!trimmed) {
      return 'Profile name cannot be empty';
    }

    if (trimmed.length < 3) {
      return 'Profile name must be at least 3 characters';
    }

    if (trimmed.length > 50) {
      return 'Profile name must be less than 50 characters';
    }

    // Check for invalid characters (alphanumeric, spaces, underscores, hyphens only)
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
      return 'Profile name can only contain letters, numbers, spaces, underscores, and hyphens';
    }

    return null;
  }

  async function checkProfileNameUniqueness(name: string): Promise<boolean> {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('profile_name', name.trim())
        .neq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !data; // Returns true if name is unique (no existing profile with this name)
    } catch (err) {
      console.error('Error checking profile name uniqueness:', err);
      return true; // Allow save if check fails (don't block user)
    }
  }

  async function handleSaveProfile() {
    if (!user) return;

    // Clear previous errors
    setProfileNameError(null);

    // Validate profile name
    const validationError = validateProfileName(profileName);
    if (validationError) {
      setProfileNameError(validationError);
      return;
    }

    // Check if name changed
    const trimmedName = profileName.trim();
    if (trimmedName === originalProfileName) {
      toast.error('No changes to save');
      return;
    }

    // Check uniqueness
    const isUnique = await checkProfileNameUniqueness(trimmedName);
    if (!isUnique) {
      setProfileNameError('This profile name is already taken. Please choose another one.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_name: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setOriginalProfileName(trimmedName); // Update original name

      // Trigger a custom event for ProfileSpace to listen
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err: any) {
      console.error('Error updating profile:', err);

      // Handle specific errors
      if (err.code === '23505' || err.message?.includes('unique')) {
        setProfileNameError('This profile name is already taken. Please choose another one.');
      } else if (err.message) {
        setProfileNameError(err.message);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLogoutModalOpen(true);
  }

  async function confirmLogout() {
    setLogoutModalOpen(false);
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
    setDeleteModalOpen(true);
  }

  async function confirmDeleteAccount() {
    setDeleteModalOpen(false);

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
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast.error(err.message || 'Failed to delete account');
    }
  }

  if (loading) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={logoutModalOpen}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutModalOpen(false)}
        variant="default"
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data including movies, collections, and preferences."
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
        variant="danger"
      />

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
              onChange={(e) => {
                setProfileName(e.target.value);
                setProfileNameError(null); // Clear error when user types
              }}
              placeholder="Enter your profile name"
              className={`${styles.input} ${profileNameError ? styles.inputError : ''}`}
              maxLength={50}
            />
            {profileNameError && (
              <span className={styles.errorMessage}>{profileNameError}</span>
            )}
            <span className={styles.helpText}>
              Must be 3-50 characters. Letters, numbers, spaces, underscores, and hyphens only.
            </span>
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
    </>
  );
}
