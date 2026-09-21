import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TaskDescription } from './task-description';

afterEach(() => {
  vi.useRealTimers();
});

describe('TaskDescription', () => {
  it('renders plain text when the description has no markdown', () => {
    render(<TaskDescription value="Basit bir not." onCommit={vi.fn()} />);
    expect(screen.getByText('Basit bir not.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders the markdown preview instead of source', () => {
    render(
      <TaskDescription
        value={'# Başlık\n\n**kalın** ve [link](https://example.com)'}
        onCommit={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Başlık');
    expect(screen.getByText('kalın').tagName).toBe('STRONG');
    const anchor = screen.getByText('link');
    expect(anchor.tagName).toBe('A');
    expect(anchor.getAttribute('href')).toBe('https://example.com/');
  });

  it('shows a placeholder button when empty and opens the editor on click', async () => {
    const user = userEvent.setup();
    render(<TaskDescription value="" onCommit={vi.fn()} />);

    const placeholder = screen.getByText('Açıklama ekle…');
    expect(placeholder).toBeInTheDocument();

    await user.click(placeholder);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('opens the editor via the Düzenle affordance', async () => {
    const user = userEvent.setup();
    render(<TaskDescription value="Mevcut açıklama" onCommit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveValue('Mevcut açıklama');
  });

  it('switches between Kaynak and Önizleme tabs while editing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TaskDescription value="# Başlık" onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    expect(screen.getByRole('textbox')).toHaveValue('# Başlık');

    await user.click(screen.getByRole('button', { name: 'Önizleme' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Başlık');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Kaynak' }));
    expect(screen.getByRole('textbox')).toHaveValue('# Başlık');
  });

  it('commits the trimmed value after the autosave debounce', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<TaskDescription value="Eski" onCommit={onCommit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Yeni açıklama  ' } });

    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onCommit).toHaveBeenCalledWith('Yeni açıklama');
  });

  it('commits on blur when leaving the field', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TaskDescription value="Eski" onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    const textbox = screen.getByRole('textbox');
    await user.clear(textbox);
    await user.type(textbox, 'Blur ile');

    await user.tab();
    expect(onCommit).toHaveBeenCalledWith('Blur ile');
  });

  it('cancels on Escape without committing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TaskDescription value="Kalıcı" onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    const textbox = screen.getByRole('textbox');
    await user.clear(textbox);
    await user.type(textbox, 'Kaybolacak');
    await user.keyboard('{Escape}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Kalıcı')).toBeInTheDocument();
  });

  it('renders blocked javascript links as text and never creates anchors (XSS)', async () => {
    const user = userEvent.setup();
    const source = '[tıkla](javascript:alert(1))';
    render(<TaskDescription value={source} onCommit={vi.fn()} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(source)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Açıklamayı düzenle' }));
    await user.click(screen.getByRole('button', { name: 'Önizleme' }));
    expect(screen.getByText(source)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('never injects raw HTML', () => {
    const source = '<img src=x onerror=alert(1)>';
    const { container } = render(<TaskDescription value={source} onCommit={vi.fn()} />);
    expect(screen.getByText(source)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
