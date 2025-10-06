import React, { useCallback } from 'react';
import Toggle from './Toggle';
import { useTodo } from '../context/TodoContext';

/**
 * PUBLIC_INTERFACE
 * Header - Top navigation bar with app title, theme toggle, and settings entry.
 * - Displays "Colorful To-Do" as the title.
 * - Theme toggle uses Toggle primitive and reflects dark/light based on context.settings.theme.
 * - Settings button triggers opening of SettingsPanel via context action.
 *
 * Accessibility:
 * - Keyboard accessible controls
 * - Visible focus styles via .focus-ring and --focus-ring token
 * - Proper aria-labels and aria-pressed for toggle
 *
 * Data-testid attributes:
 * - header: 'header'
 * - theme toggle: 'theme-toggle'
 * - settings button: 'settings-button'
 */
export default function Header() {
  const { state, actions, dispatch } = useTodo();
  const isDark = state?.settings?.theme === 'dark';

  // Toggle theme between 'light' and 'dark' using context action
  const onThemeToggle = useCallback(
    (next) => {
      actions.setTheme(next ? 'dark' : 'light');
    },
    [actions]
  );

  // Open settings panel via a context-friendly action
  // If a specific action does not exist yet, we dispatch a generic event consumers can handle.
  const openSettings = useCallback(() => {
    // Prefer an explicit action if it exists in actions; fallback to dispatching a known type.
    if (typeof actions.setSettingsOpen === 'function') {
      actions.setSettingsOpen(true);
    } else {
      // Fallback: dispatch an action type that a future reducer can handle
      dispatch({ type: 'OPEN_SETTINGS', payload: true });
    }
  }, [actions, dispatch]);

  return (
    <header
      className="app-header gradient-header"
      data-testid="header"
      role="banner"
    >
      <div className="header-inner">
        <h1 className="app-title" title="Colorful To-Do">
          Colorful To-Do
        </h1>

        <div className="header-actions">
          <div className="theme-toggle-wrap" title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
            <Toggle
              pressed={isDark}
              onChange={onThemeToggle}
              size="md"
              className="focus-ring"
              ariaLabel={`Toggle theme. Current: ${isDark ? 'dark' : 'light'}`}
              data-testid="theme-toggle"
            />
            <span className="toggle-label" aria-hidden="true">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </div>

          <button
            type="button"
            className="settings-btn focus-ring"
            onClick={openSettings}
            aria-label="Open settings"
            data-testid="settings-button"
          >
            <span className="settings-icon" aria-hidden="true">⚙️</span>
            <span className="settings-text">Settings</span>
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .app-header {
          width: 100%;
          color: var(--color-text);
          position: sticky;
          top: 0;
          z-index: 10;
          /* gradient provided by .gradient-header utility */
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .app-title {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
          letter-spacing: 0.2px;
          color: var(--color-text);
        }
        .header-actions {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }

        .theme-toggle-wrap {
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
          color: var(--color-text);
          user-select: none;
        }

        .settings-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid color-mix(in oklab, var(--accent), black 90%);
          border-radius: var(--radius);
          cursor: pointer;
          transition: transform 0.05s ease, box-shadow 0.2s ease, background 0.2s ease, opacity .15s ease;
        }
        .settings-btn:hover { transform: translateY(-1px); }
        .settings-btn:active { transform: translateY(0px) scale(0.99); }
        .settings-icon {
          width: 18px;
          height: 18px;
          display: inline-grid;
          place-items: center;
        }
        .settings-text {
          font-weight: 700;
          letter-spacing: 0.2px;
          font-size: 14px;
        }

        /* Make sure focus is visible */
        .focus-ring:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        @media (max-width: 640px) {
          .header-inner { padding: 12px; }
          .settings-text { display: none; }
        }
      `}</style>
    </header>
  );
}
