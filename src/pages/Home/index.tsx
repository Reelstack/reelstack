import { RouterLink } from '../../components/RouterLink';
import styles from './style.module.css';

export function Home() {
  return (
    <>
      <div className={styles.header}>
        <h1>BeelBack</h1>
        <p>
          Welcome to BeelBack
        </p>
        <RouterLink href='/'>LOGIN</RouterLink>
        <RouterLink href='/profile/'>PROFILE</RouterLink>
      </div>
    </>
  );
}
