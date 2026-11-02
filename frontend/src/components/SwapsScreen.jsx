import { useState, useEffect } from 'react';
import { ArrowLeftRight, Clock } from 'lucide-react';
import { fmt, fmtRange, todayStr, isCurW } from '../constants.js';
import { Avatar } from './Avatar.jsx';
import { RoomIcon } from './RoomIcon.jsx';

const labelCls = 'block text-[.75rem] font-bold text-ink-2 uppercase tracking-[.06em] mb-2';

const choiceCls = (active) =>
  'min-h-11 px-3.5 py-2 rounded-[14px] text-[.875rem] font-semibold cursor-pointer flex items-center gap-2 border-[1.5px] transition-colors ' +
  (active ? 'bg-primary-soft border-primary text-ink' : 'bg-card border-border text-ink');

function roomColorFor(week, uid) {
  return (week?.assignments ?? []).find(a => a.userId === uid)?.roomColor ?? '#C9D2CC';
}

export function SwapsScreen({ house, userId, weeks, currentWeek, swaps, onPropose, onAccept, onDecline }) {
  const eligibleWeeks = (weeks ?? []).filter(w => w.end >= todayStr());
  const [selectedWeekId, setSelectedWeekId] = useState(currentWeek?.id ?? eligibleWeeks[0]?.id ?? '');
  const selectedWeek = eligibleWeeks.find(w => w.id === selectedWeekId) ?? null;

  const myAssignments = (selectedWeek?.assignments ?? []).filter(a => a.userId === userId);
  const otherUsers = (house.users ?? []).filter(u => u.id !== userId);

  const [fromRoomId, setFromRoomId] = useState(myAssignments[0]?.roomId ?? '');
  const [toUserId,   setToUserId]   = useState(otherUsers[0]?.id ?? '');
  const [saving,     setSaving]     = useState(false);
  const [wantedMode, setWantedMode] = useState('swap');

  const toUserAssignments = (selectedWeek?.assignments ?? []).filter(a => a.userId === toUserId);
  const [toRoomId, setToRoomId] = useState(toUserAssignments[0]?.roomId ?? '');
  const toUserName = otherUsers.find(u => u.id === toUserId)?.name ?? '';

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

  // Scambio: una stanza a testa. Cedi: dai la tua e ricevi un turno vuoto.
  // Prendi: dai un turno vuoto e ricevi la sua.
  const modes = [];
  if (myAssignments.length > 0 && toUserAssignments.length > 0) modes.push('swap');
  if (myAssignments.length > 0) modes.push('give');
  if (toUserAssignments.length > 0) modes.push('take');
  const mode = modes.includes(wantedMode) ? wantedMode : modes[0];

  const myRoomName = myAssignments.find(a => a.roomId === fromRoomId)?.roomName;
  const hisRoomName = toUserAssignments.find(a => a.roomId === toRoomId)?.roomName;
  const MODE_LABELS = {
    swap: { title: 'Scambio', text: `${myRoomName} ⇄ ${hisRoomName}` },
    give: { title: 'Cedi', text: `dai ${myRoomName}, ricevi un turno vuoto` },
    take: { title: 'Prendi', text: `prendi ${hisRoomName}, dai un turno vuoto` },
  };

  const canPropose = selectedWeek && mode && toUserId && !saving;

  async function handlePropose() {
    if (!canPropose) return;
    setSaving(true);
    try {
      await onPropose(
        selectedWeek.id, userId,
        mode === 'take' ? null : fromRoomId,
        toUserId,
        mode === 'give' ? null : toRoomId,
      );
    } finally {
      setSaving(false);
    }
  }

  function weekLabel(weekId) {
    const w = (weeks ?? []).find(x => x.id === weekId);
    return w ? fmtRange(w.start, w.end) : null;
  }

  const incoming = swaps.filter(s => s.toUserId === userId && s.status === 'pending');
  const outgoing = swaps.filter(s => s.fromUserId === userId && s.status === 'pending');

  return (
    <>
      <h1 className="font-display font-extrabold text-[1.875rem] leading-[1.1] tracking-[-.02em]">Scambi</h1>

      {incoming.map(s => (
        <section key={s.id} aria-label={`Richiesta di ${s.fromUserName}`} className="bg-card rounded-[20px] p-4 flex flex-col gap-3.5 shadow-[inset_0_0_0_2px_var(--color-soap)]">
          <div className="flex items-center gap-2.5">
            <Avatar name={s.fromUserName} color="#1D6F5F" />
            <div className="min-w-0">
              <div className="text-[.9375rem] font-bold">
                {!s.fromRoomName
                  ? `${s.fromUserName} vuole prendere una tua stanza`
                  : !s.toRoomName
                  ? `${s.fromUserName} vuole darti una stanza`
                  : `${s.fromUserName} ti propone uno scambio`}
              </div>
              {weekLabel(s.weekId) && <div className="text-[.8125rem] text-ink-2">Turno {weekLabel(s.weekId)}</div>}
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-1.5">
            <div className="bg-primary-soft rounded-[14px] px-3 py-2.5">
              <div className="text-[.6875rem] font-bold text-primary uppercase tracking-[.06em]">Tu cedi</div>
              <div className="text-[1rem] font-bold mt-0.5 break-words">{s.toRoomName ?? 'Turno vuoto'}</div>
            </div>
            <ArrowLeftRight size={22} className="text-ink-2 justify-self-center" aria-hidden="true" />
            <div className="bg-soft rounded-[14px] px-3 py-2.5">
              <div className="text-[.6875rem] font-bold text-ink-2 uppercase tracking-[.06em]">Tu prendi</div>
              <div className="text-[1rem] font-bold mt-0.5 break-words">{s.fromRoomName ?? 'Turno vuoto'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDecline(s.id)}
              className="h-12 rounded-[14px] border-[1.5px] border-border bg-card text-ink text-[.9375rem] font-bold cursor-pointer hover:bg-soft transition-colors"
            >
              Rifiuta
            </button>
            <button
              type="button"
              onClick={() => onAccept(s.id)}
              className="h-12 rounded-[14px] border-0 bg-primary text-white text-[.9375rem] font-bold cursor-pointer hover:bg-primary-dark transition-colors"
            >
              Accetta
            </button>
          </div>
        </section>
      ))}

      <section aria-label="Proponi uno scambio" className="bg-card rounded-[20px] p-4 flex flex-col gap-3.5">
        <h2 className="text-[1rem] font-bold">Proponi uno scambio</h2>

        <div>
          <label htmlFor="swap-turno" className={labelCls}>Turno</label>
          <select
            id="swap-turno"
            value={selectedWeekId}
            onChange={e => setSelectedWeekId(e.target.value)}
            className="w-full h-11 px-3 rounded-[14px] border-[1.5px] border-border bg-card text-ink text-[.875rem] font-semibold outline-none focus:border-primary"
          >
            {eligibleWeeks.map(w => (
              <option key={w.id} value={w.id}>
                {fmt(w.start)} – {fmt(w.end)}{isCurW(w) ? ' (attuale)' : ''}
              </option>
            ))}
          </select>
        </div>

        {otherUsers.length === 0 ? (
          <p className="text-[.875rem] text-ink-2">Non ci sono coinquilini con cui scambiare.</p>
        ) : (
          <>
            <div>
              <span className={labelCls}>Con chi</span>
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {otherUsers.map(u => {
                  const active = u.id === toUserId;
                  const room = (selectedWeek?.assignments ?? []).find(a => a.userId === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectToUser(u.id)}
                      className={
                        'flex-1 min-w-[92px] rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1.5 cursor-pointer border-0 ' +
                        (active ? 'bg-primary-soft shadow-[inset_0_0_0_2px_var(--color-primary)]' : 'bg-page')
                      }
                    >
                      <Avatar name={u.name} color={roomColorFor(selectedWeek, u.id)} />
                      <span className="text-[.8125rem] font-bold text-ink max-w-full truncate px-1">{u.name}</span>
                      <span className="text-[.75rem] text-ink-2 max-w-full truncate px-1">{room?.roomName ?? 'Turno vuoto'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {modes.length === 0 ? (
              <p className="text-[.875rem] text-ink-2">In questo turno né tu né {toUserName} avete stanze da scambiare.</p>
            ) : (
              <>
                <div role="radiogroup" aria-label="Cosa">
                  <span className={labelCls}>Cosa</span>
                  <div className="flex flex-col gap-1.5">
                    {modes.map(m => (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={mode === m}
                        onClick={() => setWantedMode(m)}
                        className={
                          'min-h-12 px-3.5 py-2 rounded-[14px] bg-card text-left text-[.875rem] text-ink cursor-pointer flex items-center gap-2.5 border-[1.5px] ' +
                          (mode === m ? 'border-primary' : 'border-border')
                        }
                      >
                        <span className={'w-[18px] h-[18px] rounded-full box-border flex-shrink-0 ' + (mode === m ? 'border-[6px] border-primary' : 'border-2 border-strong')} />
                        <span className="min-w-0"><strong>{MODE_LABELS[m].title}</strong> · {MODE_LABELS[m].text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {mode !== 'take' && myAssignments.length > 1 && (
                  <div>
                    <span className={labelCls}>La tua stanza</span>
                    <div className="flex flex-wrap gap-1.5">
                      {myAssignments.map(a => (
                        <button key={a.roomId} type="button" aria-pressed={fromRoomId === a.roomId} onClick={() => setFromRoomId(a.roomId)} className={choiceCls(fromRoomId === a.roomId)}>
                          <RoomIcon icon={a.roomIcon} size={16} /> {a.roomName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode !== 'give' && toUserAssignments.length > 1 && (
                  <div>
                    <span className={labelCls}>La stanza di {toUserName}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {toUserAssignments.map(a => (
                        <button key={a.roomId} type="button" aria-pressed={toRoomId === a.roomId} onClick={() => setToRoomId(a.roomId)} className={choiceCls(toRoomId === a.roomId)}>
                          <RoomIcon icon={a.roomIcon} size={16} /> {a.roomName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePropose}
                  disabled={!canPropose}
                  className="h-[52px] rounded-2xl border-0 bg-soap text-ink text-[1rem] font-bold cursor-pointer hover:bg-soap-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Invio…' : `Invia proposta a ${toUserName}`}
                </button>
              </>
            )}
          </>
        )}
      </section>

      {outgoing.map(s => (
        <div key={s.id} className="bg-card rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
          <Clock size={20} className="text-ink-2 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 min-w-0 text-[.8125rem]">
            A {s.toUserName} · {s.fromRoomName ?? 'Turno vuoto'} ⇄ {s.toRoomName ?? 'Turno vuoto'}
          </span>
          <span className="text-[.75rem] font-bold text-ink bg-soap/40 px-2.5 py-1 rounded-full flex-shrink-0">In attesa</span>
        </div>
      ))}
    </>
  );
}
