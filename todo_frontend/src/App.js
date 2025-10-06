import React, { useCallback, useRef } from 'react';
import './index.css';
import './App.css';
import { TodoProvider, useTodo } from './context/TodoContext';
import Header from './components/Header';
import TaskInput from './components/TaskInput';
import Filters from './components/Filters';
import TaskList from './components/TaskList';
import SettingsPanel from './components/SettingsPanel';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

// PUBLIC_INTERFACE
export default function App() {
  /** App wraps the UI in TodoProvider to supply state, actions, and selectors.
   * It also ensures the document has theme attributes set by the provider and
   * renders the main layout: Header, TaskInput, Filters, TaskList, and SettingsPanel.
   */
  return (
    <TodoProvider>
      <AppShell />
    </TodoProvider>
  );
}

/**
 * Internal component to consume context and render the main application shell.
 * Adds proper landmarks and data-testid attributes for testing.
 */
function AppShell() {
  const { state, actions } = useTodo();
  const settingsBtnRef = useRef(null);
  const taskTitleInputRef = useRef(null);
  const filtersRootRef = useRef(null);

  // Ensure data-theme/data-accent/data-density are reflected on documentElement.
  // Most of this is already handled by TodoProvider via applyTheme(), but we add
  // a defensive application here in case the provider code changes.
  try {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') !== state.settings.theme) {
      root.setAttribute('data-theme', state.settings.theme);
    }
    if (root.style.getPropertyValue('--accent') === '') {
      // Accent is set in applyTheme; keep a light fallback to primary token.
      root.style.setProperty('--accent', 'var(--color-primary)');
    }
    const density = state.settings?.density || 'comfortable';
    if (root.getAttribute('data-density') !== density) {
      root.setAttribute('data-density', density);
    }
  } catch (_e) {
    // Non-browser environment, ignore
  }

  const closeSettings = useCallback(() => actions.setSettingsOpen(false), [actions]);

  // Handlers wired for keyboard shortcuts
  const handleAddTask = useCallback(() => {
    // Prefer submitting the TaskInput form if focused; otherwise move focus to the task input
    const el = taskTitleInputRef.current;
    if (el) {
      // If there is text in the input, simulate Enter by dispatching a submit event on the form
      // Otherwise, focus the input so the user can type
      if (el.value && el.value.trim().length > 0) {
        // Find the surrounding form and submit it
        const form = el.closest('form');
        if (form) {
          form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return;
        }
      }
      el.focus();
    }
  }, []);

  const handleCancelOrClose = useCallback(() => {
    // If settings are open, close them; otherwise, do nothing here since TaskItem handles its own Esc
    if (state.settingsOpen) {
      closeSettings();
    }
  }, [state.settingsOpen, closeSettings]);

  const handleFocusFilters = useCallback(() => {
    const node = filtersRootRef.current;
    if (node) {
      // Focus the first interactive control inside Filters (tab or select)
      const focusables = node.querySelectorAll('button[role="tab"], select, button, [tabindex]:not([tabindex="-1"])');
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        node.focus?.();
      }
    }
  }, []);

  const handleToggleHelp = useCallback(() => {
    // Optional: Toggle a help tooltip. For now, announce instructions in the console.
    // Could be extended with in-UI tooltip component.
    // eslint-disable-next-line no-console
    console.info('[Help] Shortcuts: Enter (add task), Esc (cancel/close), Ctrl/Cmd+F (focus filters), ? (help).');
  }, []);

  // Install global shortcuts
  useKeyboardShortcuts(
    {
      addTask: handleAddTask,
      cancelEdit: undefined, // TaskItem and TaskInput manage Esc locally; keep closeSettings for global Esc
      closeSettings: handleCancelOrClose,
      focusFilters: handleFocusFilters,
      toggleHelp: handleToggleHelp,
      enabled: true,
    },
    [handleAddTask, handleCancelOrClose, handleFocusFilters, handleToggleHelp, state.settingsOpen]
  );

  return (
    <div className="app-root" data-testid="app-root">
      <Header />
      <main className="app-main" role="main" aria-label="To-do planner main content">
        <section
          className="app-section"
          aria-label="Task input"
          data-testid="task-input-section"
        >
          <TaskInput autoFocus inputRef={taskTitleInputRef} />
        </section>

        <section
          className="app-section"
          aria-label="Filters and sort"
          data-testid="filters-section"
        >
          <Filters rootRef={filtersRootRef} />
        </section>

        <section
          className="app-section"
          aria-label="Task lists"
          data-testid="tasklist-section"
        >
          <TaskList />
        </section>
      </main>

      <SettingsPanel
        open={Boolean(state.settingsOpen)}
        onClose={closeSettings}
        initialFocusRef={settingsBtnRef}
        data-testid="settings-panel"
      />
    </div>
  );
}
