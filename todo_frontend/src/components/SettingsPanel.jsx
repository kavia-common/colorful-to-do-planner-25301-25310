import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Toggle from './Toggle';
import Button from './Button';
import { useTodo } from '../context/TodoContext';
import { theme as themeTokens } from '../assets/theme';

/**
 * PUBLIC_INTERFACE
 * SettingsPanel - Accessible modal dialog for UI customization.
 * Features:
 * - Theme toggle (light/dark)
 * - Accent color picker (primary, secondary, plus extra palette)
 * - Density option (comfortable/compact)
 * - Focus trap, ESC to close, click outside to close
 * - Returns focus to the trigger element when closed
 *
 * Props:
 * - open: boolean - whether the modal is visible
 * - onClose: () => void - called when the modal requests to close
 * - initialFocusRef?: React.RefObject<HTMLElement> - focus returned here when closing if provided
 * - data-testid?: string
 */
export default function SettingsPanel({
  open = false,
  onClose,
  initialFocusRef,
  'data-testid': testId = 'settings-panel',
}) {
  const { state, actions } = useTodo();

  // Local references for focus management
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Extract settings from context, providing fallbacks
  const isDark = state?.settings?.theme === 'dark';
  const accent = state?.settings?.accent ?? 'primary';
  const density = state?.settings?.density ?? 'comfortable';

  // Accent options from theme tokens; ensure unique CSS colors
  const accentOptions = useMemo(() => {
    const base = Array.isArray(themeTokens.accents) ? themeTokens.accents : ['primary', 'secondary'];
    const uniq = Array.from(new Set(base));
    return uniq;
  }, []);

  // Density options
  const densityOptions = [
    { key: 'comfortable', label: 'Comfortable' },
    { key: 'compact', label: 'Compact' },
  ];

  // Handlers update context and persist via TodoContext
  const onThemeToggle = useCallback(
    (nextPressed) => {
      actions.setTheme(nextPressed ? 'dark' : 'light');
    },
    [actions]
  );

  const onAccentChange = useCallback(
    (val) => {
      actions.setAccent(val);
    },
    [actions]
  );

  const onDensityChange = useCallback(
    (val) => {
      if (typeof actions.setDensity === 'function') {
        actions.setDensity(val);
      } else {
        // Fallback: edit settings via generic set in context when available later
        actions.__setDensity?.(val);
      }
    },
    [actions]
  );

  const requestClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  // Close on ESC; trap within modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      } else if (e.key === 'Tab') {
        // Basic focus trap if we have sentinels
        const active = document.activeElement;
        const first = firstFocusableRef.current;
        const last = lastFocusableRef.current;

        if (!first || !last) return;

        if (e.shiftKey) {
          // Shift+Tab on first should wrap to last
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab on last should wrap to first
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, requestClose]);

  // Focus the dialog on open for screen readers
  useEffect(() => {
    if (!open) return;
    // find first interactive control
    const dialog = dialogRef.current;
    if (dialog) {
      // Focus the panel itself to announce dialog
      dialog.focus();
      // Try to move focus to the first real focusable element shortly after
      const to = setTimeout(() => {
        const focusables = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          /** @type {HTMLElement} */ (focusables[0]).focus();
        }
      }, 10);
      return () => clearTimeout(to);
    }
  }, [open]);

  // Return focus to the trigger when closed
  useEffect(() => {
    if (open) return;
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
  }, [open, initialFocusRef]);

  // Click outside to close
  const onOverlayMouseDown = useCallback((e) => {
    if (e.target === overlayRef.current) {
      requestClose();
    }
  }, [requestClose]);

  if (!open) return null;

  const dialogTitleId = `${testId}-title`;
  const dialogDescId = `${testId}-desc`;

  return (
    <div
      ref={overlayRef}
      className="settings-overlay"
      onMouseDown={onOverlayMouseDown}
      data-testid={`${testId}-overlay`}
      aria-hidden={false}
    >
      {/* Sentinels for basic focus trap */}
      <button
        ref={firstFocusableRef}
        className="sr-only-focus-sentinel"
        aria-hidden="true"
        tabIndex={0}
        data-testid={`${testId}-sentinel-start`}
        onFocus={() => {
          // Redirect to first real control inside dialog
          if (dialogRef.current) {
            const focusables = dialogRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusables.length > 0) {
              /** @type {HTMLElement} */ (focusables[0]).focus();
            } else {
              dialogRef.current.focus();
            }
          }
        }}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        tabIndex={-1}
        className="settings-dialog card"
        data-testid={testId}
      >
        <header className="settings-header gradient-header">
          <h2 id={dialogTitleId} className="settings-title">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestClose}
            ariaLabel="Close settings"
            data-testid={`${testId}-close`}
          >
            Close
          </Button>
        </header>

        <div className="settings-body">
          <p id={dialogDescId} className="settings-desc">
            Customize your experience. Changes are saved automatically.
          </p>

          {/* Theme */}
          <div className="setting-row" data-testid={`${testId}-theme-row`}>
            <div className="setting-labels">
              <div className="setting-title">Theme</div>
              <div className="setting-help">Switch between light and dark mode.</div>
            </div>
            <div className="setting-control">
              <div className="toggle-wrap" title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
                <Toggle
                  pressed={isDark}
                  onChange={onThemeToggle}
                  size="md"
                  className="focus-ring"
                  ariaLabel={`Toggle theme. Current: ${isDark ? 'dark' : 'light'}`}
                  data-testid="settings-theme-toggle"
                />
                <span className="toggle-label" aria-hidden="true">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          </div>

          {/* Accent */}
          <div className="setting-row" data-testid={`${testId}-accent-row`}>
            <div className="setting-labels">
              <div className="setting-title">Accent color</div>
              <div className="setting-help">Choose a highlight color for buttons and accents.</div>
            </div>
            <div className="setting-control">
              <div className="swatch-list" role="list" aria-label="Accent options" data-testid="accent-options">
                {accentOptions.map((opt) => {
                  const value = opt;
                  const isToken = value === 'primary' || value === 'secondary';
                  const color =
                    value === 'primary'
                      ? 'var(--color-primary)'
                      : value === 'secondary'
                      ? 'var(--color-secondary)'
                      : value;
                  const selected = accent === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="listitem"
                      className={['swatch', selected ? 'is-selected focus-ring' : ''].join(' ')}
                      style={{ '--swatch-color': color }}
                      aria-pressed={selected}
                      aria-label={isToken ? value : `custom ${value}`}
                      title={isToken ? value : value}
                      data-testid={`accent-${value}`}
                      onClick={() => onAccentChange(value)}
                    >
                      {selected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Density */}
          <div className="setting-row" data-testid={`${testId}-density-row`}>
            <div className="setting-labels">
              <div className="setting-title">Density</div>
              <div className="setting-help">Adjust spacing of controls and lists.</div>
            </div>
            <div className="setting-control">
              <div className="density-group" role="group" aria-label="Density options">
                {densityOptions.map((d) => {
                  const selected = density === d.key;
                  return (
                    <Button
                      key={d.key}
                      variant={selected ? 'primary' : 'ghost'}
                      size="sm"
                      ariaLabel={`${d.label} layout`}
                      data-testid={`density-${d.key}`}
                      onClick={() => onDensityChange(d.key)}
                      className={selected ? '' : 'focus-ring'}
                    >
                      {d.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <button
        ref={lastFocusableRef}
        className="sr-only-focus-sentinel"
        aria-hidden="true"
        tabIndex={0}
        data-testid={`${testId}-sentinel-end`}
        onFocus={() => {
          // Redirect back to the dialog first focusable
          if (dialogRef.current) {
            const focusables = dialogRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusables.length > 0) {
              /** @type {HTMLElement} */ (focusables[focusables.length - 1]).focus();
            } else {
              dialogRef.current.focus();
            }
          }
        }}
      />

      <style jsx="true">{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: grid;
          place-items: center;
          z-index: 100;
        }
        .settings-dialog {
          width: min(720px, 94vw);
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--accent), black 88%);
          border-radius: var(--radius);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
          outline: none;
        }
        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
        }
        .settings-title {
          margin: 0;
          font-size: 18px;
          letter-spacing: 0.2px;
        }
        .settings-body {
          padding: 14px;
          display: grid;
          gap: 14px;
        }
        .settings-desc {
          margin: 0 0 8px;
          color: color-mix(in oklab, var(--color-text), white 20%);
        }
        .setting-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid color-mix(in oklab, var(--accent), black 92%);
          border-radius: 12px;
          background: color-mix(in oklab, var(--accent), white 96%);
        }
        .setting-labels {
          display: grid;
          gap: 6px;
        }
        .setting-title {
          font-weight: 800;
        }
        .setting-help {
          font-size: 12px;
          color: color-mix(in oklab, var(--color-text), white 25%);
        }
        .setting-control {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-content: flex-end;
        }

        .toggle-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: var(--radius);
          background: color-mix(in oklab, var(--accent), white 88%);
          border: 1px solid color-mix(in oklab, var(--accent), black 88%);
        }
        .toggle-label {
          font-size: 12px;
          font-weight: 700;
          user-select: none;
        }

        .swatch-list {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .swatch {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: 2px solid color-mix(in oklab, var(--accent), black 80%);
          background: var(--swatch-color);
          color: #fff;
          font-size: 14px;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
        }
        .swatch.is-selected {
          box-shadow: var(--focus-ring);
        }

        .density-group {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Screen reader only buttons used for focus trap sentinels */
        .sr-only-focus-sentinel {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
          background: transparent;
        }

        @media (max-width: 640px) {
          .setting-row {
            grid-template-columns: 1fr;
          }
          .setting-control {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
