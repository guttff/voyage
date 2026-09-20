import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StoreProvider, useStore } from './state/store';
import { UiProvider } from './state/ui';
import './styles/industry.css';
import './styles/app.css';

/** The route needs a trip to point at, which only exists once data has loaded. */
function Root() {
  const { data } = useStore();
  return (
    <UiProvider firstVacId={data.vacations[0]?.id}>
      <App />
    </UiProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <Root />
    </StoreProvider>
  </StrictMode>,
);
