'use client';

import type { HTMLAttributes } from 'react';
import { Checkbox } from '../Checkbox';
import styles from './CheckboxGroup.module.scss';

export interface CheckboxOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: CheckboxOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  layout?: 'vertical' | 'horizontal';
  label?: string;
  error?: string;
}

export function CheckboxGroup({
  options,
  value = [],
  onChange,
  layout = 'vertical',
  label,
  error,
  className = '',
  ...rest
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    const next = checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange?.(next);
  };

  return (
    <div
      className={`${styles.root} ${layout === 'horizontal' ? styles.horizontal : ''} ${className}`.trim()}
      role="group"
      aria-labelledby={label ? undefined : undefined}
      {...rest}
    >
      {label && <div className={styles.label}>{label}</div>}
      {options.map((opt) => (
        <Checkbox
          key={opt.value}
          label={opt.label}
          checked={value.includes(opt.value)}
          disabled={opt.disabled}
          onChange={(e) => handleChange(opt.value, e.target.checked)}
        />
      ))}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
