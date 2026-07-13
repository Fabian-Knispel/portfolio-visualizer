import { useState } from 'react';

import { ErrorBoundary } from './features/portfolio/ui/error-boundary';
import { PortfolioWorkspace, type ViewMode } from './features/portfolio/ui/portfolio-workspace';

export default function App() {
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('soll');

  return (
    <ErrorBoundary>
      <PortfolioWorkspace
        activeViewMode={activeViewMode}
        onActiveViewModeChange={setActiveViewMode}
      />
    </ErrorBoundary>
  );
}