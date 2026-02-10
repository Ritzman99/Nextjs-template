'use client';

import type { HTMLAttributes } from 'react';
import styles from './Table.module.scss';

export interface TableColumn<T = unknown> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
}

export interface TableProps<T = unknown> extends HTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  data?: T[];
  striped?: boolean;
  bordered?: boolean;
  children?: React.ReactNode;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  striped = false,
  bordered = false,
  children,
  className = '',
  ...rest
}: TableProps<T>) {
  const classNames = [styles.wrapper, striped ? styles.striped : '', bordered ? styles.bordered : ''].filter(Boolean).join(' ');

  if (children != null) {
    return (
      <table className={`${classNames} ${className}`.trim()} {...rest}>
        {children}
      </table>
    );
  }

  const getCell = (row: T, col: TableColumn<T>) => {
    if (col.render) return col.render(row);
    if (typeof col.accessor === 'function') return col.accessor(row);
    if (col.accessor != null) return String(row[col.accessor] ?? '');
    return String((row as Record<string, unknown>)[col.key] ?? '');
  };

  return (
    <table className={`${classNames} ${className}`.trim()} {...rest}>
      <thead className={styles.head}>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={styles.th}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.tbody}>
        {(data ?? []).map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} className={styles.td}>
                {getCell(row, col)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
