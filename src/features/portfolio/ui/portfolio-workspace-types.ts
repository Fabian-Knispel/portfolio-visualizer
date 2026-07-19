import type { NodePath } from '../domain/portfolio-model';

export type SollValueInputMode = 'parent' | 'absolute';

export interface EditorDraft {
  label: string;
  numericValue: string;
  parentPath: NodePath;
  childLabel: string;
  childNumericValue: string;
}

export interface NumericValidationResult {
  parsedValue: number | undefined;
  error: string | null;
}
