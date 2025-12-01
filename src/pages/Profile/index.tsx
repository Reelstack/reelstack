import { RouterLink } from '../../components/RouterLink';
import settings from '../../assets/settings-svgrepo-com.svg';
import styles from './style.module.css';
import { useState } from 'react';
import { ProfileSpace } from '../../components/ProfileSpace';
import { SettingSpace } from '../../components/SettingSpace';

export function Profile() {
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.nav}>
          <RouterLink className={styles.navbar} href='/home/'>
            Home
            <div className={styles.arrow} />
          </RouterLink>

          <button
            className={styles.settingsButton}
            onClick={() => setShowSettings(prev => !prev)}
          >
            <img className={styles.configsvg} src={settings} alt="Settings" />
          </button>
        </div>
        {showSettings ? (
          <SettingSpace onLoadingChange={setIsLoading} />
        ) : (
          <ProfileSpace onLoadingChange={setIsLoading} />
        )}
        {!isLoading && (
          <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <h2 className={styles.footerTitle}>ReelStack</h2>
              <p className={styles.footerTagline}>
                Discover your next favorite film
              </p>
            </div>
            <div className={styles.footerInfo}>
              <p className={styles.footerCopyright}>
                © {new Date().getFullYear()} ReelStack. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        )}
      </div>
    </div>
  );
}
