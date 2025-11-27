import { RouterLink } from '../../components/RouterLink';
import settings from '../../assets/settings-svgrepo-com.svg';
import styles from './style.module.css';
import { useState, useEffect, useRef } from 'react';
import { ProfileSpace } from '../../components/ProfileSpace';
import { SettingSpace } from '../../components/SettingSpace';

export function Profile() {
  const [showSettings, setShowSettings] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleScroll = () => {
      const scrollTop = wrapper.scrollTop;
      const scrollHeight = wrapper.scrollHeight;
      const clientHeight = wrapper.clientHeight;

      // Only show footer if content is actually scrollable
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        setShowFooter(false);
        return;
      }

      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Show footer only when at the very end (within 10px threshold)
      const isAtBottom = distanceFromBottom <= 10;
      setShowFooter(isAtBottom);
    };

    // Wait for content to load before checking scroll position
    // Use a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      handleScroll();
    }, 100);

    wrapper.addEventListener('scroll', handleScroll, { passive: true });

    // Also check on resize in case content height changes
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      wrapper.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showSettings]);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.wrapper} ref={wrapperRef}>
          <div className={styles.nav}>
            <RouterLink className={styles.navbar} href='/home/'>
              Home
            </RouterLink>

            <button
              className={styles.settingsButton}
              onClick={() => setShowSettings(prev => !prev)}
            >
              <img className={styles.configsvg} src={settings} alt="Settings" />
            </button>
          </div>
          {showSettings ? (
            <SettingSpace />
          ) : (
            <ProfileSpace />
          )}
        </div>
      </div>
      <footer className={`${styles.footer} ${showFooter ? styles.footerVisible : styles.footerHidden}`}>
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
    </>
  );
}
