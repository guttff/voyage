import { useMemo, useState } from 'react';
import { Corners } from '../../components/Blueprint';
import { Icon } from '../../components/Icon';
import { EXPORT_ICON, IMPORT_ICON } from '../../lib/constants';
import { short, slug, uid } from '../../lib/format';
import { chatPrompt, parseImport, toOptionJson } from '../../lib/importExport';
import { useStore } from '../../state/store';
import { IMPORT_HINT, useUi } from '../../state/ui';
import type { Vacation } from '../../lib/types';

export function IoTab({ vac }: { vac: Vacation }) {
  const { updVac, updOpt, log, me } = useStore();
  const ui = useUi();
  const [copied, setCopied] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState('');

  const imp = useMemo(() => parseImport(ui.importText, vac), [ui.importText, vac]);

  const exportOpt = vac.options.find((x) => x.id === ui.exportOptId) || vac.options[0];
  const exportJson = JSON.stringify(toOptionJson(vac, exportOpt), null, 2);
  const exportFile = `${slug(vac.name)}-${slug(exportOpt.name)}.json`;
  const promptText = chatPrompt(vac);

  const readFile = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      ui.setImportText(String(r.result));
      ui.setImportFileName(file.name);
    };
    r.readAsText(file);
  };

  const copy = (text: string, set: (s: string) => void) => {
    void navigator.clipboard?.writeText(text);
    set('Copied ✓');
  };

  const submitImport = () => {
    if (!imp.ok) return;
    let target: string;
    if (ui.importMode === 'new') {
      target = uid();
      const name = imp.name || 'Option ' + vac.options.length;
      updVac(vac.id, (x) => ({
        ...x,
        options: [...x.options, { id: target, name, author: imp.author, items: imp.items }],
      }));
      log(`${me.name} imported ${imp.count} items as ${name}`);
    } else {
      target = ui.importMode;
      // Merged-in items keep a trail back to where they came from.
      updOpt(vac.id, target, (x) => ({
        ...x,
        items: [...x.items, ...imp.items.map((i) => ({ ...i, from: imp.name || 'import' }))],
      }));
      log(`${me.name} imported ${imp.count} items into ${vac.options.find((x) => x.id === target)?.name}`);
    }
    ui.setImportText('');
    ui.setImportFileName(IMPORT_HINT);
    ui.openTrip(vac.id, 'itinerary', target);
  };

  const modes = [
    { id: 'new', label: `New option (${imp.name || 'Option ' + vac.options.length})` },
    ...vac.options.map((op) => ({ id: op.id, label: `Merge into ${op.name}` })),
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
        gap: 'var(--space-4)',
        alignItems: 'start',
      }}
    >
      <div className="card blueprint" style={{ gap: 'var(--space-3)' }}>
        <Corners />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon d={IMPORT_ICON} size={22} stroke="var(--color-accent-700)" />
          <div>
            <div className="card-title">Import JSON</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              A file or pasted text. From ChatGPT or an earlier export.
            </div>
          </div>
        </div>

        <label
          className="blueprint"
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--space-4)',
            borderStyle: 'dashed',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: 13,
          }}
        >
          <Corners />
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              readFile(e.target.files?.[0]);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
          <span>
            <span style={{ fontWeight: 700, color: 'var(--color-accent-700)' }}>Choose a .json file</span>
            <br />
            <span className="text-muted">{ui.importFileName}</span>
          </span>
        </label>

        <textarea
          className="input"
          rows={6}
          placeholder={'…or paste: {"name":"Option 3","author":"ChatGPT","items":[{"day":1,"category":"flight","title":"…","cost":800}]}'}
          value={ui.importText}
          onChange={(e) => ui.setImportText(e.target.value)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            e.preventDefault();
            readFile(file);
          }}
          style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12 }}
        />

        <div style={{ fontSize: 13, color: imp.ok ? 'var(--color-accent-700)' : 'var(--color-neutral-700)' }}>
          {imp.msg}
        </div>

        <div className="field">
          <label>Import as</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {modes.map((m) => (
              <label className="radio" key={m.id}>
                <input
                  type="radio"
                  name="impmode"
                  checked={ui.importMode === m.id}
                  onChange={() => ui.setImportMode(m.id)}
                />
                <span className="dot" />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary blueprint"
          onClick={submitImport}
          disabled={!imp.ok}
          style={{ alignSelf: 'flex-start' }}
        >
          <Corners />
          Import {imp.count} items
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="card blueprint" style={{ gap: 'var(--space-3)' }}>
          <Corners />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon d={EXPORT_ICON} size={22} stroke="var(--color-accent-700)" />
            <div>
              <div className="card-title">Export JSON</div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Same schema the importer reads, so a round trip through ChatGPT comes back as a new option.
              </div>
            </div>
          </div>

          <div className="field">
            <label>Which plan</label>
            <select
              className="input"
              value={exportOpt.id}
              onChange={(e) => ui.setExportOptId(e.target.value)}
            >
              {vac.options.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.final ? 'Final (merged)' : `${op.name} · ${op.author}`}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="input"
            readOnly
            rows={8}
            value={exportJson}
            style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11 }}
          />

          <div style={{ display: 'flex', gap: 6 }}>
            <a
              className="btn btn-primary blueprint"
              href={'data:application/json;charset=utf-8,' + encodeURIComponent(exportJson)}
              download={exportFile}
            >
              <Corners />
              Download .json
            </a>
            <button type="button" className="btn btn-secondary" onClick={() => copy(exportJson, setCopied)}>
              {copied || 'Copy JSON'}
            </button>
          </div>
        </div>

        <div className="card blueprint" style={{ gap: 'var(--space-2)', background: 'var(--color-accent-100)' }}>
          <Corners />
          <div className="card-title">Use ChatGPT to draft a plan</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Copy this prompt, paste the reply on the left. Day 1 = {short(vac.start)}.
          </div>
          <textarea
            className="input"
            readOnly
            rows={4}
            value={promptText}
            style={{ fontSize: 11, fontFamily: 'ui-monospace,Menlo,monospace', background: 'var(--color-bg)' }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => copy(promptText, setCopiedPrompt)}
            style={{ alignSelf: 'flex-start' }}
          >
            {copiedPrompt || 'Copy prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
