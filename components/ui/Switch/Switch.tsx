'use client';

import type { InputHTMLAttributes } from 'react';
import styles from './Switch.module.scss';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export function Switch({
  label,
  className = '',
  id: idProp,
  ...rest
}: SwitchProps) {
  const id = idProp ?? `switch-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label htmlFor={id} className={`${styles.wrapper} ${className}`.trim()}>
      <input id={id} type="checkbox" role="switch" className={styles.input} {...rest} />
      <span className={styles.track}>
        <span className={styles.thumb} aria-hidden />
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </label>
  );
}
