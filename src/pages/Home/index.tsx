import { useState, useEffect } from 'react';
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

  const R = 150;
  const [halfWidth, setHalfWidth] = useState(window.innerWidth / 2);

  useEffect(() => {
    const onResize = () => setHalfWidth(window.innerWidth / 2);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // const do clamp
  const MAX_DRAG = halfWidth * 0.75;

  const swipeThreshold = window.innerWidth * 0.28;
  const movie = movies[index % movies.length];

  const x = useMotionValue(0);
  const rotate = useMotionValue(0);

  const rotateDerived = useTransform(x, [-halfWidth, halfWidth], [-15, 15]);

  // equação pro meio circulo y = R * (1 - sqrt(1 - t^2))
  const yDerived = useTransform(x, (latestX: number) => {
    const tRaw = latestX / halfWidth;
    const t = Math.max(-1, Math.min(1, tRaw));

    const inside = Math.max(0, 1 - t * t);
    const y = R * (1 - Math.sqrt(inside));
    return y;
  });

  // clamp pra evitar o buraco de formula
  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, info.offset.x));
    x.set(clamped);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const offsetX = info.offset.x;

    if (Math.abs(offsetX) > swipeThreshold) {
      const direction = offsetX > 0 ? 1 : -1;

      animate(x, direction * window.innerWidth, { duration: 0.36 });
      animate(rotate, direction * 20, { duration: 0.36 });

      setTimeout(() => {
        x.set(0);
        rotate.set(0);
        setIndex(prev => prev + 1);
      }, 360);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 24 });
      animate(rotate, 0, { type: 'spring', stiffness: 300, damping: 24 });
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
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ x, y: yDerived, rotate: rotateDerived }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
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
