import React, { useMemo } from 'react';
import { useTodo } from '../context/TodoContext';
import Badge from './Badge';
import EmptyState from './EmptyState';
import TaskItem from './TaskItem';

/**
 * PUBLIC_INTERFACE
 * TaskList - Renders categorized sections of tasks: Today, Upcoming, and Completed.
 * - Uses selectors from TodoContext to derive arrays.
 * - Each section includes a heading with a Badge count, a list with role="list",
 *   and TaskItem entries with role="listitem".
 * - When a section has no items, shows an EmptyState instead of the list.
 *
 * Accessibility:
 * - Sections are role="region" with aria-labelledby heading ids.
 * - Lists use role="list" and items use role="listitem" (TaskItem does this internally).
 *
 * Data-testid:
 * - Sections: section-today, section-upcoming, section-completed
 * - Lists: list-today, list-upcoming, list-completed
 */
export default function TaskList() {
  const { selectors } = useTodo();

  // Derive categorized arrays using context selectors
  const today = selectors.selectToday();
  const upcoming = selectors.selectUpcoming();
  const completed = selectors.selectCompleted();

  const counts = useMemo(
    () => ({
      today: today.length,
      upcoming: upcoming.length,
      completed: completed.length,
    }),
    [today.length, upcoming.length, completed.length]
  );

  return (
    <div className="tasklist-wrap">
      <Section
        title="Today"
        testId="today"
        count={counts.today}
        emptyTitle="No tasks due today"
        emptyDesc="Add tasks with a due date of today to see them here."
      >
        {counts.today > 0 ? (
          <ul className="list task-list" role="list" data-testid="list-today">
            {today.map((t) => (
              <TaskItem key={t.id} task={t} data-testid={`task-item-${t.id}`} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="You're all caught up for today!"
            description="No tasks due today. Enjoy the moment or add something new."
            data-testid="empty-today"
          />
        )}
      </Section>

      <Section
        title="Upcoming"
        testId="upcoming"
        count={counts.upcoming}
        emptyTitle="Nothing on the horizon"
        emptyDesc="Add tasks with future due dates (within ~30 days) to see them here."
      >
        {counts.upcoming > 0 ? (
          <ul className="list task-list" role="list" data-testid="list-upcoming">
            {upcoming.map((t) => (
              <TaskItem key={t.id} task={t} data-testid={`task-item-${t.id}`} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No upcoming tasks"
            description="Plan ahead by adding tasks with future due dates."
            data-testid="empty-upcoming"
          />
        )}
      </Section>

      <Section
        title="Completed"
        testId="completed"
        count={counts.completed}
        emptyTitle="No completed tasks yet"
        emptyDesc="Check items off to celebrate progress! Completed tasks will appear here."
      >
        {counts.completed > 0 ? (
          <ul className="list task-list" role="list" data-testid="list-completed">
            {completed.map((t) => (
              <TaskItem key={t.id} task={t} data-testid={`task-item-${t.id}`} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing checked off yet"
            description="Once you complete tasks, they’ll be neatly listed here."
            data-testid="empty-completed"
          />
        )}
      </Section>

      <style jsx="true">{`
        .tasklist-wrap {
          display: grid;
          gap: 18px;
          margin-top: 8px;
        }
        .section {
          background: var(--color-surface);
          border: 1px solid color-mix(in oklab, var(--accent), black 90%);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: linear-gradient(135deg, #fce7f3, #e9d5ff 40%, #dbeafe);
          color: var(--color-text);
        }
        .section-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          letter-spacing: 0.2px;
        }
        .section-body {
          padding: 12px;
        }
        .task-list {
          display: grid;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

/**
 * INTERNAL: Section wrapper with heading and count badge.
 * Provides role region semantics and styling hooks for the playful theme.
 */
function Section({ title, testId, count, children }) {
  const headingId = `section-${testId}-title`;
  return (
    <section
      className="section"
      role="region"
      aria-labelledby={headingId}
      data-testid={`section-${testId}`}
    >
      <div className="section-header">
        <h2 id={headingId} className="section-title">
          <span aria-hidden="true">📌</span> {title}
        </h2>
        <Badge size="sm" variant="accent" data-testid={`badge-${testId}`} title={`${count} ${title.toLowerCase()} tasks`}>
          {count}
        </Badge>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
