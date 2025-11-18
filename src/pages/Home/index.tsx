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

  const MAX_DRAG = halfWidth * 0.75;
  const swipeThreshold = window.innerWidth * 0.28;

  const movie = movies[index % movies.length];
  const nextMovie = movies[(index + 1) % movies.length];

  const x = useMotionValue(0);
  const rotate = useMotionValue(0);

  const rotateDerived = useTransform(x, [-halfWidth, halfWidth], [-15, 15]);

  // formula de meio circulo
  const yDerived = useTransform(x, (latestX: number) => {
    const tRaw = latestX / halfWidth;
    const t = Math.max(-1, Math.min(1, tRaw));
    const inside = Math.max(0, 1 - t * t);
    const y = R * (1 - Math.sqrt(inside));
    return y;
  });

  // threshold pra mostrar preview
  const PREVIEW_ACTIVATE = MAX_DRAG * 0.18;

  // papo de nerd abaixo
  // smooth preview X: starts off-screen and slides toward the clamp point as you drag;
  // we compute a targetClamp (±MAX_DRAG) and then interpolate a softer position so it doesn't jump.
  const previewX = useTransform(x, latest => {
    if (latest > PREVIEW_ACTIVATE) {
      // dragging right -> preview comes from left toward left clamp
      // map drag range [PREVIEW_ACTIVATE..MAX_DRAG] -> [-MAX_DRAG..(-MAX_DRAG+40)]
      const t = Math.min(
        1,
        (latest - PREVIEW_ACTIVATE) / (MAX_DRAG - PREVIEW_ACTIVATE),
      );
      return -MAX_DRAG + t * 40;
    }
    if (latest < -PREVIEW_ACTIVATE) {
      // dragging left -> preview comes from right toward right clamp
      const t = Math.min(
        1,
        (-latest - PREVIEW_ACTIVATE) / (MAX_DRAG - PREVIEW_ACTIVATE),
      );
      return MAX_DRAG - t * 40;
    }
    return 0;
  });

  // espelha o tilt pra fazer o preview
  const previewRotate = useTransform(x, v => {
    // espelha e usa o clamp
    const norm = Math.max(-1, Math.min(1, v / halfWidth));
    return -Math.max(-15, Math.min(15, norm * 15));
  });

  // preview Y copia o espelhamento
  const previewY = useTransform(x, latest => {
    // espelho do X
    const tRaw = -latest / halfWidth;
    const t = Math.max(-1, Math.min(1, tRaw));
    const inside = Math.max(0, 1 - t * t);
    return R * (1 - Math.sqrt(inside)) + 40;
  });

  // esconde no centro e aparece nas bordas
  const previewOpacity = useTransform(x, latest => {
    const abs = Math.abs(latest);
    if (abs < PREVIEW_ACTIVATE) return 0;
    // fade in quando aproxima das bordas
    return Math.min(
      1,
      (abs - PREVIEW_ACTIVATE) / (MAX_DRAG - PREVIEW_ACTIVATE),
    );
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

    if (shouldSwipe) {
      const direction = offsetX > 0 ? 1 : -1;

      // animate do cartão principal
      animate(x, direction * window.innerWidth, { duration: 0.36 });
      animate(rotate, direction * 20, { duration: 0.36 });

      // testando
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
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
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
