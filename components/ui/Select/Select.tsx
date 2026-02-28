'use client';

import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Select.module.scss';

const PASSWORD_MANAGER_IGNORE = {
  'data-form-type': 'other',
  'data-1p-ignore': true,
  'data-lpignore': 'true',
  'data-bwignore': true,
} as const;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    label,
    error,
    placeholder,
    onChange,
    value,
    id: idProp,
    className = '',
    autoComplete = 'off',
    ...rest
  },
  ref
) {
  const id = idProp ?? `select-${Math.random().toString(36).slice(2, 9)}`;
  const pmIgnore = autoComplete === 'off' ? PASSWORD_MANAGER_IGNORE : {};

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        value={value ?? ''}
        autoComplete={autoComplete}
        className={`${styles.select} ${error ? styles.error : ''} ${className}`.trim()}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={!!error}
        {...rest}
        {...pmIgnore}
      >
        {placeholder != null && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});
