'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { HTMLAttributes } from 'react';
import styles from './Accordion.module.scss';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export type AccordionStyle = 'default' | 'shadow' | 'bordered' | 'splitted';

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string | string[];
  variant?: AccordionStyle;
}

const styleMap: Record<AccordionStyle, string> = {
  default: styles.styleDefault,
  shadow: styles.styleShadow,
  bordered: styles.styleBordered,
  splitted: styles.styleSplitted,
};

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen,
  variant = 'default',
  className = '',
  ...rest
}: AccordionProps) {
  const defaultSet = Array.isArray(defaultOpen) ? defaultOpen : defaultOpen != null ? [defaultOpen] : [];
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultSet));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`${styles.wrapper} ${styleMap[variant]} ${className}`.trim()} {...rest}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-trigger-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              {item.title}
              <ChevronRight className={styles.icon} aria-hidden />
            </button>
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              className={styles.content}
              hidden={!isOpen}
            >
              <div className={styles.contentInner}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
