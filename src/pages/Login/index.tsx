import styles from './style.module.css';

export function Login() {
  return (
    <>
      <div className={styles.page}>
        <div className={styles.formWrapper}>
          <h2>ReelStack</h2>
          <form className={styles.loginForm}>
            <input className={styles.formInput} name='login' />
            <input className={styles.formInput} name='password' />
            <h6>Forgot your password?</h6>
            <button className={styles.formButton} type='submit'>
              Sign In
            </button>
            <h5>Dont have an account yet?</h5>
            <button className={styles.formButton} type='submit'>
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
