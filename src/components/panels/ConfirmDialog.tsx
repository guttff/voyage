import { Corners } from '../Blueprint';
import { Dialog } from '../Dialog';
import { useUi } from '../../state/ui';
import type { Confirm } from '../../lib/types';

export function ConfirmDialog({ confirm }: { confirm: Confirm }) {
  const ui = useUi();
  return (
    <Dialog onClose={ui.closePanel}>
      <div className="dialog-title">{confirm.title}</div>
      <div className="dialog-body">{confirm.body}</div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={ui.closePanel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary blueprint" onClick={confirm.go}>
          <Corners />
          {confirm.label}
        </button>
      </div>
    </Dialog>
  );
}
