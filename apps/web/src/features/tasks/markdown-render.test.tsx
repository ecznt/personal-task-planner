import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderMarkdown, sanitizeHref } from './markdown-render';

function renderSource(source: string): HTMLElement {
  const { container } = render(<div>{renderMarkdown(source)}</div>);
  return container;
}

describe('markdown-render', () => {
  it('renders plain text as a paragraph', () => {
    const container = renderSource('Basit bir not.');
    expect(container.querySelector('p')?.textContent).toBe('Basit bir not.');
  });

  it('renders a parağıraph per blank-line separated block', () => {
    const container = renderSource('İlk paragraf\n\nİkinci paragraf');
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('keeps single newlines inline (pre-line behavior)', () => {
    const container = renderSource('Satır bir\nSatır iki');
    expect(container.querySelector('p')?.className).toContain('whitespace-pre-line');
    expect(container.querySelector('p')?.textContent).toBe('Satır bir\nSatır iki');
  });

  it('renders headings with the right level', () => {
    const container = renderSource('# Bir\n\n## İki\n\n### Üç');
    expect(container.querySelector('h1')?.textContent).toBe('Bir');
    expect(container.querySelector('h2')?.textContent).toBe('İki');
    expect(container.querySelector('h3')?.textContent).toBe('Üç');
  });

  it('renders strong, emphasis and inline code', () => {
    const container = renderSource('**kalın** ve *vurgu* ve `kod`');
    expect(container.querySelector('strong')?.textContent).toBe('kalın');
    expect(container.querySelector('em')?.textContent).toBe('vurgu');
    expect(container.querySelector('code')?.textContent).toBe('kod');
  });

  it('does not treat intraword underscores as emphasis', () => {
    const container = renderSource('snake_case değeri');
    expect(container.querySelector('em')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('snake_case değeri');
  });

  it('renders unordered and ordered lists', () => {
    const container = renderSource('- elma\n- armut\n\n1. bir\n2. iki');
    const ul = container.querySelector('ul');
    const ol = container.querySelector('ol');
    expect(ul?.children).toHaveLength(2);
    expect(ol?.children).toHaveLength(2);
    expect(ul?.textContent).toContain('elma');
    expect(ol?.textContent).toContain('iki');
  });

  it('renders task-list checkboxes (read-only, dimmed when checked)', () => {
    const container = renderSource('- [ ] Yapılacak\n- [x] Tamam');
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[1]?.className).toContain('line-through');
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('renders http/https links with safe rel and target', () => {
    const container = renderSource('[Docs](https://example.com/docs)');
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/docs');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders fenced code blocks', () => {
    const container = renderSource('```\nconst x = 1;\n```');
    const pre = container.querySelector('pre');
    expect(pre?.textContent).toBe('const x = 1;');
  });

  it('renders block quotes', () => {
    const container = renderSource('> Bir alıntı');
    expect(container.querySelector('blockquote')?.textContent).toBe('Bir alıntı');
  });

  it('escapes raw HTML and never injects it', () => {
    const container = renderSource('<img src=x onerror=alert(1)>');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('renders javascript: links as plain text, not anchors', () => {
    const container = renderSource('[tıkla](javascript:alert(1))');
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('[tıkla](javascript:alert(1))');
  });

  it('renders data: links as plain text, not anchors', () => {
    const container = renderSource('[tıkla](data:text/html;base64,PGI+ZXh0PC9pPg==)');
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders malformed links as plain text', () => {
    const container = renderSource('[x](not-a-url)');
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('[x](not-a-url)');
  });
});

describe('sanitizeHref', () => {
  it('allows http and https', () => {
    expect(sanitizeHref('https://example.com')).toBe('https://example.com/');
    expect(sanitizeHref('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
  });

  it('blocks javascript, data and other schemes', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBeNull();
    expect(sanitizeHref('data:text/html,<b>hi</b>')).toBeNull();
    expect(sanitizeHref('file:///etc/passwd')).toBeNull();
    expect(sanitizeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('blocks empty and bare text', () => {
    expect(sanitizeHref('')).toBeNull();
    expect(sanitizeHref('   ')).toBeNull();
    expect(sanitizeHref('example.com')).toBeNull();
  });
});
