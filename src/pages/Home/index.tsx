import { useState } from 'react';
import styles from './style.module.css';
import { AnimatePresence, motion } from 'motion/react';
import cdown from '../../assets/chevron-down.svg';
import { RouterLink } from '../../components/RouterLink';

export function Home() {
  const [isHover, setHover] = useState(false);

  return (
    <>
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
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RouterLink href='/'>
                      <img className={styles.cdown} src={cdown} />
                    </RouterLink>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
