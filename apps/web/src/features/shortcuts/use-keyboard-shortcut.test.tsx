import { fireEvent, render, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { isShortcutMatch, useKeyboardShortcut } from './use-keyboard-shortcut';

function press(documentTarget: Document, init: KeyboardEventInit) {
  fireEvent.keyDown(documentTarget, init);
}

describe('isShortcutMatch', () => {
  it('matches a plain key with no modifiers', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'n' }), { key: 'n' })).toBe(true);
  });

  it('is case tolerant for letter keys', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'N' }), { key: 'n' })).toBe(true);
  });

  it('rejects a plain key when any modifier is held', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'n', metaKey: true }), { key: 'n' })).toBe(false);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }), { key: 'n' })).toBe(false);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'n', altKey: true }), { key: 'n' })).toBe(false);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'n', shiftKey: true }), { key: 'n' })).toBe(false);
  });

  it('matches mod on either super key', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), { key: 'k', mod: true })).toBe(true);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), { key: 'k', mod: true })).toBe(true);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'k' }), { key: 'k', mod: true })).toBe(false);
  });

  it('rejects mod matches that add unrelated modifiers', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'k', metaKey: true, altKey: true }), { key: 'k', mod: true })).toBe(false);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'k', metaKey: true, shiftKey: true }), { key: 'k', mod: true })).toBe(false);
  });

  it('matches an explicit shift requirement', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: '?', shiftKey: true }), { key: '?', shift: true })).toBe(true);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: '?' }), { key: '?', shift: true })).toBe(false);
  });

  it('matches explicit ctrl or meta when mod is not used', () => {
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true }), { key: 'r', ctrl: true })).toBe(true);
    expect(isShortcutMatch(new KeyboardEvent('keydown', { key: 'r', metaKey: true }), { key: 'r', meta: true })).toBe(true);
  });
});

function Harness({ onKey }: { onKey: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useKeyboardShortcut({ key: 'n' }, onKey);
  return <input ref={ref} data-testid="target" />;
}

describe('useKeyboardShortcut', () => {
  it('fires the handler on a matching key', () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, onKey));

    press(document, { key: 'n' });

    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the pressed key does not match', () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, onKey));

    press(document, { key: 'm' });

    expect(onKey).not.toHaveBeenCalled();
  });

  it('skips when an editable element is the keydown target', () => {
    const onKey = vi.fn();
    const { getByTestId } = render(<Harness onKey={onKey} />);

    fireEvent.keyDown(getByTestId('target'), { key: 'n' });

    expect(onKey).not.toHaveBeenCalled();
  });

  it('fires when the keydown target is not editable', () => {
    const onKey = vi.fn();
    render(<Harness onKey={onKey} />);

    press(document, { key: 'n' });

    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it('skips repeated keys when ignoreRepeats is enabled', () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, onKey, { ignoreRepeats: true }));

    press(document, { key: 'n', repeat: true });

    expect(onKey).not.toHaveBeenCalled();
  });

  it('prevents the default action on a match', () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, onKey));

    const keyDown = new KeyboardEvent('keydown', { key: 'n', cancelable: true });
    const spy = vi.spyOn(keyDown, 'preventDefault');
    document.dispatchEvent(keyDown);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});