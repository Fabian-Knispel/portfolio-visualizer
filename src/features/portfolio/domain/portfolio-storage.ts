import { IstNode, SollNode } from './portfolio-model';

const ROOT_NODE_PATH = 'root';
const HUNDRED = 100;

export interface PortfolioStorageState {
  sollRoot: SollNode | null;
  istRoot: IstNode | null;
}

export interface PortfolioStorageEnvelope {
  version: 1;
  state: PortfolioStorageState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PortfolioStorageLoadResult {
  state: PortfolioStorageState;
  error: string | null;
}

export interface PortfolioStorageSaveResult {
  success: boolean;
  error: string | null;
}

export const PORTFOLIO_STORAGE_KEY = 'portfolio-visualizer.portfolio-state.v1';

export function createEmptyPortfolioStorageState(): PortfolioStorageState {
  return {
    sollRoot: null,
    istRoot: null,
  };
}

function getDefaultStorage(): StorageLike | null {
  const globalStorage = globalThis as typeof globalThis & { localStorage?: StorageLike };

  return globalStorage.localStorage ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidChildren(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isPortfolioNodeBase(value: unknown): value is { path: string; label: string; children: unknown[] } {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.path) && isString(value.label) && isValidChildren(value.children);
}

function isSollNode(value: unknown): value is SollNode {
  if (!isPortfolioNodeBase(value)) {
    return false;
  }

  if ('targetPct' in value && value.targetPct !== undefined && !isNumber(value.targetPct)) {
    return false;
  }

  if ('targetPctOfParent' in value && value.targetPctOfParent !== undefined && !isNumber(value.targetPctOfParent)) {
    return false;
  }

  return value.children.every((child) => isSollNode(child));
}

function isIstNode(value: unknown): value is IstNode {
  if (!isPortfolioNodeBase(value)) {
    return false;
  }

  if ('ownValue' in value && value.ownValue !== undefined && !isNumber(value.ownValue)) {
    return false;
  }

  return value.children.every((child) => isIstNode(child));
}

function isPortfolioStorageState(value: unknown): value is PortfolioStorageState {
  if (!isRecord(value)) {
    return false;
  }

  return ('sollRoot' in value ? value.sollRoot === null || isSollNode(value.sollRoot) : true)
    && ('istRoot' in value ? value.istRoot === null || isIstNode(value.istRoot) : true);
}

function isPortfolioStorageEnvelope(value: unknown): value is PortfolioStorageEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  return value.version === 1 && isRecord(value.state) && isPortfolioStorageState(value.state);
}

function parseStorageError(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function toFiniteNumber(value: number | undefined): number | undefined {
  return Number.isFinite(value ?? Number.NaN) ? value : undefined;
}

function sumLegacyChildAbsoluteTargets(children: SollNode[]): number {
  return children.reduce((sum, child) => sum + (toFiniteNumber(child.targetPct) ?? 0), 0);
}

interface SollMigrationResult {
  node: SollNode;
  absoluteTargetPct: number;
  migrated: boolean;
}

function migrateSollNode(node: SollNode, parentAbsoluteTargetPct?: number): SollMigrationResult {
  const isRoot = node.path === ROOT_NODE_PATH;
  const parentAbsolute = toFiniteNumber(parentAbsoluteTargetPct);
  const absoluteTargetPctFromLegacy = toFiniteNumber(node.targetPct);
  const targetPctOfParent = toFiniteNumber(node.targetPctOfParent);
  const inferredAbsoluteTargetPct = sumLegacyChildAbsoluteTargets(node.children);

  let absoluteTargetPct = isRoot ? HUNDRED : absoluteTargetPctFromLegacy ?? inferredAbsoluteTargetPct;
  let nextTargetPctOfParent = targetPctOfParent;
  let migrated = false;

  if (!isRoot && targetPctOfParent !== undefined && parentAbsolute !== undefined) {
    absoluteTargetPct = parentAbsolute * (targetPctOfParent / HUNDRED);
  }

  if (!isRoot && nextTargetPctOfParent === undefined && parentAbsolute !== undefined && parentAbsolute !== 0) {
    nextTargetPctOfParent = (absoluteTargetPct / parentAbsolute) * HUNDRED;
    migrated = true;
  }

  const migratedChildren = node.children.map((child) => migrateSollNode(child, absoluteTargetPct));
  const childrenMigrated = migratedChildren.some((result) => result.migrated);

  const nextNode: SollNode = migrated || childrenMigrated
    ? {
      ...node,
      targetPctOfParent: nextTargetPctOfParent,
      children: migratedChildren.map((result) => result.node),
    }
    : node;

  return {
    node: nextNode,
    absoluteTargetPct,
    migrated: migrated || childrenMigrated,
  };
}

function migrateStorageState(state: PortfolioStorageState): { state: PortfolioStorageState; migrated: boolean } {
  if (state.sollRoot === null) {
    return { state, migrated: false };
  }

  const migratedSoll = migrateSollNode(state.sollRoot);

  if (!migratedSoll.migrated) {
    return { state, migrated: false };
  }

  return {
    state: {
      ...state,
      sollRoot: migratedSoll.node,
    },
    migrated: true,
  };
}

export function loadPortfolioStorageState(storage: StorageLike | null = getDefaultStorage()): PortfolioStorageLoadResult {
  const emptyState = createEmptyPortfolioStorageState();

  if (storage === null) {
    return { state: emptyState, error: null };
  }

  try {
    const rawValue = storage.getItem(PORTFOLIO_STORAGE_KEY);

    if (rawValue === null || rawValue.trim().length === 0) {
      return { state: emptyState, error: null };
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isPortfolioStorageEnvelope(parsedValue)) {
      return {
        state: emptyState,
        error: 'Gespeicherte Portfolio-Daten waren ungültig und wurden zurückgesetzt.',
      };
    }

    const migratedStateResult = migrateStorageState(parsedValue.state);

    if (!migratedStateResult.migrated) {
      return {
        state: parsedValue.state,
        error: null,
      };
    }

    const saveResult = savePortfolioStorageState(migratedStateResult.state, storage);

    return {
      state: migratedStateResult.state,
      error: saveResult.success
        ? null
        : `SOLL-Migration konnte nicht gespeichert werden: ${saveResult.error ?? 'Unbekannter Fehler.'}`,
    };
  } catch (error) {
    return {
      state: emptyState,
      error: parseStorageError(error, 'Gespeicherte Portfolio-Daten konnten nicht geladen werden.'),
    };
  }
}

export function savePortfolioStorageState(
  state: PortfolioStorageState,
  storage: StorageLike | null = getDefaultStorage()
): PortfolioStorageSaveResult {
  if (storage === null) {
    return {
      success: false,
      error: 'Lokaler Speicher ist in dieser Umgebung nicht verfügbar.',
    };
  }

  try {
    const envelope: PortfolioStorageEnvelope = {
      version: 1,
      state,
    };

    storage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(envelope));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: parseStorageError(error, 'Portfolio-Daten konnten nicht gespeichert werden.'),
    };
  }
}
