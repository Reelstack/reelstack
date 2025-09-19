import styles from './style.module.css';

export function Login() {
  return (
    <>
      <div className={styles.page}>
        <div className={styles.formWrapper}>
          <form className={styles.loginForm}>
            <h2>ReelStack</h2>
            <div className={styles.formGroup}>
              <input
                className={styles.formInput}
                type='text'
                placeholder='Email'
              />

              <input
                className={styles.formInput}
                type='password'
                placeholder='Password'
              />
              <h6>Forgot your password?</h6>
            </div>

            <div className={styles.formGroup}>
              <button className={styles.formButton}>Login</button>
            </div>
            <div className={styles.formGroup}>
              <div className={styles.signup}>
                <h5>Dont have an account yet?</h5>
                <a>Sign Up Now</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
