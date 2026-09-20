import { Sidebar } from './components/Sidebar';
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

export function App() {
  const { data } = useStore();
  const ui = useUi();
  const { route, panel } = ui;

  const vac = data.vacations.find((v) => v.id === route.vacId) || data.vacations[0];

  return (
    <div
      className="vy-shell"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '220px minmax(0,1fr)',
        fontSize: 14,
      }}
    >
      <Sidebar />

      <main
        className="vy-main"
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          minWidth: 0,
        }}
      >
        {route.page === 'home' && <Home />}
        {route.page === 'trips' && <Trips />}
        {route.page === 'trip' && (vac ? <TripDetail vac={vac} /> : <NoTrips />)}
        {route.page === 'budget' && <Budget />}
        {route.page === 'settings' && <Settings />}
      </main>

      {panel?.kind === 'add' && vac && (
        <AddItemDialog vac={vac} optId={panel.optId} editId={panel.editId} date={panel.date} />
      )}
      {panel?.kind === 'copy' && vac && <CopyItemDialog vac={vac} optId={panel.optId} itemId={panel.itemId} />}
      {panel?.kind === 'newvac' && <NewTripDialog />}
      {panel?.kind === 'confirm' && <ConfirmDialog confirm={panel.confirm} />}
    </div>
  );
}

function NoTrips() {
  const ui = useUi();
  return (
    <div>
      <h2 style={{ margin: 0 }}>No trips yet</h2>
      <div className="text-muted">Create one to start planning together.</div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => ui.openPanel({ kind: 'newvac' })}
        style={{ marginTop: 'var(--space-3)' }}
      >
        + New trip
      </button>
    </div>
  );
}
