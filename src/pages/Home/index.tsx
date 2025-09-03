import { useState } from 'react';
import { RouterLink } from '../../components/RouterLink';
import styles from './style.module.css';
import { AnimatePresence, motion } from 'motion/react';

export function Home() {
  const [isHover, setHover] = useState(false);

  return (
    <>
      <div className={styles.wrapper}>
        <div
          className={styles.poster}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <AnimatePresence mode='wait'>
            {isHover && (
              <motion.div
                key='info'
                initial={{ opacity: 0, y: +50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: +50 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className={styles.info}>
                  <h1>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Fuga, suscipit.
                  </h1>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <RouterLink href='/'>LOGIN</RouterLink>
        <RouterLink href='/profile/'>PROFILE</RouterLink>
      </div>
    </>
  );
}
