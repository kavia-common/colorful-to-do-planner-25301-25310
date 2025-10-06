import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Button - Accessible, theme-aware button component.
 * Props:
 * - children: React.ReactNode
 * - onClick?: (e) => void
 * - disabled?: boolean
 * - variant?: 'primary'|'secondary'|'ghost'|'danger'
 * - size?: 'sm'|'md'|'lg'
 * - type?: 'button'|'submit'|'reset'
 * - className?: string
 * - data-testid?: string
 * - ariaLabel?: string
 */
export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  'data-testid': testId = 'button',
  ariaLabel,
  ...rest
}) {
  const classes = [
    'btn',
    'focus-ring',
    `btn--${variant}`,
    `btn--${size}`,
    disabled ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      data-testid={testId}
      {...rest}
    >
      {children}
      <style jsx="true">{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: var(--radius);
          padding: 10px 14px;
          font-weight: 700;
          letter-spacing: 0.2px;
          background: var(--accent);
          color: white;
          transition: transform 0.05s ease, box-shadow 0.2s ease, opacity .15s ease;
          cursor: pointer;
          user-select: none;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0px) scale(0.99); }
        .btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
        .btn--disabled,
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Variants */
        .btn--primary { background: var(--accent); color: #fff; }
        .btn--secondary {
          background: color-mix(in oklab, var(--color-secondary), white 10%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }
        .btn--ghost {
          background: transparent;
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--accent), black 85%);
        }
        .btn--danger {
          background: var(--color-error);
          color: #fff;
        }

        /* Sizes */
        .btn--sm { padding: 6px 10px; font-size: 12px; border-radius: 10px; }
        .btn--md { padding: 10px 14px; font-size: 14px; }
        .btn--lg { padding: 12px 18px; font-size: 16px; }
      `}</style>
    </button>
  );
}
