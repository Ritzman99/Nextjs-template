'use client';

import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Textarea.module.scss';

const PASSWORD_MANAGER_IGNORE = {
  'data-form-type': 'other',
  'data-1p-ignore': true,
  'data-lpignore': 'true',
  'data-bwignore': true,
} as const;

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = '', id: idProp, autoComplete = 'off', ...rest },
  ref
) {
  const id = idProp ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;
  const pmIgnore = autoComplete === 'off' ? PASSWORD_MANAGER_IGNORE : {};
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        autoComplete={autoComplete}
        className={`${styles.textarea} ${error ? styles.error : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
        {...pmIgnore}
      />
      {error && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
