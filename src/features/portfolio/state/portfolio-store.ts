import {
  IstNode,
  NodePath,
  SollNode,
  appendNodeToTree,
  moveNodeInTree,
  removeNodeFromTree,
  renameNodeInTree,
  updateNodeInTree,
} from '../domain/portfolio-model';
import {
  PortfolioStorageState,
  StorageLike,
  loadPortfolioStorageState,
  savePortfolioStorageState,
} from '../domain/portfolio-storage';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';

export interface PortfolioStoreSnapshot extends PortfolioStorageState {
  loadError: string | null;
  saveError: string | null;
}

export interface RenameResult {
  snapshot: PortfolioStoreSnapshot;
  newPath: NodePath | null;
}

export type PortfolioStoreListener = (state: PortfolioStoreSnapshot) => void;

export interface PortfolioStore {
  readonly stateStore: StoreApi<PortfolioStoreSnapshot>;
  getState(): PortfolioStoreSnapshot;
  subscribe(listener: PortfolioStoreListener): () => void;
  setSollRoot(root: SollNode | null): PortfolioStoreSnapshot;
  setIstRoot(root: IstNode | null): PortfolioStoreSnapshot;
  updateSollNode(path: NodePath, updater: (node: SollNode) => SollNode): PortfolioStoreSnapshot;
  updateIstNode(path: NodePath, updater: (node: IstNode) => IstNode): PortfolioStoreSnapshot;
  appendSollNode(parentPath: NodePath, childNode: SollNode): PortfolioStoreSnapshot;
  appendIstNode(parentPath: NodePath, childNode: IstNode): PortfolioStoreSnapshot;
  moveSollNode(path: NodePath, newParentPath: NodePath): PortfolioStoreSnapshot;
  moveIstNode(path: NodePath, newParentPath: NodePath): PortfolioStoreSnapshot;
  renameSollNode(oldPath: NodePath, newLabel: string): RenameResult;
  renameIstNode(oldPath: NodePath, newLabel: string): RenameResult;
  removeSollNode(path: NodePath): PortfolioStoreSnapshot;
  removeIstNode(path: NodePath): PortfolioStoreSnapshot;
  replaceState(state: PortfolioStorageState): PortfolioStoreSnapshot;
  reloadFromStorage(): PortfolioStoreSnapshot;
  saveNow(): PortfolioStoreSnapshot;
}

function createStoreSnapshot(state: PortfolioStorageState, loadError: string | null, saveError: string | null): PortfolioStoreSnapshot {
  return {
    sollRoot: state.sollRoot,
    istRoot: state.istRoot,
    loadError,
    saveError,
  };
}

function saveStateOrReport(state: PortfolioStorageState, storage: StorageLike | null | undefined): string | null {
  const result = savePortfolioStorageState(state, storage);

  return result.success ? null : result.error;
}

export function createPortfolioStore(
  initialState?: PortfolioStorageState,
  storage?: StorageLike | null
): PortfolioStore {
  const initialLoad = initialState === undefined
    ? loadPortfolioStorageState(storage)
    : { state: initialState, error: null };

  let currentState = initialLoad.state;
  let loadError = initialLoad.error;
  let saveError: string | null = initialLoad.error;
  const stateStore = createStore<PortfolioStoreSnapshot>(() => createStoreSnapshot(currentState, loadError, saveError));

  function emit(): PortfolioStoreSnapshot {
    const nextSnapshot = createStoreSnapshot(currentState, loadError, saveError);

    stateStore.setState(nextSnapshot, true);

    return nextSnapshot;
  }

  function persistCurrentState(): PortfolioStoreSnapshot {
    saveError = saveStateOrReport(currentState, storage);

    return emit();
  }

  function setCurrentState(nextState: PortfolioStorageState): PortfolioStoreSnapshot {
    currentState = nextState;

    return persistCurrentState();
  }

  return {
    stateStore,

    getState() {
      return stateStore.getState();
    },

    subscribe(listener: PortfolioStoreListener) {
      const unsubscribe = stateStore.subscribe((nextState) => listener(nextState));

      listener(stateStore.getState());

      return unsubscribe;
    },

    setSollRoot(root: SollNode | null) {
      return setCurrentState({
        ...currentState,
        sollRoot: root,
      });
    },

    setIstRoot(root: IstNode | null) {
      return setCurrentState({
        ...currentState,
        istRoot: root,
      });
    },

    updateSollNode(path: NodePath, updater: (node: SollNode) => SollNode) {
      if (currentState.sollRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        sollRoot: updateNodeInTree(currentState.sollRoot, path, updater),
      });
    },

    updateIstNode(path: NodePath, updater: (node: IstNode) => IstNode) {
      if (currentState.istRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        istRoot: updateNodeInTree(currentState.istRoot, path, updater),
      });
    },

    appendSollNode(parentPath: NodePath, childNode: SollNode) {
      if (currentState.sollRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        sollRoot: appendNodeToTree(currentState.sollRoot, parentPath, childNode),
      });
    },

    appendIstNode(parentPath: NodePath, childNode: IstNode) {
      if (currentState.istRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        istRoot: appendNodeToTree(currentState.istRoot, parentPath, childNode),
      });
    },

    moveSollNode(path: NodePath, newParentPath: NodePath) {
      if (currentState.sollRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        sollRoot: moveNodeInTree(currentState.sollRoot, path, newParentPath),
      });
    },

    moveIstNode(path: NodePath, newParentPath: NodePath) {
      if (currentState.istRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        istRoot: moveNodeInTree(currentState.istRoot, path, newParentPath),
      });
    },

    renameSollNode(oldPath: NodePath, newLabel: string) {
      if (currentState.sollRoot === null) {
        return { snapshot: emit(), newPath: null };
      }

      const result = renameNodeInTree(currentState.sollRoot, oldPath, newLabel);

      if (result.newPath === null) {
        return { snapshot: emit(), newPath: null };
      }

      return {
        snapshot: setCurrentState({
          ...currentState,
          sollRoot: result.tree,
        }),
        newPath: result.newPath,
      };
    },

    renameIstNode(oldPath: NodePath, newLabel: string) {
      if (currentState.istRoot === null) {
        return { snapshot: emit(), newPath: null };
      }

      const result = renameNodeInTree(currentState.istRoot, oldPath, newLabel);

      if (result.newPath === null) {
        return { snapshot: emit(), newPath: null };
      }

      return {
        snapshot: setCurrentState({
          ...currentState,
          istRoot: result.tree,
        }),
        newPath: result.newPath,
      };
    },

    removeSollNode(path: NodePath) {
      if (currentState.sollRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        sollRoot: removeNodeFromTree(currentState.sollRoot, path),
      });
    },

    removeIstNode(path: NodePath) {
      if (currentState.istRoot === null) {
        return emit();
      }

      return setCurrentState({
        ...currentState,
        istRoot: removeNodeFromTree(currentState.istRoot, path),
      });
    },

    replaceState(state: PortfolioStorageState) {
      return setCurrentState({
        sollRoot: state.sollRoot,
        istRoot: state.istRoot,
      });
    },

    reloadFromStorage() {
      const loadedState = loadPortfolioStorageState(storage);

      currentState = loadedState.state;
      loadError = loadedState.error;
      saveError = loadedState.error;

      return emit();
    },

    saveNow() {
      return persistCurrentState();
    },
  };
}

export const portfolioStore = createPortfolioStore();

export function usePortfolioStoreSnapshot(): PortfolioStoreSnapshot {
  return useStore(portfolioStore.stateStore, (state) => state);
}
