import { useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const btnCls =
  'h-[38px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown flex-1 min-w-0';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SwapsScreen({ house, userId, currentWeek, swaps, onPropose, onAccept, onDecline, onClose }) {
  useBodyScrollLock();

  const myAssignments = (currentWeek?.assignments ?? []).filter(a => a.userId === userId);
  const otherUsers = (house.users ?? []).filter(u => u.id !== userId);

  const [fromRoomId, setFromRoomId] = useState(myAssignments[0]?.roomId ?? '');
  const [toUserId,   setToUserId]   = useState(otherUsers[0]?.id ?? '');
  const [saving,     setSaving]     = useState(false);

  const toUserAssignments = (currentWeek?.assignments ?? []).filter(a => a.userId === Number(toUserId));
  const [toRoomId, setToRoomId] = useState(toUserAssignments[0]?.roomId ?? '');

  function selectToUser(id) {
    setToUserId(id);
    const asgns = (currentWeek?.assignments ?? []).filter(a => a.userId === Number(id));
    setToRoomId(asgns[0]?.roomId ?? '');
  }

  const canPropose = currentWeek && fromRoomId && toUserId && !saving;

  async function handlePropose() {
    if (!canPropose) return;
    setSaving(true);
    try {
      await onPropose(currentWeek.id, userId, Number(fromRoomId), Number(toUserId), toRoomId ? Number(toRoomId) : null);
    } finally {
      setSaving(false);
    }
  }

  const incoming = swaps.filter(s => s.toUserId === userId && s.status === 'pending');
  const outgoing = swaps.filter(s => s.fromUserId === userId && s.status === 'pending');

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate">🔁 Scambio turni</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.1)'; }}
          >
            <CloseIcon />
          </button>
        </div>

        {incoming.length > 0 && (
          <section className={sectionCls}>
            <div className={titleCls}>Richieste ricevute</div>
            <div className="flex flex-col gap-1.5">
              {incoming.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-[9px] bg-cream rounded-[10px] text-[.83rem] border border-border">
                  <span>
                    {s.toRoomName ? (
                      <><strong>{s.fromUserName}</strong> ti propone: la sua <strong>{s.fromRoomName}</strong> in cambio della tua <strong>{s.toRoomName}</strong></>
                    ) : (
                      <><strong>{s.fromUserName}</strong> ti propone di darti la sua <strong>{s.fromRoomName}</strong></>
                    )}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => onAccept(s.id)} className={btnCls}>✓ Accetta</button>
                    <button
                      onClick={() => onDecline(s.id)}
                      className="h-[38px] px-3 bg-cream-2 text-ink-2 border border-border rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-cream transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {outgoing.length > 0 && (
          <section className={sectionCls}>
            <div className={titleCls}>Richieste inviate</div>
            <div className="flex flex-col gap-1.5">
              {outgoing.map(s => (
                <div key={s.id} className="px-3 py-[9px] bg-cream rounded-[10px] text-[.83rem] border border-border text-ink-2">
                  {s.toRoomName ? (
                    <>In attesa che <strong className="text-ink">{s.toUserName}</strong> accetti lo scambio della tua <strong className="text-ink">{s.fromRoomName}</strong> con la sua <strong className="text-ink">{s.toRoomName}</strong></>
                  ) : (
                    <>In attesa che <strong className="text-ink">{s.toUserName}</strong> accetti di ricevere la tua <strong className="text-ink">{s.fromRoomName}</strong></>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={sectionCls}>
          <div className={titleCls}>Proponi uno scambio</div>
          {myAssignments.length === 0 || otherUsers.length === 0 ? (
            <p className="text-[.77rem] text-ink-2 -mt-1">Non hai turni da scambiare questa settimana.</p>
          ) : (
            <>
              <p className="text-[.77rem] text-ink-2 -mt-1">Scambia una tua stanza con quella di un coinquilino, oppure dagliela direttamente se questa settimana non ne ha.</p>

              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.05em]">La tua stanza</label>
                <select value={fromRoomId} onChange={e => setFromRoomId(e.target.value)} className={inputCls + ' w-full'}>
                  {myAssignments.map(a => <option key={a.roomId} value={a.roomId}>{a.roomIcon} {a.roomName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.05em]">Con chi</label>
                <select value={toUserId} onChange={e => selectToUser(e.target.value)} className={inputCls + ' w-full'}>
                  {otherUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.05em]">La sua stanza</label>
                {toUserAssignments.length === 0 ? (
                  <p className="text-[.8rem] text-ink-2">Non ha turni questa settimana: gli/le daresti la tua stanza senza riceverne una in cambio.</p>
                ) : (
                  <select value={toRoomId} onChange={e => setToRoomId(e.target.value)} className={inputCls + ' w-full'}>
                    {toUserAssignments.map(a => <option key={a.roomId} value={a.roomId}>{a.roomIcon} {a.roomName}</option>)}
                  </select>
                )}
              </div>

              <button onClick={handlePropose} disabled={!canPropose} className={btnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
                {saving ? 'Invio…' : 'Proponi scambio'}
              </button>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
