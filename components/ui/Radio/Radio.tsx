'use client';

import type { InputHTMLAttributes } from 'react';
import styles from './Radio.module.scss';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export function Radio({
  label,
  className = '',
  id: idProp,
  ...rest
}: RadioProps) {
  const id = idProp ?? `radio-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label htmlFor={id} className={`${styles.wrapper} ${className}`.trim()}>
      <input id={id} type="radio" className={styles.input} {...rest} />
      <span className={styles.dot}>
        <span className={styles.inner} aria-hidden />
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </label>
  );
}
