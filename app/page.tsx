import { redirect } from 'next/navigation';
import { readProjectConfig } from '@/lib/projectConfig';
import styles from "./page.module.scss";

export default function Home() {
  const config = readProjectConfig();
  if (config && !config.appliedAt) {
    redirect('/setup');
  }
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
