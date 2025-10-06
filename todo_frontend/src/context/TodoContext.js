import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { applyTheme } from '../assets/theme';

/**
 * @typedef {Object} Task
 * @property {string} id - Unique ID for the task
 * @property {string} title - Title of the task
 * @property {string} [notes] - Optional notes/details
 * @property {boolean} completed - Completion status
 * @property {string} [category] - Optional category id/name
 * @property {string} createdAt - ISO date string of creation time
 * @property {string} [dueDate] - Optional ISO date string of due date
 */

/**
 * @typedef {Object} Settings
 * @property {'light'|'dark'} theme - UI theme mode
 * @property {'primary'|'secondary'|string} accent - Accent color token or CSS color string
 */

/**
 * @typedef {Object} State
 * @property {Task[]} tasks - Array of tasks
 * @property {'all'|'active'|'completed'|'today'|'upcoming'} filter - Current filter
 * @property {'created'|'due'|'alpha'|'status'} sort - Current sort key
 * @property {Settings} settings - UI settings
 * @property {Array<string>} categories - List of categories
 * @property {'all'|'none'|string} [selectedCategory] - Current category filter ('all' shows all, 'none' shows tasks without category)
 */

/**
 * Action constants
 */
export const ActionTypes = {
  ADD_TASK: 'ADD_TASK',
  TOGGLE_TASK: 'TOGGLE_TASK',
  EDIT_TASK: 'EDIT_TASK',
  DELETE_TASK: 'DELETE_TASK',
  CLEAR_COMPLETED: 'CLEAR_COMPLETED',
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  SET_THEME: 'SET_THEME',
  SET_ACCENT: 'SET_ACCENT',
  ADD_CATEGORY: 'ADD_CATEGORY',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_DENSITY: 'SET_DENSITY',
  SET_SETTINGS_OPEN: 'SET_SETTINGS_OPEN',
};

/**
 * Initial state for the todo app
 * @type {State}
 */
export const initialState = {
  tasks: [],
  filter: 'all',
  sort: 'created',
  settings: {
    theme: 'light',
    accent: 'primary',
    density: 'comfortable',
  },
  categories: [],
  selectedCategory: 'all',
  settingsOpen: false,
};

/**
 * Ensure we always return a new sorted array, not mutating input
 * @param {Task[]} tasks
 * @param {State['sort']} sort
 * @returns {Task[]}
 */
function sortTasks(tasks, sort) {
  const copy = [...tasks];
  switch (sort) {
    case 'due':
      return copy.sort((a, b) => {
        const aDue = a.dueDate ? Date.parse(a.dueDate) : Infinity;
        const bDue = b.dueDate ? Date.parse(b.dueDate) : Infinity;
        return aDue - bDue;
      });
    case 'alpha':
      return copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'status':
      return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
    case 'created':
    default:
      return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}

/**
 * Reducer for managing state transitions
 * Must remain pure and return new state objects.
 * @param {State} state
 * @param {{type:string, payload?:any}} action
 * @returns {State}
 */
function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_TASK: {
      const task = action.payload;
      const nextTasks = sortTasks([task, ...state.tasks], state.sort);
      return { ...state, tasks: nextTasks };
    }
    case ActionTypes.TOGGLE_TASK: {
      const id = action.payload;
      const nextTasks = state.tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      return { ...state, tasks: sortTasks(nextTasks, state.sort) };
    }
    case ActionTypes.EDIT_TASK: {
      const { id, updates } = action.payload || {};
      const nextTasks = state.tasks.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      return { ...state, tasks: sortTasks(nextTasks, state.sort) };
    }
    case ActionTypes.DELETE_TASK: {
      const id = action.payload;
      const nextTasks = state.tasks.filter(t => t.id !== id);
      return { ...state, tasks: nextTasks };
    }
    case ActionTypes.CLEAR_COMPLETED: {
      const nextTasks = state.tasks.filter(t => !t.completed);
      return { ...state, tasks: nextTasks };
    }
    case ActionTypes.SET_FILTER: {
      const filter = action.payload;
      return { ...state, filter };
    }
    case ActionTypes.SET_SORT: {
      const sort = action.payload;
      return { ...state, sort, tasks: sortTasks(state.tasks, sort) };
    }
    case ActionTypes.SET_THEME: {
      const theme = action.payload;
      return { ...state, settings: { ...state.settings, theme } };
    }
    case ActionTypes.SET_ACCENT: {
      const accent = action.payload;
      return { ...state, settings: { ...state.settings, accent } };
    }
    case ActionTypes.SET_DENSITY: {
      const density = action.payload === 'compact' ? 'compact' : 'comfortable';
      return { ...state, settings: { ...state.settings, density } };
    }
    case ActionTypes.SET_SETTINGS_OPEN: {
      return { ...state, settingsOpen: Boolean(action.payload) };
    }
    case ActionTypes.ADD_CATEGORY: {
      const cat = action.payload;
      if (!cat || state.categories.includes(cat)) return state;
      return { ...state, categories: [...state.categories, cat] };
    }
    case ActionTypes.SET_SELECTED_CATEGORY: {
      // payload: 'all' | 'none' | string
      let next = action.payload;
      if (next !== 'all' && next !== 'none') {
        // if selected category not present anymore, coerce to 'all'
        if (!state.categories.includes(next)) {
          next = 'all';
        }
      }
      return { ...state, selectedCategory: next };
    }
    default:
      return state;
  }
}

