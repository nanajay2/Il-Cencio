import { useState } from 'react';
import { X, Pencil, Home } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const btnCls =
  'h-[42px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.85rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.9rem] font-sans ' +
  'bg-cream text-ink outline-none h-[42px] transition-colors focus:border-brown w-full';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';
const labelCls   = 'block text-[.7rem] font-bold text-ink-2 mb-1.5 uppercase tracking-[.05em]';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red hover:bg-red-pale';

const EMOJI_CHOICES = ['🛁', '🚿', '🛏️', '🍳', '🛋️', '📺', '🧺', '🚪', '🗑️', '🌿', '🚗', '📚'];
const COLOR_CHOICES = ['#c97b4b', '#6a96c4', '#BDB395', '#7fae7a', '#c47a9e', '#d9b64e', '#8a85c0', '#a3a3a3'];

export function RoomsScreen({ house, onAddRoom, onEditRoom, onRemoveRoom, onClose }) {
  useBodyScrollLock();
  const [rName,  setRName]  = useState('');
  const [rIcon,  setRIcon]  = useState(EMOJI_CHOICES[0]);
  const [rColor, setRColor] = useState(COLOR_CHOICES[0]);
  const [customIcon, setCustomIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function startEdit(room) {
    setEditingId(room.id);
    setRName(room.name);
    setRColor(room.color);
    if (EMOJI_CHOICES.includes(room.icon)) {
      setRIcon(room.icon);
      setCustomIcon('');
    } else {
      setRIcon(room.icon);
      setCustomIcon(room.icon);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setRName('');
    setCustomIcon('');
    setRIcon(EMOJI_CHOICES[0]);
    setRColor(COLOR_CHOICES[0]);
  }

  async function addRoom() {
    if (!rName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await onEditRoom(editingId, { name: rName.trim(), icon: rIcon, color: rColor });
        cancelEdit();
      } else {
        await onAddRoom({ name: rName.trim(), icon: rIcon, color: rColor, sortOrder: house.rooms.length });
        setRName('');
        setCustomIcon('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate flex items-center gap-2">
            <Home size={22} className="flex-shrink-0" /> Stanze
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        <section className={sectionCls}>
          <div className={titleCls}>{editingId ? 'Modifica stanza' : 'Nuova stanza'}</div>

          <div>
            <label className={labelCls}>Nome</label>
            <input value={rName} onChange={e => setRName(e.target.value)} placeholder="es. Bagno" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Icona</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => { setRIcon(e); setCustomIcon(''); }}
                  className={
                    'w-10 h-10 rounded-[10px] text-[1.2rem] flex items-center justify-center cursor-pointer transition-colors border-[1.5px] ' +
                    (rIcon === e && !customIcon ? 'bg-brown border-brown' : 'bg-cream border-border hover:bg-cream-2')
                  }
                >
                  {e}
                </button>
              ))}
              <input
                value={customIcon}
                onChange={e => { setCustomIcon(e.target.value); if (e.target.value) setRIcon(e.target.value); }}
                placeholder="altro…"
                maxLength={2}
                className="w-10 h-10 rounded-[10px] text-center text-[1rem] border-[1.5px] border-border bg-cream outline-none focus:border-brown"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Colore</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {COLOR_CHOICES.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setRColor(c)}
                  aria-label={`Colore ${c}`}
                  className="w-9 h-9 rounded-full cursor-pointer transition-transform"
                  style={{
                    background: c,
                    border: rColor === c ? '3px solid #4E220F' : '3px solid transparent',
                    transform: rColor === c ? 'scale(1.08)' : 'none',
                  }}
                />
              ))}
              <input
                type="color" value={rColor} onChange={e => setRColor(e.target.value)}
                className="h-9 w-9 border border-border rounded-full cursor-pointer bg-cream p-0.5 flex-shrink-0"
                title="Colore personalizzato"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={addRoom} disabled={saving || !rName.trim()} className={btnCls + ' self-start disabled:opacity-50 disabled:cursor-not-allowed'}>
              {saving ? 'Salvataggio…' : editingId ? 'Salva modifiche' : '+ Aggiungi stanza'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} type="button" className={btnCls + ' self-start bg-transparent border-[1.5px] border-border text-ink-2 hover:bg-cream'}>
                Annulla
              </button>
            )}
          </div>
        </section>

        <section className={sectionCls}>
          <div className={titleCls}>Stanze attuali</div>
          {house.rooms.length === 0 ? (
            <p className="text-[.82rem] text-ink-2">Nessuna stanza configurata.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {house.rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.87rem]">
                  <span className="flex items-center gap-2">
                    <span className="text-[1.2rem]">{r.icon}</span>
                    <strong>{r.name}</strong>
                    <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: r.color }} />
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(r)} aria-label="Modifica" className={dangerCls + ' hover:text-brown hover:bg-cream-2'}><Pencil size={14} strokeWidth={1.8} /></button>
                    <button onClick={() => onRemoveRoom(r.id)} aria-label="Elimina" className={dangerCls}><X size={14} strokeWidth={1.8} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
