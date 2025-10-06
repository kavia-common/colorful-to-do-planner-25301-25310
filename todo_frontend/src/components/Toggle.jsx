import React, { useCallback } from 'react';

/**
 * PUBLIC_INTERFACE
 * Toggle - A11y-friendly toggle button/switch.
 * Props:
 * - pressed: boolean (controlled)
 * - onChange: (next: boolean) => void
 * - disabled?: boolean
 * - size?: 'sm'|'md'|'lg'
 * - className?: string
 * - 'data-testid'?: string
 * - ariaLabel?: string
 */
export default function Toggle({
  pressed = false,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  'data-testid': testId = 'toggle',
  ariaLabel,
  ...rest
}) {
  const handleClick = useCallback(
    (e) => {
      if (disabled) return;
      if (typeof onChange === 'function') onChange(!pressed);
    },
    [disabled, onChange, pressed]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (typeof onChange === 'function') onChange(!pressed);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (typeof onChange === 'function') onChange(false);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (typeof onChange === 'function') onChange(true);
      }
    },
    [disabled, onChange, pressed]
  );

  const classes = [
    'toggle',
    `toggle--${size}`,
    pressed ? 'is-on' : 'is-off',
    disabled ? 'is-disabled' : '',
    'focus-ring',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="button"
      aria-pressed={pressed}
      aria-label={ariaLabel || 'Toggle'}
      tabIndex={disabled ? -1 : 0}
      className={classes}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      data-testid={testId}
      {...rest}
    >
      <div className="knob" aria-hidden="true" />
      <style jsx="true">{`
        .toggle {
          display: inline-flex;
          align-items: center;
          position: relative;
          border-radius: 9999px;
          background: color-mix(in oklab, var(--accent), white 75%);
          border: 1px solid color-mix(in oklab, var(--accent), black 85%);
          transition: background 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        .toggle:focus-visible { outline: none; box-shadow: var(--focus-ring); }
        .toggle.is-disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .toggle.is-on {
          background: color-mix(in oklab, var(--accent), white 60%);
        }
        .toggle .knob {
          position: absolute;
          top: 2px;
          left: 2px;
          border-radius: 9999px;
          background: var(--color-surface);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .toggle.is-on .knob {
          background: #fff;
        }

        /* Sizes */
        .toggle--sm { width: 34px; height: 20px; }
        .toggle--sm .knob { width: 16px; height: 16px; }
        .toggle--md { width: 44px; height: 26px; }
        .toggle--md .knob { width: 22px; height: 22px; }
        .toggle--lg { width: 56px; height: 32px; }
        .toggle--lg .knob { width: 28px; height: 28px; }

        /* Knob translation */
        .toggle--sm.is-on .knob { transform: translateX(14px); }
        .toggle--md.is-on .knob { transform: translateX(18px); }
        .toggle--lg.is-on .knob { transform: translateX(24px); }
      `}</style>
    </div>
  );
}
