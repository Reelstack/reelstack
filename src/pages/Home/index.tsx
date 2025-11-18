import { useState } from 'react';
import styles from './style.module.css';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from 'motion/react';
import expand from '../../assets/arrow-increase.svg';
import shrink from '../../assets/arrow-decrease.svg';
import filter from '../../assets/filter.svg';
import { RouterLink } from '../../components/RouterLink';

const movies = [
  {
    id: 1,
    title: 'Test Movie 1',
    genres: 'Action, Thriller',
    director: 'Director One',
    cast: 'Actor A, B, C',
  },
  {
    id: 2,
    title: 'Test Movie 2',
    genres: 'Drama, Romance',
    director: 'Director Two',
    cast: 'Actor X, Y',
  },
  {
    id: 3,
    title: 'Test Movie 3',
    genres: 'Sci-Fi, Horror',
    director: 'Director Three',
    cast: 'Actor R, S',
  },
];

export function Home() {
  const [index, setIndex] = useState(0);
  const [isHover, setHover] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

  const swipeThreshold = window.innerWidth * 0.3; // 30% da tela
  const movie = movies[index % movies.length];

  // Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);

  // VValores derivados pro full-screen swipe
  const rotateDerived = useTransform(
    x,
    [-window.innerWidth, window.innerWidth],
    [-25, 25],
  );
  const yDerived = useTransform(
    x,
    [-window.innerWidth, 0, window.innerWidth],
    [100, 0, 100],
  );

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const offsetX = info.offset.x;
    if (Math.abs(offsetX) > swipeThreshold) {
      const direction = offsetX > 0 ? 1 : -1;

      // Animação off-screen
      animate(x, direction * window.innerWidth, { duration: 0.35 });
      animate(y, 150, { duration: 0.35 }); // curve down
      animate(rotate, direction * 20, { duration: 0.35 });

      setTimeout(() => {
        x.set(0);
        y.set(0);
        rotate.set(-4);
        setIndex(prev => prev + 1);
      }, 350);
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 20 });
      animate(rotate, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

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
          <AnimatePresence>
            {movie && (
              <motion.div
                key={movie.id}
                className={styles.poster}
                drag='x'
                style={{ x, y: yDerived, rotate: rotateDerived }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onDragEnd={handleDragEnd}
                initial={{ y: 150, rotate: -4, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                <AnimatePresence>
                  {isHover && (
                    <motion.div
                      key='info'
                      initial={{ opacity: 0, y: 200 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 200 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <div className={styles.info}>
                        <div style={{ textAlign: 'center' }}>
                          <h1>{movie.title}</h1>
                          <h2>{movie.genres}</h2>
                        </div>
                        <h2>Director: {movie.director}</h2>
                        <h3>Main Cast: {movie.cast}</h3>
                        <motion.div layout>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.p
                                key='synopsis'
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.4,
                                  ease: 'easeInOut',
                                }}
                                style={{ overflow: 'hidden' }}
                              >
                                Placeholder synopsis for animation testing.
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <a
                          onClick={() => setExpanded(!isExpanded)}
                          className={styles.seeMore}
                        >
                          <AnimatePresence>
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
                          <AnimatePresence>
                            <motion.img
                              key={isExpanded ? 'shrink' : 'expand'}
                              className={styles.expand}
                              src={isExpanded ? shrink : expand}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              alt={
                                isExpanded ? 'hide synopsis' : 'show synopsis'
                              }
                            />
                          </AnimatePresence>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
