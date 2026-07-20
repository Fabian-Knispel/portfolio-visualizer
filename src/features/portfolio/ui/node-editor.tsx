import { ROOT_NODE_PATH, type IstNode, type NodePath, type PortfolioTab, type SollNode, isRootNodePath } from '../domain/portfolio-model';
import type { EditorDraft, NumericValidationResult, SollValueInputMode } from './portfolio-workspace-types';
import type { TreeNodeEntry } from './tree-view';

interface NodeEditorProps {
  selectedNode: SollNode | IstNode | null;
  activeViewMode: PortfolioTab;
  sollValueInputMode: SollValueInputMode;
  onSollValueInputModeChange(mode: SollValueInputMode): void;
  parentOptions: TreeNodeEntry[];
  readOnly: boolean;
  isRootSollSelection: boolean;
  draft: EditorDraft;
  onDraftChange(nextDraft: EditorDraft): void;
  renameError: string | null;
  saveSucceeded: boolean;
  editValueValidation: NumericValidationResult;
  onSave(): void;
  onDelete(): void;
}

function formatRelativePath(path: NodePath): string {
  return path === ROOT_NODE_PATH ? 'root' : path.replace(/^root\//, '');
}

export function NodeEditor({
  selectedNode,
  activeViewMode,
  sollValueInputMode,
  onSollValueInputModeChange,
  parentOptions,
  readOnly,
  isRootSollSelection,
  draft,
  onDraftChange,
  renameError,
  saveSucceeded,
  editValueValidation,
  onSave,
  onDelete,
}: NodeEditorProps) {
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
        onSave();
      }}
    >
      <div className="form-card__header">
        <h3>Bearbeiten</h3>
        <span>{readOnly ? 'Lesemodus' : activeViewMode.toUpperCase()}</span>
      </div>

      <label className="field">
        <span>Label</span>
        <input
          disabled={readOnly || isRootNodePath(selectedNode.path)}
          value={draft.label}
          onChange={(event) => onDraftChange({ ...draft, label: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSave();
            }
          }}
          placeholder="Knotenname"
        />
        {renameError !== null ? <p className="field__error" role="alert">{renameError}</p> : null}
      </label>

      <label className="field">
        <span>{isSollMode ? 'Eingabemodus' : 'Modus'}</span>
        <select
          disabled={readOnly || !isSollMode || isRootSollSelection}
          value={sollValueInputMode}
          onChange={(event) => onSollValueInputModeChange(event.target.value as SollValueInputMode)}
        >
          <option value="parent">% vom Parent</option>
          <option value="absolute">% gesamt (absolut)</option>
        </select>
      </label>

      <label className="field">
        <span>
          {isSollMode
            ? isSollAbsoluteMode
              ? 'Anteil gesamt in %'
              : 'Anteil am Parent in %'
            : isIstMode
              ? 'IST-Gesamtwert'
              : 'Wert'}
        </span>
        <input
          className={editValueValidation.error !== null ? 'field__input--error' : undefined}
          disabled={readOnly || isRootSollSelection}
          inputMode="decimal"
          value={draft.numericValue}
          aria-invalid={editValueValidation.error !== null}
          aria-describedby={editValueValidation.error !== null ? 'edit-numeric-error' : undefined}
          onChange={(event) => onDraftChange({ ...draft, numericValue: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSave();
            }
          }}
          placeholder={
            isSollMode
              ? isRootSollSelection
                ? 'Root = 100 % (fix)'
                : isSollAbsoluteMode
                  ? 'z. B. 20'
                  : 'z. B. 40'
              : 'z. B. 1000 (inkl. Kinder)'
          }
        />
      </label>
      {editValueValidation.error !== null ? <p className="field__error" id="edit-numeric-error" role="alert">{editValueValidation.error}</p> : null}

      <label className="field">
        <span>Parent</span>
        <select
          disabled={readOnly || isRootNodePath(selectedNode.path)}
          value={draft.parentPath}
          onChange={(event) => onDraftChange({ ...draft, parentPath: event.target.value })}
        >
          {isRootNodePath(selectedNode.path) ? <option value={ROOT_NODE_PATH}>Root (fest)</option> : null}
          {parentOptions.map((entry) => (
            <option key={entry.path} value={entry.path}>
              {formatRelativePath(entry.path)}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button
          className={`button button--primary ${saveSucceeded ? 'button--saved' : ''}`}
          disabled={readOnly || editValueValidation.error !== null}
          type="submit"
        >
          {saveSucceeded ? 'Gespeichert ✓' : 'Änderungen speichern'}
        </button>
        <button
          className="button button--ghost"
          disabled={readOnly || isRootNodePath(selectedNode.path)}
          onClick={onDelete}
          type="button"
        >
          Löschen
        </button>
      </div>
    </form>
  );
}
