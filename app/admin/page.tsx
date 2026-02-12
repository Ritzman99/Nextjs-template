import Link from 'next/link';
import styles from './admin.module.scss';

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Admin</h1>
      <p className={styles.pageDescription}>
        Manage roles, sections, users, and support tickets.
      </p>

      <h2 className={styles.sectionTitle}>Access</h2>
      <div className={styles.cardsGrid}>
        <Link href="/admin/sections" className={styles.card}>
          <h2 className={styles.cardTitle}>Sections</h2>
          <p className={styles.cardDescription}>
            View permission sections used for role-based access control.
          </p>
        </Link>
        <Link href="/admin/roles" className={styles.card}>
          <h2 className={styles.cardTitle}>Roles</h2>
          <p className={styles.cardDescription}>
            Create and edit security roles and per-section permissions.
          </p>
        </Link>
        <Link href="/admin/users" className={styles.card}>
          <h2 className={styles.cardTitle}>Users</h2>
          <p className={styles.cardDescription}>
            Manage users, assign roles, and reset passwords.
          </p>
        </Link>
      </div>

      <h2 className={styles.sectionTitle}>Support</h2>
      <div className={styles.cardsGrid}>
        <Link href="/admin/tickets" className={styles.card}>
          <h2 className={styles.cardTitle}>Tickets</h2>
          <p className={styles.cardDescription}>
            View and manage support tickets and email-level inbox.
          </p>
        </Link>
      </div>
    </div>
  );
}
