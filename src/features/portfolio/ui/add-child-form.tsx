import type { RefObject } from 'react';

import { type IstNode, type NodePath, type PortfolioTab, type SollNode } from '../domain/portfolio-model';
import type { EditorDraft, NumericValidationResult, SollValueInputMode } from './portfolio-workspace-types';

interface AddChildFormProps {
  selectedNode: SollNode | IstNode | null;
  activeViewMode: PortfolioTab;
  sollValueInputMode: SollValueInputMode;
  readOnly: boolean;
  draft: EditorDraft;
  onDraftChange(nextDraft: EditorDraft): void;
  childValueValidation: NumericValidationResult;
  childPathError: string | null;
  onAddChild(): void;
  childInputRef: RefObject<HTMLInputElement | null>;
}

function formatRelativePath(path: NodePath): string {
  return path === 'root' ? 'root' : path.replace(/^root\//, '');
}

export function AddChildForm({
  selectedNode,
  activeViewMode,
  sollValueInputMode,
  readOnly,
  draft,
  onDraftChange,
  childValueValidation,
  childPathError,
  onAddChild,
  childInputRef,
}: AddChildFormProps) {
  if (selectedNode === null) {
    return null;
  }

  const isSollMode = activeViewMode === 'soll';
  const isIstMode = activeViewMode === 'ist';
  const isSollAbsoluteMode = isSollMode && sollValueInputMode === 'absolute';

  return (
    <form
      className="form-card"
      onSubmit={(event) => {
        event.preventDefault();
        onAddChild();
      }}
    >
      <div className="form-card__header">
        <h3>Kind anlegen</h3>
        <span>unter {formatRelativePath(selectedNode.path)}</span>
      </div>

      <label className="field">
        <span>Neues Label</span>
        <input
          ref={childInputRef}
          disabled={readOnly}
          value={draft.childLabel}
          onChange={(event) => onDraftChange({ ...draft, childLabel: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onAddChild();
            }
          }}
          placeholder="z. B. USA"
        />
        {childPathError !== null ? <p className="field__error" role="alert">{childPathError}</p> : null}
      </label>

      <label className="field">
        <span>
          {isSollMode
            ? isSollAbsoluteMode
              ? 'Neuer Anteil gesamt in %'
              : 'Neuer Anteil am Parent in %'
            : isIstMode
              ? 'Neuer IST-Wert'
              : 'Wert'}
        </span>
        <input
          className={childValueValidation.error !== null ? 'field__input--error' : undefined}
          disabled={readOnly}
          inputMode="decimal"
          value={draft.childNumericValue}
          aria-invalid={childValueValidation.error !== null}
          aria-describedby={childValueValidation.error !== null ? 'child-numeric-error' : undefined}
          onChange={(event) => onDraftChange({ ...draft, childNumericValue: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onAddChild();
            }
          }}
          placeholder={isSollMode ? (isSollAbsoluteMode ? 'z. B. 12' : 'z. B. 40') : 'z. B. 250'}
        />
      </label>
      {childValueValidation.error !== null ? <p className="field__error" id="child-numeric-error" role="alert">{childValueValidation.error}</p> : null}

      <button
        className="button button--primary"
        disabled={readOnly || draft.childLabel.trim().length === 0 || childValueValidation.error !== null}
        type="submit"
      >
        Kind anlegen
      </button>
    </form>
  );
}
