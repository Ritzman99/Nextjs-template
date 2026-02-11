'use client';

import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useButtonGroupContext } from '../ButtonGroup';
import styles from './Button.module.scss';

export type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'shadow' | 'link';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  variant?: ButtonVariant;
}

const colorMap: Record<ButtonColor, string> = {
  default: styles.colorDefault,
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
};

const sizeMap: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const radiusMap: Record<ButtonRadius, string> = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  full: styles.radiusFull,
};

const variantMap: Record<ButtonVariant, string> = {
  solid: '',
  outline: styles.outline,
  ghost: styles.ghost,
  shadow: styles.shadow,
  link: styles.link,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    color: colorProp,
    size: sizeProp,
    radius: radiusProp,
    variant: variantProp,
    className = '',
    children,
    disabled,
    ...rest
  },
  ref
) {
  const group = useButtonGroupContext();
  const color = colorProp ?? group?.color ?? 'primary';
  const size = sizeProp ?? group?.size ?? 'md';
  const radius = radiusProp ?? group?.radius ?? 'md';
  const variant = variantProp ?? group?.variant ?? 'solid';

  const classNames = [
    styles.wrapper,
    colorMap[color],
    sizeMap[size],
    radiusMap[radius],
    variantMap[variant],
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type="button"
      className={`${classNames} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});
