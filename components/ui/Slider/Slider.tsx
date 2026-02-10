'use client';

import type { InputHTMLAttributes } from 'react';
import { useRef, useEffect, useState } from 'react';
import styles from './Slider.module.scss';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

export function Slider({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = false,
  className = '',
  ...rest
}: SliderProps) {
  const [percent, setPercent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = max > min ? ((value - min) / (max - min)) * 100 : 0;
    setPercent(Math.min(100, Math.max(0, p)));
  }, [value, min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange?.(v);
  };

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
        <input
          ref={inputRef}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          {...rest}
        />
        <span
          className={styles.thumb}
          style={{ left: `${percent}%` }}
          aria-hidden
        />
      </div>
      {showValue && (
        <span className={styles.valueLabel}>{value}</span>
      )}
    </div>
  );
}
