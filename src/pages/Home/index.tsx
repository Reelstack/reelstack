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
  const [previewIndex, setPreviewIndex] = useState(1);
  const [isHover, setHover] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(1); // 1 = direita, -1 = esquerda

  const R = 150;
  const [halfWidth, setHalfWidth] = useState(window.innerWidth / 2);

  useEffect(() => {
    const onResize = () => setHalfWidth(window.innerWidth / 2);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const MAX_DRAG = halfWidth * 0.75;
  const swipeThreshold = window.innerWidth * 0.28;

  const movie = movies[index % movies.length];
  const nextMovie = movies[previewIndex % movies.length];

  // ----------------------------------MAIN CARD valores do motion---------------------------------------------------
  const mainX = useMotionValue(0);
  const mainRotate = useMotionValue(0);
  const mainRotateDerived = useTransform(
    mainX,
    [-halfWidth, halfWidth],
    [-15, 15],
  );
  const mainYDerived = useTransform(mainX, latest => {
    const t = Math.max(-1, Math.min(1, latest / halfWidth));
    return R * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  });

  // --------------------------------------PREVIEW CARD--------------------------------
  const previewX = useMotionValue(0);
  const previewY = useMotionValue(R);
  const previewRotate = useMotionValue(0);
  const FADE_DELAY = MAX_DRAG * 0.75;
  const FADE_END = MAX_DRAG;

  const previewYDerived = useTransform(previewX, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    return R * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  });

  const previewRotateDerived = useTransform(previewX, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    return t * 15;
  });

  const previewOpacity = useTransform(mainX, latestX => {
    const absX = Math.abs(latestX);
    if (absX < FADE_DELAY) return 0;
    if (absX >= FADE_END) return 1;
    return (absX - FADE_DELAY) / (FADE_END - FADE_DELAY);
  });

  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    const raw = info.offset.x;
    const soft = MAX_DRAG * Math.tanh(raw / MAX_DRAG);
    mainX.set(soft);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const offsetX = info.offset.x;
    const shouldSwipe = Math.abs(offsetX) > swipeThreshold;
    if (shouldSwipe) {
      const direction = offsetX > 0 ? 1 : -1;
      setSwipeDirection(direction);

      // offscreen do preview card (espelhado do main)
      previewX.set(direction > 0 ? -halfWidth - 200 : halfWidth + 200);
      previewY.set(R);
      previewRotate.set(direction > 0 ? -15 : 15); // tilt espelhado também
      previewOpacity.set(0);

      // Animate no offscreen
      animate(mainX, direction * window.innerWidth, { duration: 0.36 });
      animate(mainRotate, direction * 20, { duration: 0.36 });

      // Animate preview pra centralizar junto com a curva
      animate(previewX, 0, { type: 'spring', stiffness: 150, damping: 20 });
      animate(previewY, 0, { type: 'spring', stiffness: 150, damping: 20 });
      animate(previewRotate, 0, {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
      animate(previewOpacity, 1, {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });

      setTimeout(() => {
        // troca de preview pra main
        mainX.set(previewX.get());
        mainRotate.set(previewRotate.get());

        setIndex(prev => prev + 1);
        setPreviewIndex(prev => prev + 1);
      }, 360);
    } else {
      // Reseta a main card
      animate(mainX, 0, { type: 'spring', stiffness: 300, damping: 24 });
      animate(mainRotate, 0, { type: 'spring', stiffness: 300, damping: 24 });

      // Reseta o preview
      animate(previewX, previewX.get(), {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
      animate(previewY, previewY.get(), {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
      animate(previewRotate, previewRotate.get(), {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
      animate(previewOpacity, 0, {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
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
              <>
                {/* PREVIEW CARD */}
                <motion.div
                  key={`preview-${nextMovie.id}-${swipeDirection}`} // garante uma nova entrada no swipe
                  className={styles.poster}
                  style={{
                    x: previewX,
                    y: previewYDerived,
                    rotate: previewRotateDerived,
                    opacity: previewOpacity,
                    scale: 0.92,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    pointerEvents: 'none',
                  }}
                >
                  <div className={styles.info}>
                    <h1>{nextMovie.title}</h1>
                    <h2>{nextMovie.genres}</h2>
                  </div>
                </motion.div>

                {/* MAIN CARD */}
                <motion.div
                  key={`main-${movie.id}`}
                  className={styles.poster}
                  drag='x'
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  style={{
                    x: mainX,
                    y: mainYDerived,
                    rotate: mainRotateDerived,
                    zIndex: 1,
                  }}
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
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
