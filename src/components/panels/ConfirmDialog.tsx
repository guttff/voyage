import { Dialog } from '../Dialog';
import { useUi } from '../../state/ui';
import type { Confirm } from '../../lib/types';

export function ConfirmDialog({ confirm, tone }: { confirm: Confirm; tone?: 'danger' }) {
  const ui = useUi();
  return (
    <Dialog
      title={confirm.title}
      onClose={ui.closePanel}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn" onClick={ui.closePanel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirm.go}
            style={tone === 'danger' ? { background: 'var(--critical-text)', borderColor: 'var(--critical-text)' } : undefined}
          >
            {confirm.label}
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: 0 }}>
        {confirm.body}
      </p>
    </Dialog>
  );
}
