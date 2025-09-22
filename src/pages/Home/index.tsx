import { useEffect, useState } from 'react';
import styles from './style.module.css';
import { AnimatePresence, motion } from 'motion/react';
import expand from '../../assets/arrow-increase.svg';
import shrink from '../../assets/arrow-decrease.svg';
import filter from '../../assets/filter.svg';
import { RouterLink } from '../../components/RouterLink';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [isHover, setHover] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/'); // volta pro login se n tiver logado
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.filterButton}>
          <img className={styles.filter} src={filter} alt='Filter' />
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
            // information hover
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

                    <h2>Director: Martin Scorsese</h2>
                    <h3>
                      Main Cast: Robert De Niro, Al Pacino, Gene Hackman, Harvey
                      Keitel, John Cazale, Cybill Shepherd
                    </h3>
                    <motion.div layout>
                      <AnimatePresence mode='wait'>
                        {isExpanded && (
                          <motion.p
                            key='synopsis'
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            Set in Naples during the early 1970s, Goncharov
                            follows the story of a Russian mob boss named
                            Goncharov (Robert De Niro), a former discotheque
                            owner who relocates to Italy after the fall of the
                            Soviet Union. He becomes entangled in the local
                            mafia scene, leading to a complex web of betrayal
                            and tragedy.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <a
                      onClick={() => setExpanded(!isExpanded)}
                      className={styles.seeMore}
                    >
                      <AnimatePresence mode='wait'>
                        <motion.p
                          key={isExpanded ? 'hide' : 'see'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isExpanded ? 'hide synopsis' : 'see synopsis'}
                        </motion.p>
                      </AnimatePresence>
                      <AnimatePresence mode='wait'>
                        <motion.img
                          key={isExpanded ? 'shrink' : 'expand'}
                          className={styles.expand}
                          src={isExpanded ? shrink : expand}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          alt={isExpanded ? 'hide synopsis' : 'show synopsis'}
                        />
                      </AnimatePresence>
                    </a>
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
