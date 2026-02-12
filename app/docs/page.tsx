import Link from 'next/link';
import { COMPONENT_DOCS } from './registry';
import styles from './docs.module.scss';

export default function DocsOverviewPage() {
  const layoutDocs = COMPONENT_DOCS.filter((doc) => doc.category === 'layout');
  const componentDocs = COMPONENT_DOCS.filter((doc) => doc.category !== 'layout');

  return (
    <div className="fade-in">
      <h1 className={styles.pageTitle}>Components</h1>
      <p className={styles.pageDescription}>
        A Bootstrap-style catalog of UI and layout components. Each page includes
        examples, variants, code snippets, and API reference.
      </p>

      {layoutDocs.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Layout</h2>
          <div className={`${styles.cardsGrid} stagger-children`}>
            {layoutDocs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/components/${doc.slug}`}
                className={`${styles.card} fade-in`}
              >
                <h2 className={styles.cardTitle}>{doc.name}</h2>
                <p className={styles.cardDescription}>{doc.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {componentDocs.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Components</h2>
          <div className={`${styles.cardsGrid} stagger-children`}>
            {componentDocs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/components/${doc.slug}`}
                className={`${styles.card} fade-in`}
              >
                <h2 className={styles.cardTitle}>{doc.name}</h2>
                <p className={styles.cardDescription}>{doc.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
