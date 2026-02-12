import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Sidebar } from '@/components/layout';
import { authOptions } from '@/lib/auth';
import styles from './admin.module.scss';

const adminSidebarGroups = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Overview' }],
  },
  {
    label: 'Access',
    links: [
      { href: '/admin/sections', label: 'Sections' },
      { href: '/admin/roles', label: 'Roles' },
      { href: '/admin/users', label: 'Users' },
    ],
  },
  {
    label: 'Organization',
    links: [
      { href: '/admin/companies', label: 'Companies' },
      { href: '/admin/locations', label: 'Locations' },
      { href: '/admin/teams', label: 'Teams' },
    ],
  },
  {
    label: 'Support',
    links: [
      { href: '/admin/tickets', label: 'Tickets' },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }
  const role = (session.user as { role?: string }).role;
  if (role !== 'admin') {
    return (
      <div className={styles.layout}>
        <div className={styles.main} style={{ marginLeft: 0 }}>
          <main className={styles.main}>
            <p className={styles.forbidden}>You do not have permission to access the admin area.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        overviewLink={{ href: '/admin', label: 'Overview' }}
        groups={adminSidebarGroups}
        ariaLabel="Admin navigation"
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
