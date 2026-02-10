'use client';

import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id: idProp, ...rest },
  ref
) {
  const id = idProp ?? `input-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
