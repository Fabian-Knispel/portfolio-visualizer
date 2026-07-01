import { useState } from 'react';

import { PortfolioWorkspace, type ViewMode } from './features/portfolio/ui/portfolio-workspace';

export default function App() {
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('soll');

  return (
    <PortfolioWorkspace
      activeViewMode={activeViewMode}
      onActiveViewModeChange={setActiveViewMode}
    />
  );
}