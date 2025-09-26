import { RouterLink } from '../../components/RouterLink';
import settings from '../../assets/settings-svgrepo-com.svg';
import styles from './style.module.css';
import { useState } from 'react';
import { ProfileSpace } from '../../components/ProfileSpace';
import { SettingSpace } from '../../components/SettingSpace';

export function Profile() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <div className={styles.nav}>
            <RouterLink href='/home/'>Home</RouterLink>

            <button
              className={styles.settingsButton}
              onClick={() => setShowSettings(prev => !prev)}
            >
              <img className={styles.configsvg} src={settings} />
            </button>
          </div>
          {showSettings ? <SettingSpace /> : <ProfileSpace />}
        </div>
      </div>
    </>
  );
}
