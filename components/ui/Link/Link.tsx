'use client';

import NextLink from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import styles from './Link.module.scss';

export type LinkVariant = 'underline' | 'none';
export type LinkColor = 'primary' | 'secondary' | 'muted';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: LinkVariant;
  color?: LinkColor;
  external?: boolean;
  useNextLink?: boolean;
}

const variantMap: Record<LinkVariant, string> = {
  underline: styles.underline,
  none: styles.none,
};

const colorMap: Record<LinkColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  muted: styles.colorMuted,
};

export function Link({
  href,
  variant = 'underline',
  color = 'primary',
  external = false,
  useNextLink = true,
  className = '',
  children,
  ...rest
}: LinkProps) {
  const classNames = [styles.wrapper, variantMap[variant], colorMap[color]].join(' ');
  const combinedClassName = `${classNames} ${className}`.trim();

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedClassName}
        {...rest}
      >
        {children}
      </a>
    );
  }

  if (useNextLink && href.startsWith('/')) {
    return (
      <NextLink href={href} className={combinedClassName} {...rest}>
        {children}
      </NextLink>
    );
  }

  return (
    <a href={href} className={combinedClassName} {...rest}>
      {children}
    </a>
  );
}
