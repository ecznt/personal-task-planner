import { describe, expect, it } from 'vitest';

import { filterCommands, type Command } from './commands';

const commands: readonly Command[] = [
  { id: 'today', label: 'Bugün', keywords: ['today'], run: () => undefined },
  { id: 'tasks', label: 'Görevler', keywords: ['tasks'], run: () => undefined },
  { id: 'new-task', label: 'Yeni Görev', keywords: ['task', 'ekle', 'oluştur'], run: () => undefined },
  { id: 'notifications', label: 'Bildirimler', keywords: ['notifications', 'zil'], run: () => undefined },
];

describe('filterCommands', () => {
  it('returns all commands for an empty query', () => {
    expect(filterCommands('', commands)).toHaveLength(commands.length);
    expect(filterCommands('   ', commands)).toHaveLength(commands.length);
  });

  it('matches against the label case-insensitively', () => {
    expect(filterCommands('bugün', commands).map((command) => command.id)).toEqual(['today']);
    expect(filterCommands('GÖREV', commands).map((command) => command.id)).toEqual(['tasks', 'new-task']);
  });

  it('matches against keywords when the label does not contain the query', () => {
    expect(filterCommands('zil', commands).map((command) => command.id)).toEqual(['notifications']);
  });

  it('matches partial words', () => {
    expect(filterCommands('görevl', commands).map((command) => command.id)).toEqual(['tasks']);
  });

  it('returns nothing when no command matches', () => {
    expect(filterCommands('yok böyle birşey', commands)).toHaveLength(0);
  });

  it('does not mutate its input (sort order preserved for filtered results)', () => {
    const before = commands.map((command) => command.id);
    filterCommands('a', commands);
    expect(commands.map((command) => command.id)).toEqual(before);
  });
});