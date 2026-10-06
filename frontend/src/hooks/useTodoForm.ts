import { useState, type FormEvent } from 'react';

/** Controlled "new todo" form state. */
export function useTodoForm(onAdd: (title: string) => Promise<boolean>) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onAdd(title);
    setSubmitting(false);
    if (ok) setTitle('');
  }

  return { title, setTitle, submitting, canSubmit: title.trim().length > 0, handleSubmit };
}
