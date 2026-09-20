import { Sidebar } from './components/Sidebar';
import { Icon } from './components/Icon';
import { EmptyState } from './components/ui/EmptyState';
import { AddItemDialog } from './components/panels/AddItemDialog';
import { CopyItemDialog } from './components/panels/CopyItemDialog';
import { ConfirmDialog } from './components/panels/ConfirmDialog';
import { NewTripDialog } from './components/panels/NewTripDialog';
import { Home } from './pages/Home';
import { Trips } from './pages/Trips';
import { TripDetail } from './pages/TripDetail';
import { Budget } from './pages/Budget';
import { Settings } from './pages/Settings';
import { useStore } from './state/store';
import { useUi } from './state/ui';

const TITLES: Record<string, string> = {
  home: 'Overview',
  trips: 'Trips',
  budget: 'Travel fund',
  settings: 'Settings',
};

const TAB_LABEL: Record<string, string> = {
  plans: 'Plan options',
  itinerary: 'Itinerary',
  compare: 'Compare',
  io: 'Import / Export',
};

export function App() {
  const { data } = useStore();
  const ui = useUi();
  const { route, panel } = ui;

  const vac = data.vacations.find((v) => v.id === route.vacId) || data.vacations[0];

  return (
    <div className="shell">
      <Sidebar />

      <div className="main">
        <header className="topbar">
          <nav className="crumbs" aria-label="Breadcrumb">
            {route.page === 'trip' && vac ? (
              <>
                <button type="button" onClick={() => ui.go('trips')}>
                  Trips
                </button>
                <Icon name="chevronRight" size={13} stroke="var(--text-3)" />
                <span className="here">{vac.name}</span>
                <Icon name="chevronRight" size={13} stroke="var(--text-3)" />
                <span>{TAB_LABEL[route.tab]}</span>
              </>
            ) : (
              <span className="here">{TITLES[route.page] ?? 'Voyage'}</span>
            )}
          </nav>

          <div className="topbar-actions">
            <button type="button" className="btn btn-primary" onClick={() => ui.openPanel({ kind: 'newvac' })}>
              <Icon name="plus" size={14} />
              New trip
            </button>
          </div>
        </header>

        <main className="content">
          {route.page === 'home' && <Home />}
          {route.page === 'trips' && <Trips />}
          {route.page === 'trip' && (vac ? <TripDetail vac={vac} /> : <NoTrips />)}
          {route.page === 'budget' && <Budget />}
          {route.page === 'settings' && <Settings />}
        </main>
      </div>

      {panel?.kind === 'add' && vac && (
        <AddItemDialog vac={vac} optId={panel.optId} editId={panel.editId} date={panel.date} />
      )}
      {panel?.kind === 'copy' && vac && <CopyItemDialog vac={vac} optId={panel.optId} itemId={panel.itemId} />}
      {panel?.kind === 'newvac' && <NewTripDialog />}
      {panel?.kind === 'confirm' && <ConfirmDialog confirm={panel.confirm} tone={panel.tone} />}
    </div>
  );
}

function NoTrips() {
  const ui = useUi();
  return (
    <div className="card">
      <EmptyState
        icon="trips"
        title="No trips yet"
        body="Create a trip and you'll each get your own plan to build, plus a shared final itinerary to merge the best parts into."
        action={
          <button type="button" className="btn btn-primary" onClick={() => ui.openPanel({ kind: 'newvac' })}>
            <Icon name="plus" size={14} />
            New trip
          </button>
        }
      />
    </div>
  );
}
