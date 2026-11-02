import { Check, Undo2, Lock } from 'lucide-react';
import { DAYS, MONTHS_LONG, fmtRange, isEditable, isCurW, isPastW, todayStr } from '../constants.js';
import { Avatar } from './Avatar.jsx';
import { RoomIcon } from './RoomIcon.jsx';

function deadline(week) {
  const d = new Date(week.end + 'T12:00:00Z');
  return `Entro ${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`;
}

function daysLeft(week) {
  const ms = new Date(week.end + 'T12:00:00Z') - new Date(todayStr() + 'T12:00:00Z');
  const n = Math.round(ms / 86400000);
  if (n <= 0) return 'Ultimo giorno';
  return n === 1 ? 'Manca 1 giorno' : `Mancano ${n} giorni`;
}

// assignment: { userId, userName, roomId, roomName, roomIcon, roomColor, done }
export function ChoreCard({ assignment, absent, compact, week, onToggle, roomIndex, roomTotal }) {
  const { userId, roomId, userName, roomName, roomIcon, roomColor, done } = assignment;
  const editable = isEditable(week);

  // ── Riga compatta (altri coinquilini) ────────────────────────────
  if (compact) return (
    <div className="flex items-center gap-3 min-h-[54px] py-1.5">
      <Avatar name={userName} color={absent ? '#C9D2CC' : roomColor} />
      <div className="flex-1 min-w-0">
        <div className={'text-[.9375rem] font-semibold truncate ' + (absent ? 'text-ink-2' : 'text-ink')}>{userName}</div>
        <div className="text-[.8125rem] text-ink-2 flex items-center gap-1 min-w-0">
          <RoomIcon icon={roomIcon} size={14} className="flex-shrink-0" />
          <span className="truncate">{roomName}</span>
        </div>
      </div>
      {absent ? (
        <span className="text-[.75rem] font-bold text-ink-2 bg-soft px-2.5 py-1 rounded-full flex-shrink-0">Assente</span>
      ) : done ? (
        <span role="img" aria-label="Fatto" className="w-[26px] h-[26px] rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        </span>
      ) : (
        <span role="img" aria-label="Da fare" className="w-[26px] h-[26px] rounded-full border-2 border-strong box-border flex-shrink-0" />
      )}
    </div>
  );

  // ── Card principale (il mio turno) ───────────────────────────────
  const period = fmtRange(week.start, week.end);
  return (
    <section aria-label={`Il tuo turno: ${roomName}`} className="bg-primary text-white rounded-3xl p-[18px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[.75rem] font-bold uppercase tracking-[.08em] text-on-primary">
          {roomTotal > 1 ? `Il tuo turno ${roomIndex}/${roomTotal}` : 'Il tuo turno'} · {period}
        </span>
        {done ? (
          <span className="bg-card text-primary text-[.75rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0">Completato</span>
        ) : absent ? (
          <span className="bg-card text-ink text-[.75rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0">Sei assente</span>
        ) : isCurW(week) ? (
          <span className="bg-soap text-ink text-[.75rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0">{daysLeft(week)}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-3.5">
        <span className="w-[60px] h-[60px] rounded-[18px] bg-white/15 flex items-center justify-center flex-shrink-0">
          <RoomIcon icon={roomIcon} size={32} />
        </span>
        <div className="min-w-0">
          <div className={'font-display font-bold text-[1.875rem] leading-[1.05] break-words ' + (done ? 'line-through' : '')}>
            {roomName}
          </div>
          <div className="text-[.875rem] text-on-primary mt-1">
            {isPastW(week) ? 'Turno concluso' : deadline(week)}
          </div>
        </div>
      </div>

      {!editable ? (
        <div className="h-[52px] rounded-2xl border-[1.5px] border-white/35 text-[.9375rem] font-semibold flex items-center justify-center gap-2">
          <Lock size={16} aria-hidden="true" /> {done ? 'Fatto' : 'Non fatto'}
        </div>
      ) : done ? (
        <button
          type="button"
          onClick={() => onToggle(week.id, userId, roomId)}
          className="h-[52px] rounded-2xl border-[1.5px] border-white/35 bg-transparent text-white text-[.9375rem] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          <Undo2 size={18} aria-hidden="true" /> Annulla
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(week.id, userId, roomId)}
          className="h-[52px] rounded-2xl border-0 bg-soap text-ink text-[1rem] font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-soap-dark transition-colors"
        >
          <Check size={20} strokeWidth={2.6} aria-hidden="true" /> Segna come fatto
        </button>
      )}
    </section>
  );
}
