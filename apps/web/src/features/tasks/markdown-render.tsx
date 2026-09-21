import type { ReactNode } from 'react';

export type MarkdownInline =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'strong'; readonly children: readonly MarkdownInline[] }
  | { readonly type: 'em'; readonly children: readonly MarkdownInline[] }
  | { readonly type: 'code'; readonly value: string }
  | { readonly type: 'link'; readonly href: string; readonly children: readonly MarkdownInline[] };

type MarkdownListItem = {
  readonly checked: boolean | null;
  readonly children: readonly MarkdownInline[];
};

type MarkdownBlock =
  | { readonly type: 'paragraph'; readonly children: readonly MarkdownInline[] }
  | {
      readonly type: 'heading';
      readonly level: 1 | 2 | 3;
      readonly children: readonly MarkdownInline[];
    }
  | { readonly type: 'ul'; readonly items: readonly MarkdownListItem[] }
  | { readonly type: 'ol'; readonly items: readonly MarkdownListItem[] }
  | { readonly type: 'blockquote'; readonly blocks: readonly MarkdownBlock[] }
  | { readonly type: 'code'; readonly value: string };

export function sanitizeHref(raw: string): string | null {
  const href = raw.trim();
  if (href.length === 0) {
    return null;
  }
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9]/.test(ch);
}

function parseInline(source: string): readonly MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  let i = 0;
  let text = '';

  const flushText = () => {
    if (text.length > 0) {
      nodes.push({ type: 'text', value: text });
      text = '';
    }
  };

  while (i < source.length) {
    const rest = source.slice(i);
    const ch = rest[0];

    if (ch === undefined) {
      break;
    }

    if (ch === '`') {
      const close = source.indexOf('`', i + 1);
      if (close !== -1) {
        flushText();
        nodes.push({ type: 'code', value: source.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }

    if (rest.startsWith('**')) {
      const close = source.indexOf('**', i + 2);
      if (close !== -1) {
        flushText();
        nodes.push({ type: 'strong', children: parseInline(source.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
    }

    if (ch === '_' || ch === '*') {
      const intraword = ch === '_' && isWordChar(source[i - 1]) && isWordChar(source[i + 1]);
      if (!intraword) {
        const close = source.indexOf(ch, i + 1);
        if (close !== -1) {
          flushText();
          nodes.push({ type: 'em', children: parseInline(source.slice(i + 1, close)) });
          i = close + 1;
          continue;
        }
      }
    }

    if (ch === '[') {
      const close = source.indexOf(']', i + 1);
      if (close !== -1 && source[close + 1] === '(') {
        const closeParen = source.indexOf(')', close + 2);
        if (closeParen !== -1) {
          const href = sanitizeHref(source.slice(close + 2, closeParen));
          if (href !== null) {
            flushText();
            nodes.push({ type: 'link', href, children: parseInline(source.slice(i + 1, close)) });
            i = closeParen + 1;
            continue;
          }
        }
      }
    }

    text += ch;
    i += 1;
  }

  flushText();
  return nodes;
}

const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const UL_ITEM_RE = /^(?:[-*])\s+(?:\[([ xX])\]\s+)?(.+)$/;
const OL_ITEM_RE = /^(\d+)\.\s+(.+)$/;

function startsBlock(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    HEADING_RE.test(trimmed) ||
    trimmed.startsWith('```') ||
    trimmed.startsWith('>') ||
    UL_ITEM_RE.test(trimmed) ||
    OL_ITEM_RE.test(trimmed)
  );
}

function parseBlocks(source: string): readonly MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined) {
      break;
    }
    const trimmed = line.trim();

    if (trimmed === '') {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length) {
        const codeLine = lines[i];
        if (codeLine === undefined) {
          break;
        }
        if (codeLine.trim().startsWith('```')) {
          i += 1;
          break;
        }
        codeLines.push(codeLine);
        i += 1;
      }
      blocks.push({ type: 'code', value: codeLines.join('\n') });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const quoteLine = lines[i];
        if (quoteLine === undefined) {
          break;
        }
        if (!quoteLine.trimStart().startsWith('>')) {
          break;
        }
        quoteLines.push(quoteLine.trimStart().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', blocks: parseBlocks(quoteLines.join('\n')) });
      continue;
    }

    const heading = trimmed.match(HEADING_RE);
    if (heading !== null) {
      const levelMatch = heading[1];
      const content = heading[2];
      let level: 1 | 2 | 3 = 3;
      if (levelMatch === '#') level = 1;
      else if (levelMatch === '##') level = 2;
      blocks.push({
        type: 'heading',
        level,
        children: content === undefined ? [] : parseInline(content),
      });
      i += 1;
      continue;
    }

    if (UL_ITEM_RE.test(trimmed)) {
      const items: MarkdownListItem[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        if (itemLine === undefined) {
          break;
        }
        const content = itemLine.trim().match(UL_ITEM_RE);
        if (content === null) {
          break;
        }
        const marker = content[1];
        const body = content[2];
        const checked = marker === undefined ? null : marker === 'x' || marker === 'X';
        items.push({ checked, children: parseInline(body ?? '') });
        i += 1;
      }
      if (items.length > 0) {
        blocks.push({ type: 'ul', items });
      }
      continue;
    }

    if (OL_ITEM_RE.test(trimmed)) {
      const items: MarkdownListItem[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        if (itemLine === undefined) {
          break;
        }
        const content = itemLine.trim().match(OL_ITEM_RE);
        if (content === null) {
          break;
        }
        const body = content[2];
        items.push({ checked: null, children: parseInline(body ?? '') });
        i += 1;
      }
      if (items.length > 0) {
        blocks.push({ type: 'ol', items });
      }
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const paraLine = lines[i];
      if (paraLine === undefined) {
        break;
      }
      if (startsBlock(paraLine)) {
        break;
      }
      paragraphLines.push(paraLine);
      i += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', children: parseInline(paragraphLines.join('\n')) });
    }
  }

  return blocks;
}

const HEADING_TAGS: { readonly [level in 1 | 2 | 3]: 'h1' | 'h2' | 'h3' } = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
};

function renderInlines(nodes: readonly MarkdownInline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case 'text':
        return node.value;
      case 'code':
        return (
          <code
            key={key}
            className="rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[0.875em] text-foreground"
          >
            {node.value}
          </code>
        );
      case 'strong':
        return <strong key={key}>{renderInlines(node.children, key)}</strong>;
      case 'em':
        return <em key={key}>{renderInlines(node.children, key)}</em>;
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {renderInlines(node.children, key)}
          </a>
        );
    }
  });
}

