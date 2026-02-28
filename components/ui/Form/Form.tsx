import type { FormHTMLAttributes } from 'react';
import styles from './Form.module.scss';

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'className'> {
  className?: string;
  children: React.ReactNode;
}

export function Form({ className, children, ...rest }: FormProps) {
  return (
    <form className={`${styles.form} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </form>
  );
}

export interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={`${styles.formSection} ${className ?? ''}`.trim()}>
      {title != null && <h2 className={styles.sectionTitle}>{title}</h2>}
      {children}
    </div>
  );
}

export interface FormRowProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function FormRow({ children, fullWidth, className }: FormRowProps) {
  return (
    <div
      className={`${styles.formRow} ${fullWidth ? styles.formRowFullWidth : ''} ${className ?? ''}`.trim()}
    >
      {children}
    </div>
  );
}

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={`${styles.formActions} ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