/**
 * Utilities for date classification
 */
function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function isUpcoming(date, now = new Date()) {
  const d = new Date(date);
  // Upcoming if due date is after today (not today) and within next 30 days
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const in30 = new Date(now);
  in30.setDate(now.getDate() + 30);
  return d >= tomorrow && d <= in30;
}

/**
 * PUBLIC_INTERFACE
 * Memoized selector: visible tasks based on current filter.
 * @param {State} state
 * @returns {Task[]}
 */
export function selectVisibleTasks(state) {
  // apply category filtering first
  let base = state.tasks;
  const cat = state.selectedCategory || 'all';
  if (cat === 'none') {
    base = base.filter(t => !t.category);
  } else if (cat !== 'all') {
    base = base.filter(t => t.category === cat);
  }
  switch (state.filter) {
    case 'active':
      return base.filter(t => !t.completed);
    case 'completed':
      return base.filter(t => t.completed);
    case 'today': {
      const now = new Date();
      return base.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), now));
    }
    case 'upcoming':
      return base.filter(t => t.dueDate && isUpcoming(t.dueDate));
    case 'all':
    default:
      return base;
  }
}

/**
 * PUBLIC_INTERFACE
 * Select tasks due today.
 * @param {State} state
 * @param {Date} [now=new Date()]
 * @returns {Task[]}
 */
export function selectToday(state, now = new Date()) {
  return state.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), now));
}

/**
 * PUBLIC_INTERFACE
 * Select upcoming tasks (future, not today, within 30 days).
 * @param {State} state
 * @returns {Task[]}
 */
export function selectUpcoming(state) {
  return state.tasks.filter(t => t.dueDate && isUpcoming(t.dueDate));
}

/**
 * PUBLIC_INTERFACE
 * Select completed tasks.
 * @param {State} state
 * @returns {Task[]}
 */
export function selectCompleted(state) {
  return state.tasks.filter(t => t.completed);
}

const TodoStateContext = createContext(undefined);
const TodoDispatchContext = createContext(undefined);

/**
 * PUBLIC_INTERFACE
 * TodoProvider wraps the application and provides state, dispatch, and bound action creators.
 * It also integrates theme settings by updating data-theme and --accent on the document root.
 * @param {{children: React.ReactNode, initial?: Partial<State>}} props
 */
