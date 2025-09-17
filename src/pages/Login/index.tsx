import { RouterLink } from '../../components/RouterLink';
import styles from './style.module.css';

export function Login() {
  return (
    <>
      <div className={styles.header}>
        <h1>Login</h1>
        <form className={styles.form}>
          <input type='text' placeholder='Username' />
          <input type='password' placeholder='Password' />
          <button type='submit'>Login</button>
        </form>
        <RouterLink href='/home/'>HOME</RouterLink>
        <RouterLink href='/profile/'>PROFILE</RouterLink>
      </div>
      <div className={styles.content}>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam, quis
          sed ab dolorem pariatur provident rem ut et vitae, repellendus minima
          fuga alias nam autem ea consequatur adipisci earum ad ipsum nihil.
        </p>
        <RouterLink href='/home/'>HOME</RouterLink>
        <RouterLink href='/profile/'>PROFILE</RouterLink>
      </div>
    </>
  );
}
