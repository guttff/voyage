import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ui/Toast';
import { short, slug, uid } from '../../lib/format';
import { chatPrompt, parseImport, toOptionJson } from '../../lib/importExport';
import { useStore } from '../../state/store';
import { IMPORT_HINT, useUi } from '../../state/ui';
import type { Vacation } from '../../lib/types';

export function IoTab({ vac }: { vac: Vacation }) {
  const { updVac, updOpt, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();
  const [copied, setCopied] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState('');
  const [dragging, setDragging] = useState(false);

  const imp = useMemo(() => parseImport(ui.importText, vac), [ui.importText, vac]);

  const exportOpt = vac.options.find((x) => x.id === ui.exportOptId) || vac.options[0];
  const exportJson = JSON.stringify(toOptionJson(vac, exportOpt), null, 2);
  const exportFile = `${slug(vac.name)}-${slug(exportOpt.name)}.json`;
  const promptText = chatPrompt(vac);

  const readFile = (file: File | undefined) => {
    setDragging(false);
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      ui.setImportText(String(r.result));
      ui.setImportFileName(file.name);
    };
    r.readAsText(file);
  };

  const copy = (text: string, set: (s: string) => void, label: string) => {
    void navigator.clipboard?.writeText(text);
    set('Copied');
    toast(`${label} copied to clipboard`, 'good');
    window.setTimeout(() => set(''), 2000);
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
      toast(`Imported ${imp.count} items as ${name}`, 'good');
    } else {
      target = ui.importMode;
      // Merged-in items keep a trail back to where they came from.
      updOpt(vac.id, target, (x) => ({
        ...x,
        items: [...x.items, ...imp.items.map((i) => ({ ...i, from: imp.name || 'import' }))],
      }));
      const into = vac.options.find((x) => x.id === target)?.name;
      log(`${me.name} imported ${imp.count} items into ${into}`);
      toast(`Imported ${imp.count} items into ${into}`, 'good');
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
    <>
      <div className="page-hd">
        <div>
          <h2>Import / Export</h2>
          <p>
            Draft a plan anywhere that speaks JSON — a chat model, a spreadsheet, an earlier export — and bring it
            straight in as an option.
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        {/* ── import ── */}
        <section className="card card-flush">
          <header className="card-hd">
            <h3>
              <Icon name="download" size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
              Import
            </h3>
          </header>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            <label
              className="add-tile"
              style={{ minHeight: 96, borderColor: dragging ? 'var(--accent-600)' : undefined, background: dragging ? 'var(--accent-50)' : undefined }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                readFile(e.dataTransfer.files?.[0]);
              }}
            >
              <Icon name="upload" size={18} />
              <span>
                <strong>Choose a .json file</strong>
                <span>{ui.importFileName}</span>
              </span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  readFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>

            <div className="field">
              <label htmlFor="imp-json">Or paste JSON</label>
              <textarea
                id="imp-json"
                className="input"
                rows={6}
                placeholder={'{"name":"Option 3","author":"ChatGPT","items":[{"day":1,"category":"flight","title":"…","cost":800}]}'}
                value={ui.importText}
                onChange={(e) => ui.setImportText(e.target.value)}
                style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12 }}
              />
            </div>

            {ui.importText.trim() !== '' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  fontSize: 12,
                  borderRadius: 'var(--r-md)',
                  color: imp.ok ? 'var(--good-text)' : 'var(--critical-text)',
                  background: imp.ok ? 'var(--good-bg)' : 'var(--critical-bg)',
                  border: `1px solid ${imp.ok ? 'var(--good-border)' : 'var(--critical-border)'}`,
                }}
              >
                <Icon name={imp.ok ? 'checkCircle' : 'alert'} size={14} style={{ marginTop: 1, flex: 'none' }} />
                <span>{imp.msg}</span>
              </div>
            )}

            <div className="field">
              <label>Import as</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {modes.map((m) => (
                  <label className="choice" key={m.id}>
                    <input
                      type="radio"
                      name="impmode"
                      checked={ui.importMode === m.id}
                      onChange={() => ui.setImportMode(m.id)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary" onClick={submitImport} disabled={!imp.ok} style={{ alignSelf: 'flex-start' }}>
              <Icon name="download" size={14} />
              Import {imp.count > 0 ? `${imp.count} items` : ''}
            </button>
          </div>
        </section>

        {/* ── export ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          <section className="card card-flush">
            <header className="card-hd">
              <h3>
                <Icon name="upload" size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                Export
              </h3>
              <select
                className="input"
                value={exportOpt.id}
                onChange={(e) => ui.setExportOptId(e.target.value)}
                aria-label="Which plan to export"
                style={{ width: 'auto', minHeight: 30, fontSize: 13 }}
              >
                {vac.options.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.final ? 'Final (merged)' : `${op.name} · ${op.author}`}
                  </option>
                ))}
              </select>
            </header>
            <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                The same schema the importer reads, so a round trip through a chat model comes back as a new option.
              </p>
              <textarea
                className="input"
                readOnly
                rows={8}
                value={exportJson}
                style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11 }}
                aria-label="Exported JSON"
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <a
                  className="btn btn-primary"
                  href={'data:application/json;charset=utf-8,' + encodeURIComponent(exportJson)}
                  download={exportFile}
                >
                  <Icon name="download" size={14} />
                  Download .json
                </a>
                <button type="button" className="btn" onClick={() => copy(exportJson, setCopied, 'JSON')}>
                  <Icon name="copy" size={14} />
                  {copied || 'Copy'}
                </button>
              </div>
            </div>
          </section>

          <section className="card card-accent">
            <h3 style={{ fontSize: 14 }}>Draft a plan with a chat model</h3>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              Copy this prompt, paste the reply into Import. Day 1 is {short(vac.start)}.
            </p>
            <textarea
              className="input"
              readOnly
              rows={4}
              value={promptText}
              style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11 }}
              aria-label="Prompt to copy"
            />
            <button
              type="button"
              className="btn"
              onClick={() => copy(promptText, setCopiedPrompt, 'Prompt')}
              style={{ alignSelf: 'flex-start' }}
            >
              <Icon name="copy" size={14} />
              {copiedPrompt || 'Copy prompt'}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
