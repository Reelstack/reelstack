import { RouterLink } from '../../components/RouterLink';
import styles from './style.module.css';

export function Home() {
  return (
    <>
      <div className={styles.header}>
        <h1>TESTE</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam, quis
          sed ab dolorem pariatur provident rem ut et vitae, repellendus minima
          fuga alias nam autem ea consequatur adipisci earum ad ipsum nihil.
        </p>
        <RouterLink href='/'>LOGIN</RouterLink>
        <RouterLink href='/profile/'>PROFILE</RouterLink>
      </div>
    </>
  );
}
