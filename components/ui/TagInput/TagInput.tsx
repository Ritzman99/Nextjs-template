'use client';

import { useRef, useCallback } from 'react';
import { Chip } from '@/components/ui';
import styles from './TagInput.module.scss';

export interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidTag(tag: string): boolean {
  if (!tag) return false;
  // Allow email-like or username (letters, numbers, dots, @)
  return /^[^\s,]+$/.test(tag) && tag.length <= 200;
}

export function TagInput({
  value,
  onChange,
  label,
  placeholder = 'Add…',
  id: idProp,
  disabled,
  'aria-label': ariaLabel,
  className = '',
}: TagInputProps) {
  const id = idProp ?? `tag-input-${Math.random().toString(36).slice(2, 9)}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const commitInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;
    const toAdd = raw.includes(',')
      ? raw.split(',').map((s) => normalizeTag(s)).filter(isValidTag)
      : [normalizeTag(raw)];
    const next = [...value];
    toAdd.forEach((tag) => {
      if (tag && !next.includes(tag)) next.push(tag);
    });
    if (next.length !== value.length) onChange(next);
    input.value = '';
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitInput();
    }
    if (e.key === 'Backspace' && !e.currentTarget.value && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    commitInput();
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={styles.field}
        data-disabled={disabled || undefined}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Chip
            key={`${tag}-${index}`}
            label={tag}
            onRemove={() => removeAt(index)}
            variant="outline"
            color="primary"
          />
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.input}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          aria-label={ariaLabel ?? label ?? 'Tags'}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
