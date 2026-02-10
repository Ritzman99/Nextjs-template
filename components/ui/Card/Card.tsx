'use client';

import type { HTMLAttributes } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function Card({
  title,
  description,
  header,
  footer,
  children,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div className={`${styles.root} ${className}`.trim()} {...rest}>
      {(header ?? title ?? description) && (
        <div className={styles.header}>
          {header ?? (
            <>
              {title != null && <h3 className={styles.title}>{title}</h3>}
              {description != null && <p className={styles.description}>{description}</p>}
            </>
          )}
        </div>
      )}
      {children != null && <div className={styles.body}>{children}</div>}
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
