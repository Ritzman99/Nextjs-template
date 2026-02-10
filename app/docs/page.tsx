import Link from 'next/link';
import { COMPONENT_DOCS } from './registry';
import styles from './docs.module.scss';

export default function DocsOverviewPage() {
  return (
    <>
      <h1 className={styles.pageTitle}>Components</h1>
      <p className={styles.pageDescription}>
        A Bootstrap-style catalog of UI components. Each page includes
        examples, variants, code snippets, and API reference.
      </p>
      <div className={styles.cardsGrid}>
        {COMPONENT_DOCS.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/components/${doc.slug}`}
            className={styles.card}
          >
            <h2 className={styles.cardTitle}>{doc.name}</h2>
            <p className={styles.cardDescription}>{doc.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
