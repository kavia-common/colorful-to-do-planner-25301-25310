import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTodo } from '../context/TodoContext';
import { generateId } from '../utils/id';

/**
 * PUBLIC_INTERFACE
 * TaskInput - Accessible input form for adding new tasks.
 * - Text input for task title (required)
 * - Optional due date (native <input type="date">)
 * - Category picker from available categories, with "None" option
 * - Press Enter to add; Esc clears input
 * - Announces add confirmations via aria-live polite region
 * - Provides data-testid attributes for test automation
 *
 * Props:
 * - placeholder?: string (placeholder text for task title)
 * - autoFocus?: boolean
 * - className?: string
 * - 'data-testid'?: string
 */
export default function TaskInput({
  placeholder = 'Add a task...',
  autoFocus = false,
  className = '',
  'data-testid': testId = 'task-input',
  inputRef: externalInputRef,
}) {
  const { state, actions } = useTodo();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [category, setCategory] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;
  const liveRef = useRef(null);

  const categories = state?.categories || [];

  // Memoized category options including a "None" option
  const categoryOptions = useMemo(() => {
    return [''].concat(categories);
  }, [categories]);

  // Focus management for a11y
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const clearForm = useCallback(() => {
    setTitle('');
    setDue('');
    setCategory('');
  }, []);

  const canSubmit = title.trim().length > 0;

  const buildTask = useCallback(() => {
    const nowIso = new Date().toISOString();
    /** @type {import('../context/TodoContext').Task} */
    const task = {
      id: generateId(),
      title: title.trim(),
      notes: '',
      completed: false,
      category: category || undefined,
      createdAt: nowIso,
      dueDate: due ? new Date(due).toISOString() : undefined,
    };
    return task;
  }, [title, category, due]);

  const submit = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (!canSubmit) return;
      const task = buildTask();
      actions.addTask(task);

      // Announce addition for screen readers
      const parts = [`Added "${task.title}"`];
      if (task.category) parts.push(`in ${task.category}`);
      if (task.dueDate) parts.push(`due ${new Date(task.dueDate).toDateString()}`);
      const msg = parts.join(', ');
      setAnnouncement(msg);

      clearForm();
      // Return focus to input after submission for fast entry
      if (inputRef.current) inputRef.current.focus();
    },
    [actions, buildTask, canSubmit, clearForm]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        // Allow Enter to submit anywhere inside the form
        submit(e);
      } else if (e.key === 'Escape') {
        // Esc clears input and returns focus to title field
        clearForm();
        if (inputRef.current) inputRef.current.focus();
      }
    },
    [submit, clearForm]
  );

  return (
    <form
      onSubmit={submit}
      onKeyDown={onKeyDown}
      className={['task-input', 'card', className].filter(Boolean).join(' ')}
      aria-labelledby={`${testId}-label`}
      data-testid={testId}
    >
      <div className="row">
        <label id={`${testId}-label`} className="sr-only" htmlFor={`${testId}-title`}>
          Add a task
        </label>
        <input
          id={`${testId}-title`}
          ref={inputRef}
          className="input title-input focus-ring"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          aria-label="Task title"
          data-testid={`${testId}-title`}
        />

        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor={`${testId}-due`}>Due</label>
            <input
              id={`${testId}-due`}
              className="input date-input focus-ring"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Due date"
              data-testid={`${testId}-due`}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor={`${testId}-category`}>Category</label>
            <select
              id={`${testId}-category`}
              className="input select-input focus-ring"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
              data-testid={`${testId}-category`}
            >
              {categoryOptions.map((opt) => (
                <option key={opt || 'none'} value={opt}>
                  {opt ? opt : 'None'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn add-btn focus-ring"
            disabled={!canSubmit}
            aria-disabled={!canSubmit || undefined}
            aria-label="Add task"
            data-testid={`${testId}-add`}
            title="Add task (Enter)"
          >
            Add
          </button>
        </div>
      </div>

      {/* Aria live region for polite announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid={`${testId}-live`}
        ref={liveRef}
      >
        {announcement}
      </div>

      <style jsx="true">{`
        .task-input {
          padding: 12px;
          margin: 8px 0 16px;
          background: var(--color-surface);
          border: 1px solid color-mix(in oklab, var(--accent), black 90%);
          border-radius: var(--radius);
        }
        .row {
          display: flex;
          align-items: stretch;
          gap: 10px;
          flex-wrap: wrap;
        }
        .title-input {
          flex: 1 1 280px;
          min-width: 220px;
        }
        .controls {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 700;
          color: color-mix(in oklab, var(--color-text), white 15%);
          padding-left: 2px;
          user-select: none;
        }
        .date-input, .select-input {
          min-width: 150px;
        }
        .add-btn {
          white-space: nowrap;
          font-weight: 800;
        }
        /* Visually hidden utility for screen-reader only content */
        .sr-only {
          border: 0 !important;
          clip: rect(1px, 1px, 1px, 1px) !important;
          -webkit-clip-path: inset(50%) !important;
          clip-path: inset(50%) !important;
          height: 1px !important;
          margin: -1px !important;
          overflow: hidden !important;
          padding: 0 !important;
          position: absolute !important;
          width: 1px !important;
          word-wrap: normal !important;
        }

        @media (max-width: 640px) {
          .controls { width: 100%; }
          .add-btn { width: 100%; }
        }
      `}</style>
    </form>
  );
}
