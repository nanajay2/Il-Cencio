import { useState } from 'react';
import { fmt } from '../constants.js';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-[11px] py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown';

// users: [{ id, name }]
// absences: [{ id, userId, userName, from, to }]
export function AbsencesPanel({ users, absences, onAdd, onRemove }) {
  const [open,   setOpen]   = useState(false);
  const [userId, setUserId] = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  async function handleAdd() {
    if (!userId || !from || !to || from > to) return;
    await onAdd(Number(userId), from, to);
    setUserId(''); setFrom(''); setTo('');
  }

  return (
    <div className="mx-4 mt-4 mb-0 bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,.04)]">

      <div
        className={`px-4 py-[14px] flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-[#faf7f3] ${open ? 'border-b border-border rounded-t-2xl' : 'rounded-2xl'}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[.88rem] font-bold text-ink flex items-center gap-2">🗓️ Assenze</span>
        <div className={`w-6 h-6 bg-cream rounded-full flex items-center justify-center text-[.62rem] text-ink-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </div>

      {open && (
        <div className="p-4">
          <div className="mb-[14px]">
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-[5px] uppercase tracking-[.05em]">Persona</label>
                <select value={userId} onChange={e => setUserId(e.target.value)} className={inputCls}>
                  <option value="">Scegli…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-[5px] uppercase tracking-[.05em]">Dal</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-[5px] uppercase tracking-[.05em]">Al</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAdd}
                  className="h-[38px] px-4 bg-brown text-white border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors"
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {absences.length === 0 ? (
              <p className="text-[.82rem] text-ink-2">Nessuna assenza registrata.</p>
            ) : absences.map(a => (
              <div key={a.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] text-[.83rem] border border-border">
                <span><strong>{a.userName}</strong> — {fmt(a.from)} al {fmt(a.to)}</span>
                <button
                  onClick={() => onRemove(a.id)}
                  className="border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
