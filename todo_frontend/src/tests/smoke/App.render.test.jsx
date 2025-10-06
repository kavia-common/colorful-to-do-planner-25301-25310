import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import App from '../../App';

/**
 * Smoke test for the main App component.
 * Verifies that core UI elements render and basic interaction for adding a task works.
 *
 * Notes:
 * - Uses CRA default test setup with @testing-library/react and jest-dom.
 * - Avoids any external environment variables or dependencies.
 */
describe('App smoke render', () => {
  test('renders core UI elements with expected data-testids', async () => {
    render(<App />);

    // App root
    expect(screen.getByTestId('app-root')).toBeInTheDocument();

    // Header and settings button
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();

    // Task input section and controls
    const taskInputSection = screen.getByTestId('task-input-section');
    expect(taskInputSection).toBeInTheDocument();

    // Input exists
    const titleInput = screen.getByTestId('task-input-title');
    expect(titleInput).toBeInTheDocument();

    // Add button exists and initially disabled
    const addBtn = screen.getByTestId('task-input-add');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toBeDisabled();

    // Filters root and tabs/selects
    const filtersSection = screen.getByTestId('filters-section');
    expect(filtersSection).toBeInTheDocument();
    const filtersRoot = within(filtersSection).getByTestId('filters');
    expect(filtersRoot).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('filters-tabs')).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('tab-all')).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('tab-active')).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('tab-completed')).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('sort-select')).toBeInTheDocument();
    expect(within(filtersRoot).getByTestId('category-select')).toBeInTheDocument();

    // Task list sections exist (today/upcoming/completed)
    const taskListSection = screen.getByTestId('tasklist-section');
    expect(taskListSection).toBeInTheDocument();

    // Section containers by data-testid
    expect(screen.getByTestId('section-today')).toBeInTheDocument();
    expect(screen.getByTestId('section-upcoming')).toBeInTheDocument();
    expect(screen.getByTestId('section-completed')).toBeInTheDocument();
  });

  test('can add a simple task via the TaskInput UI and see it listed (in All)', async () => {
    render(<App />);

    const titleInput = screen.getByTestId('task-input-title');
    const addBtn = screen.getByTestId('task-input-add');

    // Type a task title
    fireEvent.change(titleInput, { target: { value: 'Buy milk' } });

    // Button should be enabled now
    expect(addBtn).not.toBeDisabled();

    // Submit by clicking add button
    fireEvent.click(addBtn);

    // The input should be cleared after adding
    expect(titleInput).toHaveValue('');

    // We don't know which section it will appear in without due date, but it should be in the "All" view.
    // Find the task title text in the document via TaskItem title button.
    // The TaskItem renders a button with data-testid "task-item-title-button" holding the text.
    // Since each TaskItem has data-testid="task-item", query for any title button text.
    // Simpler: assert the title text appears somewhere.
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  test('opens settings panel when clicking settings button', () => {
    render(<App />);

    const settingsBtn = screen.getByTestId('settings-button');
    fireEvent.click(settingsBtn);

    // SettingsPanel should render with data-testid="settings-panel"
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });
});
