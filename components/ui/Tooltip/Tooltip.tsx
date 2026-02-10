'use client';

import type { HTMLAttributes } from 'react';
import styles from './Tooltip.module.scss';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  children: React.ReactNode;
}

const placementMap: Record<TooltipPlacement, string> = {
  top: styles.placementTop,
  bottom: styles.placementBottom,
  left: styles.placementLeft,
  right: styles.placementRight,
};

export function Tooltip({
  content,
  placement = 'top',
  children,
  className = '',
  ...rest
}: TooltipProps) {
  return (
    <div className={`${styles.wrapper} ${className}`.trim()} {...rest}>
      <span className={styles.trigger}>{children}</span>
      <span role="tooltip" className={`${styles.popover} ${placementMap[placement]}`}>
        {content}
      </span>
    </div>
  );
}
