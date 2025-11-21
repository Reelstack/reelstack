import { useState, useEffect } from 'react';
import styles from './style.module.css';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from 'motion/react';
// import expand from '../../assets/arrow-increase.svg';
// import shrink from '../../assets/arrow-decrease.svg';
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
  // const [isExpanded, setExpanded] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(1); // 1 = direita, -1 = esquerda
  const [isSwiping, setIsSwiping] = useState(false);

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

  // smoothing helper usado pros transforms (sine easing -> macio nos cantos)
  const smoothT = (x: number, hw: number) => {
    const t = Math.max(-1, Math.min(1, x / hw));
    return Math.sin(t * (Math.PI / 2)); // maps [-1,1] -> [-1,1] cantos macios
  };

  // valores motion do MAIN CARD
  const mainX = useMotionValue(0);
  const mainRotateDerived = useTransform(
    mainX,
    [-halfWidth, halfWidth],
    [-15, 15],
  );
  const mainYDerived = useTransform(mainX, latest => {
    const t = smoothT(latest, halfWidth);
    // curva em formato de circulo com smoothTranform pra evitar bater na borda
    return R * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  });

  // PREVIEW: opacidade animada baseada no X do preview
  const previewX = useMotionValue(0);
  const previewOpacity = useMotionValue(0);

  // PREVIEW: derivada do Y baseada no X do preview pra fazer o efeito de reel
  const previewYDerived = useTransform(previewX, latestX => {
    const t = smoothT(latestX, halfWidth);
    return R * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  });
  const previewRotateDerived = useTransform(previewX, latestX => {
    const t = smoothT(latestX, halfWidth);
    return t * 15;
  });

  // PREVIEW:  manter o mesmo tamanho do cartão e animação suave ao entrar
  const previewScale = useTransform(
    previewX,
    [-halfWidth, 0, halfWidth],
    [0.96, 1, 0.96],
  );

  // comportamento da derivada do drag
  const edgeOffset = halfWidth * 1.1;
  const previewXDrag = useTransform(mainX, latestX => {
    const direction = latestX >= 0 ? 1 : -1;
    const absX = Math.abs(latestX);
    const curvePit = 80; // demora do fade pra evitar aparecer no "bump" da curva
    if (absX < curvePit) return direction * -edgeOffset;
    const progress = Math.min((absX - curvePit) / (halfWidth - curvePit), 1);
    // interpolação de progresso pro preview entrar na curva
    const eased = Math.sin(progress * (Math.PI / 2));
    return direction * (-edgeOffset + eased * edgeOffset * 0.45);
  });

  // cont pra segurar o fade pra n passar no "bump"
  const previewOpacityDrag = useTransform(mainX, latestX => {
    const absX = Math.abs(latestX);
    const fadeStart = Math.max(80, halfWidth * 0.14); // delay pra telas maiores
    const fadeEnd = halfWidth * 0.6;
    if (absX < fadeStart) return 0;
    if (absX >= fadeEnd) return 1;
    return (absX - fadeStart) / (fadeEnd - fadeStart);
  });

  // progresso crossfade pra misturar animação preview com changing
  const contentSwapProgress = useMotionValue(0);
  const mainInnerOpacity = useTransform(contentSwapProgress, v => 1 - v);

  // opacidade da faux card
  const fauxOpacity = useMotionValue(0);

  // Set sincronizado ajuda a evitar problemas
  useEffect(() => {
    // inicia offscreen
    previewX.set(-edgeOffset);
    previewOpacity.set(0);
    fauxOpacity.set(0);

    const unsub = mainX.on('change', () => {
      // enquanto o usuario estiver no drag, mantém siguiendo o X
      previewX.set(previewXDrag.get());
      previewOpacity.set(previewOpacityDrag.get());
    });

    return () => unsub();
  }, [
    mainX,
    previewX,
    previewOpacity,
    previewXDrag,
    previewOpacityDrag,
    edgeOffset,
  ]);

  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    if (isSwiping) return; // ignora inputs enquanto trocando cards
    const raw = info.offset.x;
    const soft = MAX_DRAG * Math.tanh(raw / MAX_DRAG);
    mainX.set(soft);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (isSwiping) return;
    const offsetX = info.offset.x;
    const shouldSwipe = Math.abs(offsetX) > swipeThreshold;

    if (!shouldSwipe) {
      // snap back do main card e um fade out do preview
      animate(mainX, 0, { type: 'spring', stiffness: 300, damping: 24 });
      animate(previewOpacity, 0, {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      });
      return;
    }

    // animação de changing pra ir de preview pra main card
    const direction = offsetX > 0 ? 1 : -1;
    setSwipeDirection(direction);
    setIsSwiping(true);

    // stabilizador pra evitar valores estranhos
    mainX.set(mainX.get());
    previewX.set(previewX.get());
    previewOpacity.set(previewOpacity.get());
    contentSwapProgress.set(0);

    // animação de saida do main card
    animate(mainX, direction * window.innerWidth, { duration: 0.36 });

    // animação do preview pra entrar na curva e fazer o crossfade
    animate(previewX, 0, {
      type: 'spring',
      stiffness: 150,
      damping: 20,
      onComplete: () => {
        // crossfade dos conteúdos
        animate(contentSwapProgress, 1, {
          duration: 0.14,
          onComplete: () => {
            // --- FAUX CARD (existe até o flicker ocorrer, depois some) ---
            fauxOpacity.set(1); // mostra de imediato

            // fade preview rapido pro faux ser o unico
            animate(previewOpacity, 0, {
              duration: 0.12,
              onComplete: () => {
                // DOM swap enquanto tiver o faux
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    // atualiza os indices enquanto o faux existir
                    setIndex(prev => prev + 1);
                    setPreviewIndex(prev => prev + 1);

                    // reseta o crossfade e mainX pro inicio
                    contentSwapProgress.set(0);
                    mainX.set(0);

                    // esconde o faux
                    fauxOpacity.set(0);

                    // preview reset pronto
                    previewX.set(-edgeOffset);
                    previewOpacity.set(0);

                    setIsSwiping(false);
                  }, 0);
                });
              },
            });
          },
        });
      },
    });

    // fade do preview quanto mais se aproxima do centro
    animate(previewOpacity, 1, { type: 'spring', stiffness: 150, damping: 18 });
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
        <div
          className={styles.wrapper}
          style={{ position: 'relative', width: '55rem', height: '80rem' }}
        >
          <AnimatePresence>
            {movie && (
              <>
                {/*-------------------------------------------- PREVIEW --------------------------------------------------- */}
                <motion.div
                  key={`preview-${nextMovie.id}-${swipeDirection}`}
                  className={styles.poster}
                  style={{
                    x: previewX,
                    y: previewYDerived,
                    rotate: previewRotateDerived,
                    opacity: previewOpacity,
                    scale: previewScale, // combina os tamanhos com MAIN
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 60, // preview acima do main enquanto tiver chegando
                    pointerEvents: 'none',
                    willChange: 'transform, opacity',
                  }}
                />

                {/*-------------------------------------------- FAUX (cortina até as coisas ficarem boas) ------------------------------*/}
                <motion.div
                  key={`faux-${nextMovie.id}`}
                  className={styles.poster}
                  style={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    opacity: fauxOpacity,
                    scale: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 50, // atrás do main e preview
                    pointerEvents: 'none',
                    willChange: 'opacity',
                  }}
                />

                {/*-------------------------------------------- MAIN ---------------------------------------------*/}
                <motion.div
                  key={'main-card'}
                  className={styles.poster}
                  drag='x'
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  style={{
                    x: mainX,
                    y: mainYDerived,
                    rotate: mainRotateDerived,
                    zIndex: 70,
                    pointerEvents: isSwiping ? 'none' : 'auto',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                  }}
                  onMouseEnter={() => !isSwiping && setHover(true)}
                  onMouseLeave={() => setHover(false)}
                  initial={{ y: 150, rotate: -4, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                >
                  {/* conteudo faz um crossfade co mo preview via contentSwapProgress*/}
                  <div className={styles.info}>
                    <motion.div style={{ opacity: mainInnerOpacity }}>
                      <div style={{ textAlign: 'center' }}>
                        <h1>{movie.title}</h1>
                        <h2>{movie.genres}</h2>
                      </div>

                      {/* mostra  a info extra no hover */}
                      {isHover && (
                        <>
                          <h2>Director: {movie.director}</h2>
                          <h3>Main Cast: {movie.cast}</h3>

                          {/* <motion.div layout>
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
                          </motion.div> */}

                          {/* <a
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
                          </a> */}
                        </>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
