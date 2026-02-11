'use client';

import type { HTMLAttributes } from 'react';
import { createContext, useContext } from 'react';
import type { ButtonColor, ButtonRadius, ButtonSize, ButtonVariant } from '../Button';
import styles from './ButtonGroup.module.scss';

export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  color?: ButtonColor;
  radius?: ButtonRadius;
  size?: ButtonSize;
}

const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

export function useButtonGroupContext() {
  return useContext(ButtonGroupContext);
}

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
  variant?: ButtonVariant;
  color?: ButtonColor;
  radius?: ButtonRadius;
  size?: ButtonSize;
}

export function ButtonGroup({
  orientation = 'horizontal',
  attached = false,
  variant,
  color,
  radius,
  size,
  className = '',
  children,
  ...rest
}: ButtonGroupProps) {
  const contextValue: ButtonGroupContextValue | null =
    variant != null || color != null || radius != null || size != null
      ? { variant, color, radius, size }
      : null;

  const classNames = [
    styles.wrapper,
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    attached ? styles.attached : styles.gap,
  ].join(' ');

  return (
    <ButtonGroupContext.Provider value={contextValue}>
      <div className={`${classNames} ${className}`.trim()} role="group" {...rest}>
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}
