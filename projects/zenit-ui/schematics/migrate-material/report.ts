/**
 * The report of `migrate-material`, as data, as JSON and as Markdown. Both
 * renderings are deterministic: no timestamps, files and findings sorted, paths
 * workspace-relative with forward slashes.
 */
import { RULES, RuleName, replacementFor } from './tables';
import { FindingKind } from './template';

export interface ReportedFinding {
  line: number;
  column: number;
  rule: string;
  kind: FindingKind;
  code: string;
  reason: string;
  fix: string;
}

export interface FileReport {
  path: string;
  status: 'changed' | 'unchanged' | 'unparsed';
  converted: Partial<Record<RuleName, number>>;
  findings: ReportedFinding[];
  /** Material tag and attribute names left in the template(s) of this file. */
  remaining: Record<string, number>;
  /** Counts of Material leftovers in a stylesheet, which is never edited. */
  styleDebt?: Record<string, number>;
}

export interface Report {
  schema: 1;
  path: string;
  rules: RuleName[];
  /** `true`: nothing was written, positions refer to the files as they are. */
  dryRun: boolean;
  totals: { filesScanned: number; filesChanged: number; converted: number; findings: number };
  summary: Record<string, Record<'converted' | FindingKind, number>>;
  remaining: { name: string; count: number; replacement: string }[];
  files: FileReport[];
}

export function buildReport(
  path: string,
  rules: RuleName[],
  dryRun: boolean,
  filesScanned: number,
  files: FileReport[],
): Report {
  const listed = files
    .filter(
      (file) =>
        file.status !== 'unchanged' ||
        file.findings.length > 0 ||
        Object.keys(file.remaining).length > 0 ||
        file.styleDebt,
    )
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const summary: Report['summary'] = {};
  const row = (rule: string) => (summary[rule] ??= { converted: 0, manual: 0, review: 0, info: 0 });
  RULES.forEach(row);
  const remaining: Record<string, number> = {};
  for (const file of listed) {
    for (const [rule, count] of Object.entries(file.converted)) {
      row(rule).converted += count;
    }
    for (const finding of file.findings) {
      row(finding.rule)[finding.kind] += 1;
    }
    for (const [name, count] of Object.entries(file.remaining)) {
      remaining[name] = (remaining[name] ?? 0) + count;
    }
    file.findings.sort(
      (a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code),
    );
  }

  return {
    schema: 1,
    path,
    rules,
    dryRun,
    totals: {
      filesScanned,
      filesChanged: listed.filter((file) => file.status === 'changed').length,
      converted: Object.values(summary).reduce((sum, entry) => sum + entry.converted, 0),
      findings: listed.reduce((sum, file) => sum + file.findings.length, 0),
    },
    summary,
    remaining: sortedCounts(remaining),
    files: listed,
  };
}

function sortedCounts(counts: Record<string, number>): Report['remaining'] {
  return Object.keys(counts)
    .sort()
    .map((name) => ({ name, count: counts[name], replacement: replacementFor(name) }));
}

export function renderJson(report: Report): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

/** A table cell: one line, no pipe that would end the cell. */
function cell(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\|/g, '\\|');
}

export function renderMarkdown(report: Report): string {
  const out: string[] = [
    '# zenit-ui migration report',
    '',
    `Path \`${report.path}\`, rules ${report.rules.join(', ')}. ` +
      (report.dryRun
        ? 'Dry run: nothing was written, lines refer to the files as they are.'
        : 'Applied: lines refer to the files after the run.'),
    '',
    `${report.totals.filesScanned} files scanned, ${report.totals.filesChanged} changed, ` +
      `${report.totals.converted} spots converted, ${report.totals.findings} findings.`,
    '',
    '- **manual**: not converted, a human has to do it.',
    '- **review**: converted, but something changed that needs a look.',
    '- **info**: converted, what was dropped has no effect in zenit-ui.',
    '',
    '## Summary',
    '',
    '| Rule | Converted | Manual | Review | Info |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...Object.keys(report.summary).map((rule) => {
      const entry = report.summary[rule];

      return `| ${rule} | ${entry.converted} | ${entry.manual} | ${entry.review} | ${entry.info} |`;
    }),
    '',
  ];

  if (report.remaining.length > 0) {
    out.push(
      '## Left for manual migration',
      '',
      'Material tags and attributes still in the templates after this run.',
      '',
      '| Selector | Count | zenit-ui replacement |',
      '| --- | ---: | --- |',
      ...report.remaining.map(
        ({ name, count, replacement }) => `| \`${name}\` | ${count} | ${cell(replacement)} |`,
      ),
      '',
    );
  }

  const styles = report.files.filter((file) => file.styleDebt);
  if (styles.length > 0) {
    const columns = Object.keys(styles[0].styleDebt ?? {});
    out.push(
      '## Style debt',
      '',
      'Stylesheets are never edited. Every count is a place where application CSS reaches into Material.',
      '',
      `| File | ${columns.map(cell).join(' | ')} |`,
      `| --- | ${columns.map(() => '---:').join(' | ')} |`,
      ...styles.map(
        (file) =>
          `| \`${file.path}\` | ${columns.map((column) => file.styleDebt?.[column] ?? 0).join(' | ')} |`,
      ),
      '',
    );
  }

  const files = report.files.filter((file) => !file.styleDebt);
  if (files.length > 0) {
    out.push('## Files', '');
  }
  for (const file of files) {
    const converted = Object.entries(file.converted)
      .filter(([, count]) => count > 0)
      .map(([rule, count]) => `${rule} ${count}`);
    out.push(
      `### \`${file.path}\``,
      '',
      `${file.status}${converted.length ? `, converted: ${converted.join(', ')}` : ''}`,
      '',
    );

    const rows = file.findings.filter((finding) => finding.kind !== 'info');
    if (rows.length > 0) {
      out.push(
        '| Line:Col | Rule | Kind | Code | Reason | Suggested fix |',
        '| --- | --- | --- | --- | --- | --- |',
        ...rows.map(
          (f) =>
            `| ${f.line}:${f.column} | ${f.rule} | ${f.kind} | ${f.code} | ${cell(f.reason)} | ${cell(f.fix)} |`,
        ),
        '',
      );
    }

    // Harmless drops are many and alike: one line per code instead of one row each.
    const infos = file.findings.filter((finding) => finding.kind === 'info');
    for (const code of [...new Set(infos.map((finding) => finding.code))].sort()) {
      const lines = infos.filter((finding) => finding.code === code).map((finding) => finding.line);
      out.push(`- info \`${code}\` x${lines.length}, lines ${lines.join(', ')}`);
    }
    if (infos.length > 0) {
      out.push('');
    }

    const remaining = sortedCounts(file.remaining);
    if (remaining.length > 0) {
      out.push(
        `Left: ${remaining.map(({ name, count }) => `\`${name}\` x${count}`).join(', ')}`,
        '',
      );
    }
  }

  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}
