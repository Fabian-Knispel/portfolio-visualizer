import { IstNode, SollNode } from '../domain/portfolio-model';
import {
  PortfolioStorageState,
  loadPortfolioStorageState,
  savePortfolioStorageState,
} from '../domain/portfolio-storage';

export interface PortfolioStoreSnapshot extends PortfolioStorageState {
  loadError: string | null;
  saveError: string | null;
}

export type PortfolioStoreListener = (state: PortfolioStoreSnapshot) => void;

export interface PortfolioStore {
  getState(): PortfolioStoreSnapshot;
  subscribe(listener: PortfolioStoreListener): () => void;
  setSollRoot(root: SollNode | null): PortfolioStoreSnapshot;
  setIstRoot(root: IstNode | null): PortfolioStoreSnapshot;
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

function saveStateOrReport(state: PortfolioStorageState): string | null {
  const result = savePortfolioStorageState(state);

  return result.success ? null : result.error;
}

export function createPortfolioStore(initialState?: PortfolioStorageState): PortfolioStore {
  const initialLoad = initialState === undefined
    ? loadPortfolioStorageState()
    : { state: initialState, error: null };

  let currentState = initialLoad.state;
  let loadError = initialLoad.error;
  let saveError: string | null = initialLoad.error;
  const listeners = new Set<PortfolioStoreListener>();

  function emit(): PortfolioStoreSnapshot {
    const snapshot = createStoreSnapshot(currentState, loadError, saveError);

    listeners.forEach((listener) => listener(snapshot));

    return snapshot;
  }

  function persistCurrentState(): PortfolioStoreSnapshot {
    saveError = saveStateOrReport(currentState);

    return emit();
  }

  function setCurrentState(nextState: PortfolioStorageState): PortfolioStoreSnapshot {
    currentState = nextState;

    return persistCurrentState();
  }

  return {
    getState() {
      return createStoreSnapshot(currentState, loadError, saveError);
    },

    subscribe(listener: PortfolioStoreListener) {
      listeners.add(listener);

      listener(createStoreSnapshot(currentState, loadError, saveError));

      return () => {
        listeners.delete(listener);
      };
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

    replaceState(state: PortfolioStorageState) {
      return setCurrentState({
        sollRoot: state.sollRoot,
        istRoot: state.istRoot,
      });
    },

    reloadFromStorage() {
      const loadedState = loadPortfolioStorageState();

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
