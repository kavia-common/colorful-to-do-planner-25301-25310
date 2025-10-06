import React, { useRef } from 'react';
import './index.css';
import './App.css';
import { TodoProvider, useTodo } from './context/TodoContext';
import Header from './components/Header';
import TaskInput from './components/TaskInput';
import Filters from './components/Filters';
import TaskList from './components/TaskList';
import SettingsPanel from './components/SettingsPanel';

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

  const closeSettings = () => actions.setSettingsOpen(false);

  return (
    <div className="app-root" data-testid="app-root">
      <Header />
      <main className="app-main" role="main" aria-label="To-do planner main content">
        <section
          className="app-section"
          aria-label="Task input"
          data-testid="task-input-section"
        >
          <TaskInput autoFocus />
        </section>

        <section
          className="app-section"
          aria-label="Filters and sort"
          data-testid="filters-section"
        >
          <Filters />
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
