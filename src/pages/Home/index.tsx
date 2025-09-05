import { useState } from 'react';
import styles from './style.module.css';
import { AnimatePresence, motion } from 'motion/react';
import expand from '../../assets/arrow-increase.svg';
import filter from '../../assets/filter.svg';
import { RouterLink } from '../../components/RouterLink';

export function Home() {
  const [isHover, setHover] = useState(false);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.filterButton}>
          <img className={styles.filter} src={filter} />
        </div>
        <RouterLink href='/profile/'>
          <div className={styles.navbar}>
            Profile
            <div className={styles.arrow} />
          </div>
        </RouterLink>
      </div>
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <div
            className={styles.poster}
            // hover de informações
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <AnimatePresence mode='wait'>
              {isHover && (
                <motion.div
                  key='info'
                  initial={{ opacity: 0, y: +200 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: +200 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className={styles.info}>
                    <div style={{ textAlign: 'center' }}>
                      <h1>Goncharov</h1>
                      <h2>Action, Drama, Suspense</h2>
                    </div>

                    <h2>Director: Martin Scorcese</h2>
                    <h3>
                      Main Cast: Robert De Niro, Al Pacino, Gene Hackman, Harvey
                      keitel, John Cazale, Cybill Sheperd
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <p>see synopsis</p>
                      <RouterLink href='/'>
                        <img className={styles.expand} src={expand} />
                      </RouterLink>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
