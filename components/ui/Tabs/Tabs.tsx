'use client';

import type { HTMLAttributes } from 'react';
import styles from './Tabs.module.scss';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
}

export function Tabs({
  items,
  value,
  onChange,
  className = '',
  ...rest
}: TabsProps) {
  const activeId = value ?? items[0]?.id;
  const activeItem = items.find((t) => t.id === activeId) ?? items[0];

  return (
    <div className={`${styles.wrapper} ${className}`.trim()} {...rest}>
      <ul className={styles.list} role="tablist">
        {items.map((tab) => (
          <li key={tab.id} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              data-active={tab.id === activeId ? '' : undefined}
              className={styles.tab}
              onClick={() => onChange?.(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div
        id={activeItem ? `panel-${activeItem.id}` : undefined}
        role="tabpanel"
        aria-labelledby={activeItem ? `tab-${activeItem.id}` : undefined}
        className={styles.panel}
      >
        {activeItem?.content}
      </div>
    </div>
  );
}
