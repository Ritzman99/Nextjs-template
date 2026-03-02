'use client';

import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
}

const PASSWORD_MANAGER_IGNORE = {
  'data-form-type': 'other',
  'data-1p-ignore': true,
  'data-lpignore': 'true',
  'data-bwignore': true,
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = '', id: idProp, autoComplete = 'off', ...rest },
  ref
) {
  const id = idProp ?? `input-${Math.random().toString(36).slice(2, 9)}`;
  const pmIgnore = autoComplete === 'off' ? PASSWORD_MANAGER_IGNORE : {};
  const describedBy = [error && `${id}-error`, helperText && `${id}-helper`].filter(Boolean).join(' ') || undefined;
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
        autoComplete={autoComplete}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
        {...pmIgnore}
      />
      {error && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${id}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});
