import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AutosaveStatus, InlineSelect, InlineText } from './inline-field';

afterEach(() => {
  vi.useRealTimers();
});

describe('AutosaveStatus', () => {
  it('renders nothing while idle', () => {
    const { container } = render(<AutosaveStatus status="idle" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the saving indicator', () => {
    render(<AutosaveStatus status="saving" />);
    expect(screen.getByText('Kaydediliyor')).toBeInTheDocument();
  });

  it('renders the saved confirmation', () => {
    render(<AutosaveStatus status="saved" />);
    expect(screen.getByText('Kaydedildi')).toBeInTheDocument();
  });

  it('renders the failure notice', () => {
    render(<AutosaveStatus status="error" />);
    expect(screen.getByText('Kaydedilemedi')).toBeInTheDocument();
  });
});

describe('InlineText', () => {
  it('displays the value and opens an input when clicked', () => {
    render(<InlineText value="Rapor Teslim" onCommit={vi.fn()} />);

    expect(screen.getByText('Rapor Teslim')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rapor Teslim'));

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Rapor Teslim');
  });

  it('commits the trimmed value after the autosave debounce', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<InlineText value="Eski" onCommit={onCommit} />);

    fireEvent.click(screen.getByText('Eski'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Yeni Başlık  ' } });

    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onCommit).toHaveBeenCalledWith('Yeni Başlık');
  });

  it('commits immediately on blur', () => {
    const onCommit = vi.fn();
    render(<InlineText value="Eski" onCommit={onCommit} />);

    fireEvent.click(screen.getByText('Eski'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hızlı' } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith('Hızlı');
  });

  it('commits on Enter for single-line fields', () => {
    const onCommit = vi.fn();
    render(<InlineText value="Eski" onCommit={onCommit} />);

    fireEvent.click(screen.getByText('Eski'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Enter ile' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCommit).toHaveBeenCalledWith('Enter ile');
  });

  it('cancels on Escape without committing', () => {
    const onCommit = vi.fn();
    render(<InlineText value="Kalıcı" onCommit={onCommit} />);

    fireEvent.click(screen.getByText('Kalıcı'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Kaybolacak' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Kalıcı')).toBeInTheDocument();
  });

  it('reverts an empty required field without committing', () => {
    const onCommit = vi.fn();
    render(<InlineText value="Zorunlu" onCommit={onCommit} />);

    fireEvent.click(screen.getByText('Zorunlu'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Zorunlu')).toBeInTheDocument();
  });

  it('commits an empty value for optional fields', () => {
    const onCommit = vi.fn();
    render(<InlineText value="Silinecek" onCommit={onCommit} required={false} />);

    fireEvent.click(screen.getByText('Silinecek'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith('');
  });
});

describe('InlineSelect', () => {
  it('renders the selected option and commits a new one', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const options = [
      { value: 'LOW', label: 'Düşük' },
      { value: 'HIGH', label: 'Yüksek' },
    ];
    render(<InlineSelect value="LOW" options={options} onCommit={onCommit} />);

    expect(screen.getByText('Düşük')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Düşük' }));
    await user.click(await screen.findByText('Yüksek'));

    expect(onCommit).toHaveBeenCalledWith('HIGH');
  });
});