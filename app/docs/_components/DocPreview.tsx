import type { ReactNode } from 'react';
import styles from '../docs.module.scss';

interface DocPreviewProps {
  label?: string;
  children: ReactNode;
}

export function DocPreview({ label = 'Live example', children }: DocPreviewProps) {
  return (
    <div className={styles.preview}>
      {label && <span className={styles.previewLabel}>{label}</span>}
      <div className={styles.previewContent}>{children}</div>
    </div>
  );
}
