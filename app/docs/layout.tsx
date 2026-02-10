import { Sidebar } from '@/components/layout';
import { COMPONENT_DOCS } from './registry';
import styles from './docs.module.scss';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarLinks = COMPONENT_DOCS.map((doc) => ({
    href: `/docs/components/${doc.slug}`,
    label: doc.name,
  }));

  return (
    <div className={styles.layout}>
      <Sidebar
        overviewLink={{ href: '/docs', label: 'Overview' }}
        groupLabel="Components"
        links={sidebarLinks}
        ariaLabel="Component docs"
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
