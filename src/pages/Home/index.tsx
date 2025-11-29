import { useState, useEffect, useLayoutEffect } from 'react';
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
import { fetchRecommendationsViaWorker } from '../../services/api/recommendations/recommendationFetcher';
import { useBackground } from '../../contexts/BackgroundContext/backgroundContext';
import { useAuth } from '../../contexts/AuthContext/authContext';

export function Home() {
  const [index, setIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [isHover, setHover] = useState(false);
  // const [isExpanded, setExpanded] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(1); // 1 = direita, -1 = esquerda
  const [isSwiping, setIsSwiping] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { setDynamicBg } = useBackground();

  useLayoutEffect(() => {
    setDynamicBg(null);
  }, [setDynamicBg]);

  const R = 150;
  const [halfWidth, setHalfWidth] = useState(window.innerWidth / 2);

  useEffect(() => {
    const onResize = () => setHalfWidth(window.innerWidth / 2);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (authLoading) return; // checagem de sessão
    if (!user) return;
    async function loadMovies() {
      setDynamicBg(null);

      try {
        const profileId = user!.id;

        const rec = await fetchRecommendationsViaWorker(profileId, 10);

        const normalized = await Promise.all(
          rec.map(async (m: any, i: number) => {
            // caso erro retorna original
            const banner = await upgradeImageUrlSafe(m.banner ?? '');

            return {
              id: i + 1,
              title: m.title,
              director: m.director ?? 'Unknown',
              genres:
                m.genres?.map((g: { name: any }) => g.name).join(', ') ??
                'Unknown',
              actors: Array.isArray(m.actors)
                ? m.actors.join(', ')
                : typeof m.actors === 'string'
                  ? m.actors
                  : 'Unknown',
              banner,
            };
          }),
        );
        setMovies(normalized);
        setLoading(false);
      } catch (err) {
        console.error('Recommendation load failed:', err);
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  useEffect(() => {
    if (movies.length > 0) {
      setIndex(0);
      setPreviewIndex(1);
    }
  }, [movies]);

  const MAX_DRAG = halfWidth * 0.75;
  const swipeThreshold = window.innerWidth * 0.28;

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

  async function upgradeImageUrlSafe(originalUrl: string): Promise<string> {
    try {
      // se der errado manter original
      if (!originalUrl) return originalUrl;

      // tentativas apenas pro m.media-amazon.com (safe guard)
      if (!/m\.media-amazon\.com/i.test(originalUrl)) return originalUrl;

      // checa o _V1 token
      // fallback: retornar original
      const match = originalUrl.match(/^(.*@)?(.*_V1_).*\.jpg/i);
      if (!match) return originalUrl;

      // constroi os candidatos a upgrade
      const candidates = [
        originalUrl.replace(/_V1_.*\.jpg/i, '_V1_SX1600.jpg'),
        originalUrl.replace(/_V1_.*\.jpg/i, '_V1_SY1600.jpg'),
        originalUrl.replace(/_V1_.*\.jpg/i, '_V1_SX1200.jpg'),
        originalUrl.replace(/_V1_.*\.jpg/i, '_V1_SL1500.jpg'),
        originalUrl.replace(/_V1_.*\.jpg/i, '_V1_SX1080.jpg'),
      ];

      // truques da internet:
      // simple LRU cache in-memory to avoid re-checking same url on same session
      (upgradeImageUrlSafe as any)._cache =
        (upgradeImageUrlSafe as any)._cache || new Map();
      const cache = (upgradeImageUrlSafe as any)._cache as Map<
        string,
        string | false
      >;
      if (cache.has(originalUrl)) {
        const cached = cache.get(originalUrl);
        return cached === false ? originalUrl : (cached as string);
      }

      // helper
      const checkImage = (src: string, timeoutMs = 2600) =>
        new Promise<boolean>(resolve => {
          const img = new Image();
          let done = false;
          let finish = (ok: boolean) => {
            if (done) return;
            done = true;
            // handlers
            img.onload = img.onerror = null;
            resolve(ok);
          };
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          // safety timeout
          const t = setTimeout(() => {
            finish(false);
          }, timeoutMs);
          // src depois dos handlers
          img.src = src;

          // limpa o timer no trigger
          const originalFinish = finish;
          finish = (ok: boolean) => {
            clearTimeout(t);
            originalFinish(ok);
          };
        });

      // Tenta os candidatos em sequência (evitar paralelo)
      for (const c of candidates) {
        if (!c || c === originalUrl) continue;
        try {
          const ok = await checkImage(c, 2200);
          console.debug('[upgradeImageUrlSafe] tested', c, 'ok=', ok);
          if (ok) {
            cache.set(originalUrl, c);
            return c;
          }
        } catch (e) {
          console.warn('[upgradeImageUrlSafe] check failed', c, e);
          // tenta o prox
        }
      }

      // sem sucesso
      cache.set(originalUrl, false);
      return originalUrl;
    } catch (err) {
      console.error('[upgradeImageUrlSafe] unexpected error', err);
      return originalUrl;
    }
  }

  const movie = movies[index % movies.length];
  const nextMovie = movies[previewIndex % movies.length];

  useEffect(() => {
    if (movie?.banner) {
      setDynamicBg(movie.banner);
    }
  }, [movie]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (movies.length === 0) {
    return <div className={styles.loading}>No movies available.</div>;
  }

  if (!movie || !nextMovie) return null;

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
                    backgroundImage: `url(${nextMovie.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
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
                    backgroundImage: `url(${nextMovie.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
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
                    backgroundImage: `url(${movie.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
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
                  <motion.div
                    key={movie.id}
                    className={styles.infoPanel}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* INNER WRAPPER EXPANDE NO HOVER */}
                    <motion.div
                      className={styles.infoInner}
                      animate={{
                        height: isHover ? 'auto' : '8rem',
                      }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {/* INFORMAÇÃO 100% VISIVEL */}
                      <div className={styles.basicInfo}>
                        <h1>{movie.title}</h1>
                        <h2>{movie.genres}</h2>
                      </div>

                      {/* INFO EXTRA - HOVER */}
                      <motion.div
                        className={styles.extraInfo}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: isHover ? 1 : 0,
                          height: isHover ? 'auto' : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2>Director: {movie.director}</h2>
                        <h3>Main Cast: {movie.actors}</h3>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
