'use client';

import type { InputHTMLAttributes } from 'react';
import { useRef, useEffect } from 'react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  indeterminate = false,
  className = '',
  id: idProp,
  ...rest
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const id = idProp ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label htmlFor={id} className={`${styles.wrapper} ${className}`.trim()}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={styles.input}
        data-indeterminate={indeterminate ? '' : undefined}
        {...rest}
      />
      <span className={styles.box}>
        {indeterminate ? (
          <span className={styles.indeterminate} aria-hidden />
        ) : (
          <span className={styles.check} aria-hidden />
        )}
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </label>
  );
}