function renderListItem(item: MarkdownListItem, key: string): ReactNode {
  if (item.checked === null) {
    return <li key={key}>{renderInlines(item.children, key)}</li>;
  }
  return (
    <li
      key={key}
      className={
        item.checked
          ? 'flex items-start gap-2 text-muted-foreground line-through'
          : 'flex items-start gap-2'
      }
    >
      <span
        aria-hidden="true"
        className={
          item.checked
            ? 'mt-1.5 size-3.5 shrink-0 rounded-[4px] border border-emerald-500/60 bg-emerald-500/15'
            : 'mt-1.5 size-3.5 shrink-0 rounded-[4px] border border-border'
        }
      />
      <span className="min-w-0">{renderInlines(item.children, key)}</span>
    </li>
  );
}

function renderBlock(block: MarkdownBlock, key: string): ReactNode {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={key} className="whitespace-pre-line leading-relaxed">
          {renderInlines(block.children, key)}
        </p>
      );
    case 'heading': {
      const Tag = HEADING_TAGS[block.level];
      const className =
        block.level === 1
          ? 'scroll-m-4 text-lg font-semibold tracking-tight'
          : block.level === 2
            ? 'scroll-m-4 text-base font-semibold tracking-tight'
            : 'scroll-m-4 text-sm font-semibold';
      return (
        <Tag key={key} className={className}>
          {renderInlines(block.children, key)}
        </Tag>
      );
    }
    case 'ul':
      return (
        <ul key={key} className="list-none space-y-1.5">
          {block.items.map((item, index) => renderListItem(item, `${key}-${index}`))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} className="list-decimal space-y-1.5 pl-4">
          {block.items.map((item, index) => renderListItem(item, `${key}-${index}`))}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="rounded-r-lg border-l-2 border-border/70 pl-3 text-muted-foreground"
        >
          {block.blocks.map((inner, index) => renderBlock(inner, `${key}-${index}`))}
        </blockquote>
      );
    case 'code':
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-xl border border-border/70 bg-muted/60 p-3 font-mono text-sm"
        >
          <code>{block.value}</code>
        </pre>
      );
  }
}

export function renderMarkdown(source: string): ReactNode[] {
  return parseBlocks(source).map((block, index) => renderBlock(block, `md-${index}`));
}
