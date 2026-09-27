import { describe, expect, it } from 'vitest';

import {
  moveTaskBetweenColumns,
  preventCardDragFromControls,
  removeTaskFromColumns,
  resolveDragMove,
  resolveLifecycleDrop,
  type DragTaskData,
} from './kanban-dnd';
import type { KanbanTask } from './kanban-task-card';

const task = (id: string): KanbanTask => ({
  id,
  title: `Görev ${id}`,
  priority: 'MEDIUM',
  canonicalStatus: 'TO_DO',
  dueAt: null,
  plannedAt: null,
  version: 1,
  parentTaskId: null,
  subtaskCount: 0,
  completedSubtaskCount: 0,
  labels: [],
  project: null,
  parentTask: null,
});

const completedTask = (id: string): KanbanTask => ({ ...task(id), canonicalStatus: 'COMPLETED' });

describe('resolveDragMove', () => {
  it('returns a move when source and target columns differ', () => {
    expect(
      resolveDragMove(
        { taskId: 'task-1', version: 3, fromColumn: 'todo', task: task('task-1') },
        'completed',
      ),
    ).toEqual({ taskId: 'task-1', version: 3, toColumn: 'completed' });
  });

  it('returns null when dropping onto the same column', () => {
    expect(
      resolveDragMove(
        { taskId: 'task-1', version: 3, fromColumn: 'todo', task: task('task-1') },
        'todo',
      ),
    ).toBeNull();
  });

  it('returns null when source data or target column is missing', () => {
    expect(resolveDragMove(undefined, 'todo')).toBeNull();
    expect(
      resolveDragMove(
        { taskId: 'task-1', version: 1, fromColumn: 'todo', task: task('task-1') },
        undefined,
      ),
    ).toBeNull();
    expect(
      resolveDragMove(
        { taskId: 'task-1', version: 1, fromColumn: 'todo', task: task('task-1') },
        null,
      ),
    ).toBeNull();
  });
});

describe('resolveLifecycleDrop', () => {
  const source = (taskBody: KanbanTask): DragTaskData => ({
    taskId: taskBody.id,
    version: taskBody.version,
    fromColumn: 'completed',
    task: taskBody,
  });

  it('resolves to archive when a completed task is dropped on the archive zone', () => {
    expect(resolveLifecycleDrop(source(completedTask('task-1')), 'kanban-lifecycle-archive')).toBe(
      'archive',
    );
  });

  it('resolves to trash when a completed task is dropped on the trash zone', () => {
    expect(resolveLifecycleDrop(source(completedTask('task-1')), 'kanban-lifecycle-trash')).toBe(
      'trash',
    );
  });

  it('returns null for non-completed tasks', () => {
    expect(resolveLifecycleDrop(source(task('task-1')), 'kanban-lifecycle-archive')).toBeNull();
    expect(resolveLifecycleDrop(source(task('task-1')), 'kanban-lifecycle-trash')).toBeNull();
  });

  it('returns null when the target is not a lifecycle zone', () => {
    expect(resolveLifecycleDrop(source(completedTask('task-1')), 'completed')).toBeNull();
    expect(resolveLifecycleDrop(source(completedTask('task-1')), undefined)).toBeNull();
    expect(resolveLifecycleDrop(source(completedTask('task-1')), null)).toBeNull();
    expect(resolveLifecycleDrop(undefined, 'kanban-lifecycle-archive')).toBeNull();
  });
});

describe('preventCardDragFromControls', () => {
  it('returns true when a control inside the card triggered the pointerdown', () => {
    const card = document.createElement('a');
    card.href = '/app/areas/tasks/task-1';
    const button = document.createElement('button');
    card.appendChild(button);
    document.body.appendChild(card);

    const event = new PointerEvent('pointerdown', { bubbles: true });
    button.dispatchEvent(event);
    expect(preventCardDragFromControls(event)).toBe(true);

    card.remove();
  });

  it('returns true for contenteditable surfaces', () => {
    const card = document.createElement('a');
    card.href = '/app/areas/tasks/task-1';
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    card.appendChild(editor);
    document.body.appendChild(card);

    const event = new PointerEvent('pointerdown', { bubbles: true });
    editor.dispatchEvent(event);
    expect(preventCardDragFromControls(event)).toBe(true);

    card.remove();
  });

  it('allows activation from the card anchor (non-control surface)', () => {
    const card = document.createElement('a');
    card.href = '/app/areas/tasks/task-1';
    document.body.appendChild(card);

    const event = new PointerEvent('pointerdown', { bubbles: true });
    card.dispatchEvent(event);
    expect(preventCardDragFromControls(event)).toBe(false);

    card.remove();
  });

  it('returns false when no event target is present', () => {
    expect(preventCardDragFromControls({ target: null } as unknown as PointerEvent)).toBe(false);
  });
});

describe('moveTaskBetweenColumns', () => {
  it('moves a task to the target column and updates counts', () => {
    const columns = {
      todo: { count: 2, tasks: [task('a'), task('b')] },
      done: { count: 1, tasks: [task('c')] },
    };

    const next = moveTaskBetweenColumns(columns, 'a', 'todo', 'done');

    expect(next.todo).toEqual({ count: 1, tasks: [task('b')] });
    expect(next.done).toEqual({ count: 2, tasks: [task('c'), task('a')] });
    expect(columns.todo).toEqual({ count: 2, tasks: [task('a'), task('b')] });
  });

  it('returns the same reference when columns are equal', () => {
    const columns = { todo: { count: 1, tasks: [task('a')] } };

    expect(moveTaskBetweenColumns(columns, 'a', 'todo', 'todo')).toBe(columns);
  });

  it('does not mutate when the task or column is missing', () => {
    const columns = { todo: { count: 1, tasks: [task('a')] } };

    expect(moveTaskBetweenColumns(columns, 'missing', 'todo', 'done')).toBe(columns);
    expect(moveTaskBetweenColumns(columns, 'a', 'nope', 'done')).toBe(columns);
    expect(moveTaskBetweenColumns(columns, 'a', 'todo', 'nope')).toBe(columns);
  });
});

describe('removeTaskFromColumns', () => {
  it('removes a task from the source column and updates the count', () => {
    const columns = {
      completed: { count: 2, tasks: [task('a'), completedTask('b')] },
    };

    const next = removeTaskFromColumns(columns, 'b', 'completed');

    expect(next.completed).toEqual({ count: 1, tasks: [task('a')] });
    expect(columns.completed).toEqual({ count: 2, tasks: [task('a'), completedTask('b')] });
  });

  it('does not mutate when the task or column is missing', () => {
    const columns = { completed: { count: 1, tasks: [completedTask('a')] } };

    expect(removeTaskFromColumns(columns, 'missing', 'completed')).toBe(columns);
    expect(removeTaskFromColumns(columns, 'a', 'nope')).toBe(columns);
  });
});
