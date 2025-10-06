import React from 'react';
import Button from './Button';

/**
 * PUBLIC_INTERFACE
 * EmptyState - Friendly empty state with title, description, optional icon and actions.
 * Props:
 * - title: string
 * - description?: string
 * - icon?: React.ReactNode
 * - actions?: React.ReactNode (e.g., Buttons)
 * - className?: string
 * - 'data-testid'?: string
 * - ariaDescribedById?: string (optional id for external description linkage)
 */
export default function EmptyState({
  title,
  description,
  icon,
  actions,
  className = '',
  'data-testid': testId = 'empty-state',
  ariaDescribedById,
  ...rest
}) {
  return (
    <section
      role="region"
      aria-labelledby={`${testId}-title`}
      aria-describedby={ariaDescribedById || (description ? `${testId}-desc` : undefined)}
      className={['empty-state', className].filter(Boolean).join(' ')}
      data-testid={testId}
      {...rest}
    >
      <div className="empty-card card gradient-header">
        {icon ? <div className="empty-icon" aria-hidden="true">{icon}</div> : null}
        <h2 id={`${testId}-title`} className="empty-title">{title}</h2>
        {description ? (
          <p id={`${testId}-desc`} className="empty-desc">
            {description}
          </p>
        ) : null}
        {actions ? (
          <div className="empty-actions">
            {actions}
          </div>
        ) : (
          <div className="empty-actions">
            <Button variant="primary" size="md" data-testid={`${testId}-cta`}>
              Get started
            </Button>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .empty-state {
          width: 100%;
          display: grid;
          place-items: center;
          padding: 32px;
        }
        .empty-card {
          width: min(680px, 92vw);
          padding: 28px;
          border-radius: var(--radius);
          color: var(--color-text);
          box-shadow: var(--shadow);
          text-align: center;
        }
        .empty-icon {
          width: 64px;
          height: 64px;
          display: inline-grid;
          place-items: center;
          border-radius: 18px;
          margin: 0 auto 12px;
          background: color-mix(in oklab, var(--accent), white 70%);
          color: var(--color-text);
        }
        .empty-title {
          margin: 8px 0 6px;
          font-size: 22px;
        }
        .empty-desc {
          margin: 0 auto 18px;
          max-width: 52ch;
          color: color-mix(in oklab, var(--color-text), white 25%);
        }
        .empty-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </section>
  );
}
