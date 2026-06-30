import { useState } from 'react';
import { PEOPLE, fmt } from '../constants.js';

export function AbsencesPanel({ absences, onAdd, onRemove }) {
  const [open,   setOpen]   = useState(false);
  const [person, setPerson] = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  async function handleAdd() {
    if (!person || !from || !to) return;
    if (from > to) return;
    await onAdd(person, from, to);
    setPerson(''); setFrom(''); setTo('');
  }

  return (
    <div className="panel" style={{ marginBottom: 0 }}>
      <div
        className={`panel-head ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="panel-title">🗓️ Assenze</span>
        <div className={`panel-chevron ${open ? 'open' : ''}`}>▼</div>
      </div>

      {open && (
        <div className="panel-body open">
          <div style={{ marginBottom: 14 }}>
            <div className="form-row">
              <div>
                <label className="field-label">Persona</label>
                <select value={person} onChange={e => setPerson(e.target.value)}>
                  <option value="">Scegli…</option>
                  {PEOPLE.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Dal</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Al</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn-add-absence" onClick={handleAdd}>Aggiungi</button>
              </div>
            </div>
          </div>

          <div id="abs-list">
            {absences.length === 0
              ? <p style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>Nessuna assenza registrata.</p>
              : absences.map(a => (
                  <div key={a.id} className="absence-item">
                    <span><strong>{a.person}</strong> — {fmt(a.from)} al {fmt(a.to)}</span>
                    <button className="rm-btn" onClick={() => onRemove(a.id)}>✕</button>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
