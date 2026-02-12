import { Sidebar } from '@/components/layout';
import { COMPONENT_DOCS } from './registry';
import styles from './docs.module.scss';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const layoutDocs = COMPONENT_DOCS.filter((doc) => doc.category === 'layout');
  const componentDocs = COMPONENT_DOCS.filter((doc) => doc.category !== 'layout');

  const groups = [
    {
      label: 'Layout',
      links: layoutDocs.map((doc) => ({
        href: `/docs/components/${doc.slug}`,
        label: doc.name,
      })),
    },
    {
      label: 'Components',
      links: componentDocs.map((doc) => ({
        href: `/docs/components/${doc.slug}`,
        label: doc.name,
      })),
    },
  ].filter((g) => g.links.length > 0);

  return (
    <div className={styles.layout}>
      <Sidebar
        overviewLink={{ href: '/docs', label: 'Overview' }}
        groups={groups}
        ariaLabel="Component docs"
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
