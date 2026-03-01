'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Input, Textarea } from '@/components/ui';
import { X } from 'lucide-react';
import styles from './ComposeModal.module.scss';

export type SuggestionItem = {
  type: 'user' | 'contact';
  id: string;
  displayName: string;
  identifier: string;
  contactState?: 'default' | 'friend' | 'favoriteFriend';
};

export interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function ComposeModal({ open, onClose, onSent }: ComposeModalProps) {
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
    if (!open) {
      setToInput('');
      setToList([]);
      setSubject('');
      setBody('');
      setError(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetchSuggestions('');
  }, [open]);

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
    if (!open) return;
    const t = setTimeout(() => {
      fetchSuggestions(toInput.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [toInput, open]);

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
          body: body.trim() || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.error as string) ?? 'Failed to send.');
        setSending(false);
        return;
      }
      onSent();
      onClose();
    } catch {
      setError('Something went wrong.');
    }
    setSending(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="New message">
      <Form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.modalBody}>
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
                {showSuggestions && suggestions.length > 0 && (
                  <div ref={suggestRef} className={styles.suggestionsList}>
                    {suggestions
                      .filter((s) => !toList.some((r) => r.identifier === s.identifier))
                      .slice(0, 8)
                      .map((s) => (
                        <button
                          key={`${s.type}-${s.id}`}
                          type="button"
                          className={styles.suggestionItem}
                          onClick={() => addRecipient(s)}
                        >
                          {s.displayName} ({s.identifier})
                          {s.contactState === 'favoriteFriend' && (
                            <span className={styles.suggestionBadge} title="Favorite friend">★</span>
                          )}
                          {s.contactState === 'friend' && (
                            <span className={styles.suggestionBadge} title="Friend">Friend</span>
                          )}
                        </button>
                      ))}
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
            <Textarea
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className={styles.bodyInput}
            />
          </div>
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
        </div>
      </Form>
    </Modal>
  );
}
