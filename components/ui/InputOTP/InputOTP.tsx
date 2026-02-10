'use client';

import { useRef, useState, useCallback } from 'react';
import styles from './InputOTP.module.scss';

export interface InputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'numeric' | 'text';
  disabled?: boolean;
  className?: string;
}

export function InputOTP({
  length = 6,
  value: controlledValue,
  onChange,
  type = 'numeric',
  disabled = false,
  className = '',
}: InputOTPProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState('');
  const value = controlledValue ?? uncontrolledValue;
  const isControlled = controlledValue !== undefined;
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const char = type === 'numeric' ? input.replace(/\D/g, '').slice(-1) : input.slice(-1);
    const arr = value.split('').slice(0, length);
    arr[index] = char;
    const joined = arr.join('');
    setValue(joined);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = (type === 'numeric' ? e.clipboardData.getData('text').replace(/\D/g, '') : e.clipboardData.getData('text')).slice(0, length);
    setValue(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    refs.current[nextIndex]?.focus();
  };

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type={type === 'numeric' ? 'tel' : 'text'}
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          maxLength={1}
          value={digits[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={styles.input}
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
