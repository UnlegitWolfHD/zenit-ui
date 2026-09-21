/** Options of `ng generate zenit-ui:migrate-material`. */
export interface Schema {
  /** Workspace-relative folder or file. Only files under it are written. */
  path: string;
  /** Project the path belongs to; a path outside of it is refused. */
  project?: string;
  /** Workspace-relative path of the Markdown report; the JSON twin sits next to it. */
  report?: string;
  /** Comma-separated subset of `icon,button,tooltip,spinner,chip,imports`. */
  rules?: string;
  /** Print the full report to the console. Default: only in a dry run. */
  printReport?: boolean;
}
