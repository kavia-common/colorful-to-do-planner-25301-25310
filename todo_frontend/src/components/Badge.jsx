import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Badge - Small pill-like label for status or category.
 * Props:
 * - children: React.ReactNode
 * - variant?: 'neutral'|'accent'|'success'|'error'|'secondary'
 * - size?: 'sm'|'md'
 * - className?: string
 * - 'data-testid'?: string
 * - title?: string (tooltip)
 */
export default function Badge({
  children,
  variant = 'accent',
  size = 'md',
  className = '',
  'data-testid': testId = 'badge',
  title,
  ...rest
}) {
  const classes = ['chip', 'badge', `badge--${variant}`, `badge--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} data-testid={testId} title={title} {...rest}>
      {children}
      <style jsx="true">{`
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          font-weight: 600;
          letter-spacing: 0.2px;
          border-radius: 9999px;
          line-height: 1;
        }
        .badge--sm { padding: 2px 8px; font-size: 11px; }
        .badge--md { padding: 4px 10px; font-size: 12px; }

        .badge--neutral {
          background: color-mix(in oklab, var(--color-text), white 90%);
          color: var(--color-text);
        }
        .badge--accent {
          background: color-mix(in oklab, var(--accent), white 80%);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--accent), black 85%);
        }
        .badge--secondary {
          background: color-mix(in oklab, var(--color-secondary), white 80%);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--color-secondary), black 85%);
        }
        .badge--success {
          background: color-mix(in oklab, var(--color-success), white 80%);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--color-success), black 85%);
        }
        .badge--error {
          background: color-mix(in oklab, var(--color-error), white 80%);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--color-error), black 85%);
        }
      `}</style>
    </span>
  );
}
