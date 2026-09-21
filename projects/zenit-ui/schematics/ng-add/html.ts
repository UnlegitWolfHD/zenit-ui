/**
 * A tolerant scanner over the opening tags of an HTML document and the edits
 * `ng add` makes to `index.html`. No parser dependency: the schematic only has
 * to find `<html>`, `<head>`, `<meta charset>` and `<body>` and must not be
 * fooled by comments, raw text, `>` inside attribute values or unquoted values.
 *
 * Every edit is computed against the original text and applied in one pass.
 */
import { getEOL } from '@schematics/angular/utility/eol';

export interface HtmlAttribute {
  /** Lower-cased name. */
  name: string;
  /** `undefined` for an attribute without a value. */
  value: string | undefined;
  /** Offsets of the whole attribute, name to the end of its value. */
  start: number;
  end: number;
}

export interface HtmlTag {
  /** Lower-cased name. */
  name: string;
  start: number;
  /** Offset right after the tag name. */
  nameEnd: number;
  /** Offset right after the closing `>`. */
  end: number;
  attributes: HtmlAttribute[];
}

/** Replaces `[start, end)` of the original text; an insertion has `start === end`. */
export interface Edit {
  start: number;
  end: number;
  text: string;
}

/** Elements whose content is text, so a `<html` in there is not a tag. */
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

/** Opening tags in document order. Comments, raw text and closing tags are skipped. */
export function openingTags(html: string): HtmlTag[] {
  const lower = html.toLowerCase();
  const tagName = /<([a-zA-Z][^\s/>]*)/y;
  const attribute = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/y;
  const tags: HtmlTag[] = [];

  let index = 0;
  while ((index = html.indexOf('<', index)) !== -1) {
    if (html.startsWith('<!--', index)) {
      const close = html.indexOf('-->', index + 4);
      if (close === -1) {
        break; // an unterminated comment swallows the rest of the document
      }
      index = close + 3;
      continue;
    }

    tagName.lastIndex = index;
    const opened = tagName.exec(html);
    if (!opened) {
      index += 1; // closing tag, doctype or a stray `<`
      continue;
    }

    const tag: HtmlTag = {
      name: opened[1].toLowerCase(),
      start: index,
      nameEnd: tagName.lastIndex,
      end: -1,
      attributes: [],
    };
    let position = tag.nameEnd;
    while (position < html.length && html[position] !== '>') {
      attribute.lastIndex = position;
      const found = attribute.exec(html);
      if (!found) {
        position += 1; // whitespace, `/` or a stray quote
        continue;
      }
      tag.attributes.push({
        name: found[1].toLowerCase(),
        value: found[2] ?? found[3] ?? found[4],
        start: position,
        end: attribute.lastIndex,
      });
      position = attribute.lastIndex;
    }
    if (position >= html.length) {
      break; // the tag never closes
    }

    tag.end = position + 1;
    tags.push(tag);
    index = tag.end;
    if (RAW_TEXT.has(tag.name)) {
      const close = lower.indexOf(`</${tag.name}`, index);
      index = close === -1 ? html.length : close;
    }
  }

  return tags;
}

/** Applies edits whose offsets all refer to the original text. */
export function applyEdits(text: string, edits: Edit[]): string {
  let out = '';
  let cursor = 0;
  // The sort is stable, so insertions at the same offset keep their order.
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    out += text.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }

  return out + text.slice(cursor);
}

export interface IndexHtmlPlan {
  edits: Edit[];
  /** Tags the requested edits need and the document lacks. Non-empty: apply nothing. */
  missing: string[];
  /** Value of an existing `lang` on `<html>`; `undefined` when the plan sets `lang="de"`. */
  lang: string | undefined;
}

/**
 * Plans `z-root` on `<html>` and `<body>`, `lang="de"` when `<html>` has no
 * `lang`, and, when `scriptLines` is given, that block right after
 * `<meta charset>` or else as the first child of `<head>`.
 */
export function planIndexHtml(html: string, scriptLines?: string[]): IndexHtmlPlan {
  const tags = openingTags(html);
  const find = (name: string) => tags.find((tag) => tag.name === name);
  const plan: IndexHtmlPlan = { edits: [], missing: [], lang: undefined };

  const root = find('html');
  if (root) {
    const lang = root.attributes.find((attribute) => attribute.name === 'lang');
    plan.lang = lang ? (lang.value ?? '') : undefined;
    if (!lang) {
      plan.edits.push({ start: root.nameEnd, end: root.nameEnd, text: ' lang="de"' });
    }
  }
  for (const [label, tag] of [
    ['<html>', root],
    ['<body>', find('body')],
  ] as const) {
    if (tag) {
      plan.edits.push(...classEdit(tag));
    } else {
      plan.missing.push(label);
    }
  }

  if (scriptLines) {
    const head = find('head');
    const charset = tags.find(
      (tag) =>
        tag.name === 'meta' &&
        tag.attributes.some(
          ({ name, value }) =>
            name === 'charset' ||
            (name === 'http-equiv' && value?.toLowerCase() === 'content-type'),
        ),
    );
    const anchor = head && charset && charset.start > head.start ? charset : head;
    if (anchor) {
      const lineStart = html.lastIndexOf('\n', anchor.start) + 1;
      const before = html.slice(lineStart, anchor.start);
      const indent = (/^\s*$/.test(before) ? before : '') + (anchor === head ? '  ' : '');
      const eol = getEOL(html);
      plan.edits.push({
        start: anchor.end,
        end: anchor.end,
        text: scriptLines.map((line) => `${eol}${indent}${line}`).join(''),
      });
    } else {
      plan.missing.push('<head>');
    }
  }

  return plan;
}

/** Merges `z-root` into the class list of a tag, whatever the quoting. */
function classEdit(tag: HtmlTag): Edit[] {
  const existing = tag.attributes.find((attribute) => attribute.name === 'class');
  if (!existing) {
    const at = tag.attributes.at(-1)?.end ?? tag.nameEnd;

    return [{ start: at, end: at, text: ' class="z-root"' }];
  }

  const classes = (existing.value ?? '').split(/\s+/).filter(Boolean);
  if (classes.includes('z-root')) {
    return [];
  }

  const value = [...classes, 'z-root'].join(' ');
  const quote = value.includes('"') ? "'" : '"';

  return [{ start: existing.start, end: existing.end, text: `class=${quote}${value}${quote}` }];
}
