import { useState, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';
import { RoomIcon, ROOM_ICON_CHOICES } from './RoomIcon.jsx';
import { SubPage } from './SubPage.jsx';

const btnCls =
  'h-11 px-4 bg-primary text-white border-0 rounded-[12px] font-sans text-[.85rem] font-bold cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[12px] px-3 py-2 text-[.9rem] font-sans ' +
  'bg-page text-ink outline-none h-11 transition-colors focus:border-primary w-full';

const sectionCls = 'bg-card rounded-[20px] p-4 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';
const labelCls   = 'block text-[.7rem] font-bold text-ink-2 mb-1.5 uppercase tracking-[.05em]';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 w-11 h-11 flex items-center justify-center rounded-[12px] transition-all hover:text-red hover:bg-red-pale';

const EMOJI_CHOICES = ROOM_ICON_CHOICES;
const COLOR_CHOICES = ['#1D6F5F', '#2F5E9E', '#B4452A', '#7A4E9C', '#8A5F0A', '#A0356B', '#3D7A2E', '#56645E'];

// Propone il primo colore non ancora usato, così le stanze si distinguono
// nel calendario anche se non se ne sceglie uno.
function nextRoomColor(rooms) {
  const used = rooms.map(r => (r.color ?? '').toLowerCase());
  return COLOR_CHOICES.find(c => !used.includes(c.toLowerCase()))
    ?? COLOR_CHOICES[rooms.length % COLOR_CHOICES.length];
}

export function RoomsScreen({ house, onAddRoom, onEditRoom, onRemoveRoom, onClose }) {
  const [rName,  setRName]  = useState('');
  const [rIcon,  setRIcon]  = useState(EMOJI_CHOICES[0]);
  const [rColor, setRColor] = useState(() => nextRoomColor(house.rooms));
  const [customIcon, setCustomIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!editingId) setRColor(nextRoomColor(house.rooms));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house.rooms.length]);

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
    setRColor(nextRoomColor(house.rooms));
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
    <SubPage title="Stanze" onBack={onClose}>

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
                    'w-11 h-11 rounded-[12px] text-[1.2rem] text-ink flex items-center justify-center cursor-pointer transition-colors border-[1.5px] ' +
                    (rIcon === e && !customIcon ? 'bg-primary-soft border-primary' : 'bg-page border-border hover:bg-soft')
                  }
                >
                  <RoomIcon icon={e} size={20} />
                </button>
              ))}
              <input
                value={customIcon}
                onChange={e => { setCustomIcon(e.target.value); if (e.target.value) setRIcon(e.target.value); }}
                placeholder="altro…"
                maxLength={2}
                className="w-11 h-11 rounded-[12px] text-center text-[1rem] border-[1.5px] border-border bg-page outline-none focus:border-primary"
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
                    border: rColor === c ? '3px solid var(--color-ink)' : '3px solid transparent',
                    transform: rColor === c ? 'scale(1.08)' : 'none',
                  }}
                />
              ))}
              <input
                type="color" value={rColor} onChange={e => setRColor(e.target.value)}
                className="h-9 w-9 border border-border rounded-full cursor-pointer bg-page p-0.5 flex-shrink-0"
                title="Colore personalizzato"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={addRoom} disabled={saving || !rName.trim()} className={btnCls + ' self-start disabled:opacity-50 disabled:cursor-not-allowed'}>
              {saving ? 'Salvataggio…' : editingId ? 'Salva modifiche' : '+ Aggiungi stanza'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} type="button" className={btnCls + ' self-start bg-transparent border-[1.5px] border-border text-ink-2 hover:bg-page'}>
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
                <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-page rounded-[12px] border border-border text-[.87rem]">
                  <span className="flex items-center gap-2">
                    <RoomIcon icon={r.icon} size={20} className="text-ink-2" />
                    <strong>{r.name}</strong>
                    <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: r.color }} />
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(r)} aria-label={`Modifica ${r.name}`} className={dangerCls + ' hover:text-primary hover:bg-soft'}><Pencil size={18} strokeWidth={1.8} /></button>
                    <button onClick={() => onRemoveRoom(r.id)} aria-label={`Elimina ${r.name}`} className={dangerCls}><X size={18} strokeWidth={1.8} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
    </SubPage>
  );
}
