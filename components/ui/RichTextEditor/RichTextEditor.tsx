'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './RichTextEditor.module.scss';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minimum height of the editor area (e.g. '120px' or '6rem') */
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
      handleDOMEvents: {
        paste(view, event) {
          // Strip formatting on paste to avoid pasting huge HTML
          const text = event.clipboardData?.getData('text/plain');
          if (text) {
            event.preventDefault();
            const { state } = view;
            const tr = state.tr.insertText(text);
            view.dispatch(tr);
            return true;
          }
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external reset (e.g. form clear) into editor
  useEffect(() => {
    if (!editor) return;
    if (value === '') {
      const current = editor.getHTML();
      if (current !== '<p></p>' && current !== '') {
        editor.commands.setContent('', { emitUpdate: false });
      }
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const wrapperClass = [styles.wrapper, className].filter(Boolean).join(' ');

  if (!editor) {
    return (
      <div className={wrapperClass} style={{ minHeight }}>
        <div className={styles.editorSkeleton} />
      </div>
    );
  }

  return (
    <div className={wrapperClass} style={{ minHeight }}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={editor.isActive('bold') ? styles.toolbarBtnActive : styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-pressed={editor.isActive('bold')}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? styles.toolbarBtnActive : styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-pressed={editor.isActive('italic')}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          className={editor.isActive('strike') ? styles.toolbarBtnActive : styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          aria-pressed={editor.isActive('strike')}
          title="Strikethrough"
        >
          S
        </button>
        <button
          type="button"
          className={editor.isActive('bulletList') ? styles.toolbarBtnActive : styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          aria-pressed={editor.isActive('bulletList')}
          title="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          className={editor.isActive('orderedList') ? styles.toolbarBtnActive : styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          aria-pressed={editor.isActive('orderedList')}
          title="Numbered list"
        >
          1.
        </button>
      </div>
      <div className={styles.editorWrap}>
        <EditorContent editor={editor} className={styles.editorContent} />
      </div>
    </div>
  );
}
