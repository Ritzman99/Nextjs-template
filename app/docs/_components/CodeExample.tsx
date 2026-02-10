'use client';

import { useState, useCallback } from 'react';
import { Code } from '@/components/ui';
import styles from '../docs.module.scss';

interface CodeExampleProps {
  code: string;
  language?: string;
}

export function CodeExample({ code }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeBlockLabel}>Code</span>
        <button
          type="button"
          className={styles.codeBlockCopy}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <Code block>{code}</Code>
    </div>
  );
}
