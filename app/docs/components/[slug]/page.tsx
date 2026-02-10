import { notFound } from 'next/navigation';
import { getDocBySlug, getAllSlugs } from '../../registry';
import { DocPreview } from '../../_components/DocPreview';
import { CodeExample } from '../../_components/CodeExample';
import { PropsTable } from '../../_components/PropsTable';
import { ExampleRenderer, VariantRenderer } from '../../_components/ExampleRenderer';
import { PlaygroundSection } from '../../_components/PlaygroundSection';
import styles from '../../docs.module.scss';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ComponentDocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  return (
    <>
      <h1 className={styles.pageTitle}>{doc.name}</h1>
      <p className={styles.pageDescription}>{doc.description}</p>

      {doc.examples.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Examples</h2>
          {doc.examples.map((example, i) => (
            <div key={i}>
              <h3 className={styles.exampleTitle}>{example.title}</h3>
              {example.description && (
                <p className={styles.exampleDescription}>{example.description}</p>
              )}
              <DocPreview>
                <ExampleRenderer slug={slug} props={example.props} />
              </DocPreview>
              <CodeExample code={example.code} />
            </div>
          ))}
        </>
      )}

      {doc.variants && doc.variants.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Variants</h2>
          <div className={styles.variantsGrid}>
            {doc.variants.map((variant, i) => (
              <div key={i} className={styles.variantCell}>
                <VariantRenderer slug={slug} variant={variant} />
                <span className={styles.variantLabel}>{variant.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {doc.playground && (
        <PlaygroundSection slug={slug} name={doc.name} />
      )}

      {doc.propsTable && doc.propsTable.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>API</h2>
          <PropsTable rows={doc.propsTable} />
        </>
      )}
    </>
  );
}