export function TodoProvider({ children, initial }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial });

  // Apply theme tokens to document root on settings change
  useEffect(() => {
    applyTheme(document.documentElement, {
      theme: state.settings.theme,
      accent: state.settings.accent,
    });
    try {
      const root = document.documentElement;
      const density = state.settings.density || 'comfortable';
      root.setAttribute('data-density', density);
    } catch (_e) {
      // no-op in non-browser environments
    }
  }, [state.settings.theme, state.settings.accent, state.settings.density]);

  // Bound action creators for convenience and testid-friendly integration later
  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      addTask(task) {
        /** Add a new task. Expects a fully formed Task object with unique id. */
        dispatch({ type: ActionTypes.ADD_TASK, payload: task });
      },
      // PUBLIC_INTERFACE
      toggleTask(id) {
        /** Toggle completion for a task by id. */
        dispatch({ type: ActionTypes.TOGGLE_TASK, payload: id });
      },
      // PUBLIC_INTERFACE
      editTask(id, updates) {
        /** Edit a task by id with a partial updates object. */
        dispatch({ type: ActionTypes.EDIT_TASK, payload: { id, updates } });
      },
      // PUBLIC_INTERFACE
      deleteTask(id) {
        /** Delete a task by id. */
        dispatch({ type: ActionTypes.DELETE_TASK, payload: id });
      },
      // PUBLIC_INTERFACE
      clearCompleted() {
        /** Remove all completed tasks. */
        dispatch({ type: ActionTypes.CLEAR_COMPLETED });
      },
      // PUBLIC_INTERFACE
      setFilter(filter) {
        /** Set the current list filter. */
        dispatch({ type: ActionTypes.SET_FILTER, payload: filter });
      },
      // PUBLIC_INTERFACE
      setSort(sort) {
        /** Set the current sort key and re-sort tasks. */
        dispatch({ type: ActionTypes.SET_SORT, payload: sort });
      },
      // PUBLIC_INTERFACE
      setTheme(theme) {
        /** Set theme mode: 'light' | 'dark'. */
        dispatch({ type: ActionTypes.SET_THEME, payload: theme });
      },
      // PUBLIC_INTERFACE
      setAccent(accent) {
        /** Set accent color: 'primary' | 'secondary' | CSS color string. */
        dispatch({ type: ActionTypes.SET_ACCENT, payload: accent });
      },
      // PUBLIC_INTERFACE
      setDensity(density) {
        /** Set UI density: 'comfortable' | 'compact'. */
        dispatch({ type: ActionTypes.SET_DENSITY, payload: density });
      },
      // PUBLIC_INTERFACE
      setSettingsOpen(open) {
        /** Control the visibility of the settings panel modal. */
        dispatch({ type: ActionTypes.SET_SETTINGS_OPEN, payload: open });
      },
      // PUBLIC_INTERFACE
      addCategory(category) {
        /** Add a new category if not present. */
        dispatch({ type: ActionTypes.ADD_CATEGORY, payload: category });
      },
      // PUBLIC_INTERFACE
      setSelectedCategory(value) {
        /**
         * Set the current category filter.
         * value: 'all' | 'none' | string (must exist in categories to be retained)
         */
        dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: value });
      },
    };
  }, [dispatch]);

  // Memoize derived selectors so consumers get stable identities
  const memoizedSelectors = useMemo(() => {
    return {
      selectVisible: () => selectVisibleTasks(state),
      selectToday: (now) => selectToday(state, now),
      selectUpcoming: () => selectUpcoming(state),
      selectCompleted: () => selectCompleted(state),
    };
  }, [state]);

  const value = useMemo(
    () => ({ state, dispatch, actions, selectors: memoizedSelectors }),
    [state, dispatch, actions, memoizedSelectors]
  );

  return (
    <TodoStateContext.Provider value={value}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * Hook to access the Todo context value (state, dispatch, actions, selectors).
 * @returns {{ state: State, dispatch: React.Dispatch<any>, actions: any, selectors: any }}
 */
export function useTodo() {
  const ctx = useContext(TodoStateContext);
  if (!ctx) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access the dispatch directly if needed by advanced consumers.
 * @returns {React.Dispatch<any>}
 */
export function useTodoDispatch() {
  const ctx = useContext(TodoDispatchContext);
  if (!ctx) {
    throw new Error('useTodoDispatch must be used within a TodoProvider');
  }
  return ctx;
}
