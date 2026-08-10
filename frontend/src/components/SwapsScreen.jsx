import { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Check } from 'lucide-react';
import { fmt, todayStr, isCurW } from '../constants.js';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const btnCls =
  'h-[38px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown flex-1 min-w-0';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

export function SwapsScreen({ house, userId, weeks, currentWeek, swaps, onPropose, onAccept, onDecline, onClose }) {
  useBodyScrollLock();

  const eligibleWeeks = (weeks ?? []).filter(w => w.end >= todayStr());
  const [selectedWeekId, setSelectedWeekId] = useState(currentWeek?.id ?? eligibleWeeks[0]?.id ?? '');
  const selectedWeek = eligibleWeeks.find(w => w.id === selectedWeekId) ?? null;

  const myAssignments = (selectedWeek?.assignments ?? []).filter(a => a.userId === userId);
  const otherUsers = (house.users ?? []).filter(u => u.id !== userId);

  const [fromRoomId, setFromRoomId] = useState(myAssignments[0]?.roomId ?? '');
  const [toUserId,   setToUserId]   = useState(otherUsers[0]?.id ?? '');
  const [saving,     setSaving]     = useState(false);

  const toUserAssignments = (selectedWeek?.assignments ?? []).filter(a => a.userId === toUserId);
  const [toRoomId, setToRoomId] = useState(toUserAssignments[0]?.roomId ?? '');

  // Cambiando turno, le stanze assegnate a me/al destinatario possono
  // differire: reimposto le selezioni sulla base del nuovo turno.
  useEffect(() => {
    setFromRoomId(myAssignments[0]?.roomId ?? '');
    const asgns = (selectedWeek?.assignments ?? []).filter(a => a.userId === toUserId);
    setToRoomId(asgns[0]?.roomId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekId]);

  function selectToUser(id) {
    setToUserId(id);
    const asgns = (selectedWeek?.assignments ?? []).filter(a => a.userId === id);
    setToRoomId(asgns[0]?.roomId ?? '');
  }

  const canPropose = selectedWeek && fromRoomId && toUserId && !saving;

  async function handlePropose() {
    if (!canPropose) return;
    setSaving(true);
    try {
      await onPropose(selectedWeek.id, userId, fromRoomId, toUserId, toRoomId || null);
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
          <h2 className="font-serif text-[1.6rem] text-ink truncate flex items-center gap-2">
            <ArrowLeftRight size={22} className="flex-shrink-0" /> Scambio turni
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.1)'; }}
          >
            <X size={14} strokeWidth={1.8} />
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
                    <button onClick={() => onAccept(s.id)} className={btnCls + ' flex items-center gap-1'}><Check size={15} /> Accetta</button>
                    <button
                      onClick={() => onDecline(s.id)}
                      className="h-[38px] px-3 bg-cream-2 text-ink-2 border border-border rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-cream transition-colors flex items-center justify-center"
                    >
                      <X size={15} strokeWidth={1.8} />
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

          <div>
            <label className="block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.05em]">Turno</label>
            <select value={selectedWeekId} onChange={e => setSelectedWeekId(e.target.value)} className={inputCls + ' w-full'}>
              {eligibleWeeks.map(w => (
                <option key={w.id} value={w.id}>
                  {fmt(w.start)} – {fmt(w.end)}{isCurW(w) ? ' (attuale)' : ''}
                </option>
              ))}
            </select>
          </div>

          {myAssignments.length === 0 || otherUsers.length === 0 ? (
            <p className="text-[.77rem] text-ink-2 -mt-1">Non hai turni da scambiare in questo turno.</p>
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
