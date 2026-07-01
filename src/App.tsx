import { useState } from 'react';

import { PortfolioWorkspace, type ViewMode } from './features/portfolio/ui/portfolio-workspace';
import { type SunburstMode } from './features/portfolio/ui/sunburst-model';

export default function App() {
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('soll');
  const [sunburstMode, setSunburstMode] = useState<SunburstMode>('soll');

  return (
    <PortfolioWorkspace
      activeViewMode={activeViewMode}
      onActiveViewModeChange={setActiveViewMode}
      onSunburstModeChange={setSunburstMode}
      sunburstMode={sunburstMode}
    />
  );
}