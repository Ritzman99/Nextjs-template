'use client';

import { useState, useRef, useEffect } from 'react';
import { Form, Button, Input, RichTextEditor } from '@/components/ui';
import { X } from 'lucide-react';
import styles from './ComposeForm.module.scss';

export type SuggestionItem = {
  type: 'user' | 'contact';
  id: string;
  displayName: string;
  identifier: string;
};

export interface ComposeFormProps {
  onSent: (data: { id: string }) => void;
  onCancel?: () => void;
}

function stripEmptyHtml(html: string): string {
  const t = html?.trim() ?? '';
  if (!t || t === '<p></p>' || t === '<p><br></p>') return '';
  return t;
}

export function ComposeForm({ onSent, onCancel }: ComposeFormProps) {
  const [toInput, setToInput] = useState('');
  const [toList, setToList] = useState<Array<{ id: string; type: 'user' | 'contact'; displayName: string; identifier: string }>>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuggestions('');
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchSuggestions(q: string) {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const res = await fetch(`/api/inbox/contacts/suggest?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSuggestions(toInput.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [toInput]);

  function addRecipient(s: SuggestionItem) {
    if (toList.some((r) => r.identifier === s.identifier || (r.type === 'user' && r.id === s.id))) return;
    setToList((prev) => [...prev, { id: s.id, type: s.type, displayName: s.displayName, identifier: s.identifier }]);
    setToInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeRecipient(identifier: string) {
    setToList((prev) => prev.filter((r) => r.identifier !== identifier));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = toInput.trim().toLowerCase();
      if (!v) return;
      const match = suggestions.find(
        (s) => s.identifier.toLowerCase() === v || s.displayName.toLowerCase().includes(v)
      );
      if (match) addRecipient(match);
      else {
        fetch(`/api/inbox/contacts/resolve?identifier=${encodeURIComponent(v)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.resolved) {
              addRecipient({
                type: data.resolved.type,
                id: data.resolved.id,
                displayName: v,
                identifier: v,
              });
            }
          })
          .catch(() => {});
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let recipients = [...toList];
    const pendingTo = toInput.trim();
    if (recipients.length === 0 && pendingTo) {
      try {
        const res = await fetch(`/api/inbox/contacts/resolve?identifier=${encodeURIComponent(pendingTo)}`);
        const data = await res.json();
        if (data.resolved) {
          recipients = [
            {
              id: data.resolved.id,
              type: data.resolved.type,
              displayName: pendingTo,
              identifier: pendingTo,
            },
          ];
        }
      } catch {
        // leave recipients empty so we show the validation error
      }
    }
    if (recipients.length === 0) {
      setError(
        pendingTo
          ? 'That email or username wasn\'t found. Use a registered user or pick from the suggestions.'
          : 'Add at least one recipient.'
      );
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/inbox/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients.map((r) => r.identifier),
          subject: subject.trim() || undefined,
          body: stripEmptyHtml(body) || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.error as string) ?? 'Failed to send.');
        setSending(false);
        return;
      }
      onSent({ id: data.id });
    } catch {
      setError('Something went wrong.');
    }
    setSending(false);
  }

  const availableSuggestions = suggestions
    .filter((s) => !toList.some((r) => r.identifier === s.identifier))
    .slice(0, 8);

  return (
    <Form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formBody}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.recipientInputWrap}>
          <div className={styles.recipientRow}>
            <Input
              ref={inputRef}
              label="To"
              type="text"
              placeholder="Enter username or email"
              value={toInput}
              onChange={(e) => {
                setToInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
            />
            {showSuggestions && (
              <div ref={suggestRef} className={styles.suggestionsList}>
                {availableSuggestions.length > 0 ? (
                  availableSuggestions.map((s) => (
                    <button
                      key={`${s.type}-${s.id}`}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => addRecipient(s)}
                    >
                      {s.displayName} ({s.identifier})
                    </button>
                  ))
                ) : (
                  <p className={styles.suggestionsEmpty}>No suggestions</p>
                )}
              </div>
            )}
          </div>
          {toList.length > 0 && (
            <div className={styles.recipientTags}>
              {toList.map((r) => (
                <span key={r.identifier} className={styles.recipientTag}>
                  {r.displayName}
                  <button
                    type="button"
                    className={styles.recipientTagRemove}
                    onClick={() => removeRecipient(r.identifier)}
                    aria-label={`Remove ${r.displayName}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className={styles.subjectInput}
        />
        <div className={styles.bodyInputWrap}>
          <span className={styles.label}>Message</span>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Write your message..."
            disabled={sending}
            className={styles.bodyInput}
            minHeight="200px"
          />
        </div>
      </div>
      <div className={styles.formActions}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" color="primary" disabled={sending}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </Form>
  );
}
