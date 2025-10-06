import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useTodo } from '../context/TodoContext';

/**
 * PUBLIC_INTERFACE
 * Filters - Accessible control bar to filter and sort tasks and filter by category.
 * Includes:
 * - Tabs: All, Active, Completed (keyboard accessible roving tablist)
 * - Sort dropdown: Created, Due, Alpha
 * - Category dropdown: All categories + None + specific categories
 *
 * Accessibility:
 * - Tabs use role="tablist"/role="tab" with aria-selected and roving tabindex
 * - Selects have labels linked via htmlFor
 *
 * Data-testid:
 * - root: filters
 * - tabs: filters-tabs
 * - each tab: tab-all, tab-active, tab-completed
 * - sort select: sort-select
 * - category select: category-select
 */
export default function Filters({
  className = '',
  'data-testid': testId = 'filters',
}) {
  const { state, actions } = useTodo();
  const uid = useId();

  // Persisted values from context
  const filter = state?.filter ?? 'all';
  const sort = state?.sort ?? 'created';
  const category = state?.selectedCategory ?? 'all';
  const categories = state?.categories ?? [];

  // Tabs model
  const tabs = useMemo(
    () => ([
      { key: 'all', label: 'All', testId: 'tab-all' },
      { key: 'active', label: 'Active', testId: 'tab-active' },
      { key: 'completed', label: 'Completed', testId: 'tab-completed' },
    ]),
    []
  );

  const currentTabIndex = Math.max(
    0,
    tabs.findIndex(t => t.key === filter)
  );

  const onTabSelect = useCallback((key) => {
    if (key === 'all' || key === 'active' || key === 'completed') {
      actions.setFilter(key);
    }
  }, [actions]);

  // Keyboard navigation for tablist (roving tabindex)
  const tabRefs = useRef([]);
  tabRefs.current = [];
  const setTabRef = (el) => {
    if (el) tabRefs.current.push(el);
  };

  const onTabKeyDown = useCallback((e, idx) => {
    const count = tabRefs.current.length;
    if (!count) return;
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % count;
      tabRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + count) % count;
      tabRefs.current[nextIdx]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      tabRefs.current[count - 1]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tab = tabs[idx];
      if (tab) onTabSelect(tab.key);
    }
  }, [tabs, onTabSelect]);

  // Sort select handler
  const onSortChange = useCallback((e) => {
    const val = e.target.value;
    if (val === 'created' || val === 'due' || val === 'alpha') {
      actions.setSort(val);
    }
  }, [actions]);

  // Category select handler
  const onCategoryChange = useCallback((e) => {
    const val = e.target.value;
    // 'all' and 'none' are allowed sentinel values
    if (typeof actions.setSelectedCategory === 'function') {
      actions.setSelectedCategory(val);
    } else {
      // fallback dispatch known type for future reducer
      actions.__setSelectedCategory?.(val); // noop if not defined
    }
  }, [actions]);

  // Build category options list
  const categoryOptions = useMemo(() => {
    // always include 'all' and 'none'
    const unique = Array.from(new Set(categories.filter(Boolean)));
    return ['all', 'none', ...unique];
  }, [categories]);

  // Keep category coherent if removed
  useEffect(() => {
    if (category !== 'all' && category !== 'none' && !categories.includes(category)) {
      if (typeof actions.setSelectedCategory === 'function') {
        actions.setSelectedCategory('all');
      }
    }
  }, [categories, category, actions]);

  const sortLabelId = `${uid}-sort-label`;
  const catLabelId = `${uid}-cat-label`;
  const tablistId = `${uid}-tablist`;

  return (
    <section
      className={['filters card', className].filter(Boolean).join(' ')}
      role="region"
      aria-labelledby={`${uid}-filters-title`}
      data-testid={testId}
    >
      <div className="filters-inner">
        <h2 id={`${uid}-filters-title`} className="sr-only">Filters</h2>

        <div
          className="tabs"
          role="tablist"
          aria-label="Task filter tabs"
          id={tablistId}
          data-testid="filters-tabs"
        >
          {tabs.map((t, idx) => {
            const selected = filter === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                ref={setTabRef}
                id={`${tablistId}-${t.key}`}
                aria-selected={selected}
                aria-controls={`${tablistId}-panel`}
                tabIndex={selected ? 0 : -1}
                className={['tab focus-ring', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                onClick={() => onTabSelect(t.key)}
                onKeyDown={(e) => onTabKeyDown(e, idx)}
                data-testid={t.testId}
                type="button"
                title={`Show ${t.label} tasks`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="spacer" aria-hidden="true" />

        <div className="controls">
          <div className="field">
            <label id={sortLabelId} className="field-label" htmlFor={`${uid}-sort`}>Sort</label>
            <select
              id={`${uid}-sort`}
              aria-labelledby={sortLabelId}
              className="input select-input focus-ring"
              value={sort}
              onChange={onSortChange}
              data-testid="sort-select"
            >
              <option value="created">Created</option>
              <option value="due">Due</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>

          <div className="field">
            <label id={catLabelId} className="field-label" htmlFor={`${uid}-category`}>Category</label>
            <select
              id={`${uid}-category`}
              aria-labelledby={catLabelId}
              className="input select-input focus-ring"
              value={category}
              onChange={onCategoryChange}
              data-testid="category-select"
            >
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All categories' : (opt === 'none' ? 'No category' : opt)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .filters {
          padding: 10px 12px;
          background: var(--color-surface);
          border: 1px solid color-mix(in oklab, var(--accent), black 90%);
          border-radius: var(--radius);
          margin-bottom: 12px;
        }
        .filters-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tabs {
          display: inline-flex;
          background: color-mix(in oklab, var(--accent), white 88%);
          border: 1px solid color-mix(in oklab, var(--accent), black 88%);
          border-radius: 9999px;
          padding: 4px;
        }
        .tab {
          border: none;
          background: transparent;
          padding: 8px 12px;
          border-radius: 9999px;
          font-weight: 800;
          color: var(--color-text);
          cursor: pointer;
        }
        .tab.is-selected {
          background: var(--color-surface);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .controls {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 700;
          color: color-mix(in oklab, var(--color-text), white 15%);
          padding-left: 2px;
          user-select: none;
        }
        .spacer { flex: 1 1 auto; }

        .sr-only {
          border: 0 !important;
          clip: rect(1px, 1px, 1px, 1px) !important;
          -webkit-clip-path: inset(50%) !important;
          clip-path: inset(50%) !important;
          height: 1px !important;
          margin: -1px !important;
          overflow: hidden !important;
          padding: 0 !important;
          position: absolute !important;
          width: 1px !important;
          word-wrap: normal !important;
        }
      `}</style>
    </section>
  );
}
