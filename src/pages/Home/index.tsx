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
  const [previewIndex, setPreviewIndex] = useState(1); // initially the next movie

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

  const x = useMotionValue(0);
  const rotate = useMotionValue(0);

  // MAIN CARD
  const yDerived = useTransform(x, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    const inside = Math.max(0, 1 - t * t);
    return R * (1 - Math.sqrt(inside));
  });

  const rotateDerived = useTransform(x, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    return t * 15;
  });

  // PARAMETERS
  const PREVIEW_START = MAX_DRAG * 0.65; // start moving the preview
  const FADE_DELAY = MAX_DRAG * 0.77; // start fading later
  const FADE_END = MAX_DRAG; // fully visible at max drag

  // PREVIEW CARD
  const previewX = useTransform(x, latestX => {
    const absX = Math.abs(latestX);
    const direction = latestX > 0 ? -1 : 1; // enter opposite side
    const startX = direction * (halfWidth + 200);

    if (absX < PREVIEW_START) return startX;

    // progress along curve
    const tProgress = (absX - PREVIEW_START) / (MAX_DRAG - PREVIEW_START);
    const circleT = -latestX / halfWidth;
    const targetX = circleT * halfWidth;

    return startX + (targetX - startX) * tProgress;
  });

  const previewY = useTransform(previewX, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    const inside = Math.max(0, 1 - t * t);
    return R * (1 - Math.sqrt(inside));
  });

  const previewRotate = useTransform(previewX, latestX => {
    const t = Math.max(-1, Math.min(1, latestX / halfWidth));
    return t * 15;
  });

  const previewOpacity = useTransform(x, latestX => {
    const absX = Math.abs(latestX);
    if (absX < FADE_DELAY) return 0; // wait longer before fade
    if (absX >= FADE_END) return 1;

    return (absX - FADE_DELAY) / (FADE_END - FADE_DELAY);
  });

  // clamp suave usando tanh()
  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    const raw = info.offset.x;
    const soft = MAX_DRAG * Math.tanh(raw / MAX_DRAG);
    x.set(soft);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const offsetX = info.offset.x;
    const shouldSwipe = Math.abs(offsetX) > swipeThreshold;
    const direction = offsetX > 0 ? 1 : -1;

    if (shouldSwipe) {
      // 1️⃣ Animate main card offscreen
      animate(x, direction * window.innerWidth, { duration: 0.36 });
      animate(rotate, direction * 20, { duration: 0.36 });

      // 2️⃣ Animate preview card to center along curve
      // previewX/previewY/previewRotate are motion values; we can animate them directly
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

      // 3️⃣ After animation, swap indexes
      setTimeout(() => {
        // reset main card motion values
        x.set(0);
        rotate.set(0);

        // promote preview to main
        setIndex(prev => prev + 1);
        setPreviewIndex(prev => prev + 1);

        // reset preview offscreen for next movie
        previewOpacity.set(0);
      }, 360);
    } else {
      // If not swiped far enough, reset main card as usual
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 24 });
      animate(rotate, 0, { type: 'spring', stiffness: 300, damping: 24 });

      // reset preview offscreen
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
                {/*                   PREVIEW CARD                      */}
                <motion.div
                  className={styles.poster}
                  style={{
                    x: previewX,
                    y: previewY,
                    rotate: previewRotate,
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

                {/*                       MAIN CARD                       */}
                <motion.div
                  key={movie.id}
                  className={styles.poster}
                  drag='x'
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  style={{
                    x,
                    y: yDerived,
                    rotate: rotateDerived,
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
