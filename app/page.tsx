import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={`${styles.main} diagonal-bg fade-in`}>
      <h1 className={styles.title}>
        Next.js Template
      </h1>
      <p className={styles.subtitle}>
        Get started by editing <code className={styles.code}>app/page.tsx</code>
      </p>
    </main>
  );
}
