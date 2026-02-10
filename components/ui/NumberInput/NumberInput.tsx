'use client';

import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './NumberInput.module.scss';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showStepper?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value,
    onChange,
    min,
    max,
    step = 1,
    showStepper = true,
    className = '',
    disabled,
    ...rest
  },
  ref
) {
  const num = value ?? 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? min ?? 0 : Number(e.target.value);
    onChange?.(v);
  };

  const increment = () => {
    const next = num + step;
    const capped = max != null ? Math.min(next, max) : next;
    onChange?.(capped);
  };

  const decrement = () => {
    const next = num - step;
    const capped = min != null ? Math.max(next, min) : next;
    onChange?.(capped);
  };

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <input
        ref={ref}
        type="number"
        value={value === undefined ? '' : value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={styles.input}
        {...rest}
      />
      {showStepper && (
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            onClick={decrement}
            disabled={disabled || (min != null && num <= min)}
            aria-label="Decrease"
          >
            −
          </button>
          <button
            type="button"
            className={styles.stepperButton}
            onClick={increment}
            disabled={disabled || (max != null && num >= max)}
            aria-label="Increase"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
});
