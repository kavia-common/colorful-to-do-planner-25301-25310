import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTodo } from '../context/TodoContext';
import Badge from './Badge';
import Toggle from './Toggle';
import Button from './Button';
import { isOverdue, isToday, parseDate } from '../utils/date';

/**
 * PUBLIC_INTERFACE
 * TaskItem - A single task row with accessible checkbox, inline title editing,
 * due date chip, and action buttons.
 *
 * Props:
 * - task: {
 *     id: string,
 *     title: string,
 *     notes?: string,
 *     completed: boolean,
 *     category?: string,
 *     createdAt: string,
 *     dueDate?: string
 *   }
 * - className?: string
 * - 'data-testid'?: string
 *
 * Accessibility:
 * - role="listitem" on root.
 * - Checkbox is a Toggle with role button and aria-pressed to act as a switch/checkbox.
 *   We also add aria-checked on a wrapping control for clarity.
 * - Label association via htmlFor and id for input when in edit mode.
 * - Keyboard interactions:
 *   - Space toggles completion when not editing
 *   - Enter saves when editing
 *   - Esc cancels editing
 * - Buttons for Edit/Delete with aria-labels.
 */
export default function TaskItem({
  task,
  className = '',
  'data-testid': testId = 'task-item',
}) {
  const { actions } = useTodo();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task?.title || '');
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const editBtnRef = useRef(null);

  // Compute due badge state
  const dueInfo = useMemo(() => {
    if (!task?.dueDate) return null;
    const d = parseDate(task.dueDate);
    if (!d) return null;
    const overdue = isOverdue(d);
    const today = isToday(d);
    const formatted = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    return {
      text: today ? `Due Today (${formatted})` : (overdue ? `Overdue (${formatted})` : `Due ${formatted}`),
      variant: overdue ? 'error' : (today ? 'success' : 'secondary'),
      title: d.toDateString(),
    };
  }, [task?.dueDate]);

  // Start editing on double click
  const startEdit = useCallback(() => {
    setDraft(task?.title || '');
    setIsEditing(true);
  }, [task?.title]);

  // Focus management when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const cancelEdit = useCallback(() => {
    setDraft(task?.title || '');
    setIsEditing(false);
    // Return focus to edit button for good a11y flow
    if (editBtnRef.current) editBtnRef.current.focus();
  }, [task?.title]);

  const saveEdit = useCallback(() => {
    const nextTitle = (draft || '').trim();
    if (!nextTitle) {
      // If title was cleared, do not commit empty title; just cancel
      cancelEdit();
      return;
    }
    if (nextTitle !== task.title) {
      actions.editTask(task.id, { title: nextTitle });
    }
    setIsEditing(false);
    if (editBtnRef.current) editBtnRef.current.focus();
  }, [actions, cancelEdit, draft, task.id, task.title]);

  // Toggle complete
  const toggle = useCallback(() => {
    actions.toggleTask(task.id);
  }, [actions, task.id]);

  // Delete
  const remove = useCallback(() => {
    actions.deleteTask(task.id);
  }, [actions, task.id]);

  // Keyboard handlers at row level for quicker interactions
  const onKeyDown = useCallback((e) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
      return;
    }
    // Not editing:
    if (e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }, [isEditing, saveEdit, cancelEdit, toggle]);

  const labelId = `${testId}-${task.id}-label`;
  const inputId = `${testId}-${task.id}-input`;

  const classes = [
    'task-item',
    'card',
    className,
    task.completed ? 'is-completed' : '',
  ].filter(Boolean).join(' ');

  return (
    <li
      ref={rootRef}
      role="listitem"
      aria-labelledby={labelId}
      className={classes}
      onKeyDown={onKeyDown}
      data-testid={testId}
    >
      <div className="left">
        {/* Accessible checkbox/switch control */}
        <div
          className="checkbox-wrap"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={task.completed ? 'Mark as not completed' : 'Mark as completed'}
          data-testid={`${testId}-checkbox`}
        >
          <Toggle
            pressed={task.completed}
            onChange={toggle}
            size="md"
            ariaLabel={task.completed ? 'Mark as not completed' : 'Mark as completed'}
          />
        </div>

        {/* Title or input */}
        {!isEditing ? (
          <button
            type="button"
            className="title-btn focus-ring"
            onDoubleClick={startEdit}
            onClick={() => { /* not toggling on single click to avoid acc conflicts */ }}
            aria-labelledby={labelId}
            data-testid={`${testId}-title-button`}
          >
            <span
              id={labelId}
              className={['title', task.completed ? 'line' : ''].filter(Boolean).join(' ')}
            >
              {task.title}
            </span>
          </button>
        ) : (
          <div className="edit-wrap">
            <label className="sr-only" htmlFor={inputId}>Edit task title</label>
            <input
              id={inputId}
              ref={inputRef}
              className="input edit-input focus-ring"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              data-testid={`${testId}-title-input`}
            />
            <div className="edit-actions">
              <Button
                variant="primary"
                size="sm"
                onClick={saveEdit}
                ariaLabel="Save title"
                data-testid={`${testId}-save`}
              >Save</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                ariaLabel="Cancel edit"
                data-testid={`${testId}-cancel`}
              >Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="right">
        {task.category ? (
          <Badge
            size="sm"
            variant="accent"
            title={`Category: ${task.category}`}
            data-testid={`${testId}-category`}
          >
            {task.category}
          </Badge>
        ) : null}
        {dueInfo ? (
          <Badge
            size="sm"
            variant={dueInfo.variant}
            title={dueInfo.title}
            data-testid={`${testId}-due`}
          >
            {dueInfo.text}
          </Badge>
        ) : null}

        {!isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="focus-ring"
              onClick={startEdit}
              ariaLabel="Edit task title"
              data-testid={`${testId}-edit`}
              ref={editBtnRef}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="focus-ring"
              onClick={remove}
              ariaLabel={`Delete ${task.title}`}
              data-testid={`${testId}-delete`}
            >
              Delete
            </Button>
          </>
        ) : null}
      </div>

      <style jsx="true">{`
        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          margin-bottom: 10px;
          background: var(--color-surface);
          border: 1px solid color-mix(in oklab, var(--accent), black 90%);
          border-radius: var(--radius);
          gap: 12px;
        }
        .left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .checkbox-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .title-btn {
          border: none;
          background: transparent;
          color: var(--color-text);
          text-align: left;
          padding: 6px 6px;
          cursor: text;
          border-radius: 8px;
          max-width: 100%;
        }
        .title {
          font-weight: 700;
          letter-spacing: 0.2px;
          word-break: break-word;
        }
        .title.line {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .edit-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .edit-input {
          flex: 1 1 auto;
          min-width: 140px;
        }
        .edit-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .right {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* Visually hidden for screen reader text */
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
      `}</style>
    </li>
  );
}
