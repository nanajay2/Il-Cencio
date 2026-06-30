import { fmt, isCurW, isPastW } from '../constants.js';

const arrowCls =
  'w-10 h-10 rounded-full border-0 bg-brown text-white text-[1.3rem] cursor-pointer flex items-center justify-center ' +
  'shadow-[0_2px_8px_rgba(0,0,0,.2)] transition-all hover:bg-brown-mid hover:scale-[1.06] flex-shrink-0 ' +
  'disabled:bg-border disabled:text-ink-2 disabled:shadow-none disabled:cursor-default disabled:scale-100';

export function WeekNavigator({ week, currentIdx, totalWeeks, onPrev, onNext, onThisWeek, onGenerate }) {
  if (!week) return null;

  const isCur  = isCurW(week);
  const isPast = isPastW(week);
  const statusLabel  = isCur ? 'Questa settimana' : isPast ? 'Settimana passata' : 'Settimana futura';
  const statusColors = isCur
    ? 'bg-green-pale text-green'
    : isPast
    ? 'bg-cream-2 text-ink-2'
    : 'bg-[#f5e8cf] text-[#7a5010]';

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <button className={arrowCls} onClick={onPrev} disabled={currentIdx === 0}>‹</button>

        <div className="text-center flex-1 px-2.5">
          <div className="text-[.95rem] font-extrabold text-ink">
            {fmt(week.start)} – {fmt(week.end)}
          </div>
          <div className="mt-1">
            <span className={`inline-block text-[.65rem] font-bold uppercase tracking-[.07em] px-2.5 py-0.5 rounded-full ${statusColors}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <button className={arrowCls} onClick={onNext} disabled={currentIdx === totalWeeks - 1}>›</button>
      </div>

      <div className="flex gap-2 px-5 pt-[14px]">
        <button
          onClick={onThisWeek}
          className="flex-1 py-2.5 border-0 rounded-full bg-brown text-white font-bold text-[.8rem] cursor-pointer hover:bg-brown-mid transition-colors shadow-[0_2px_8px_rgba(46,26,14,.3)]"
        >
          Questa settimana
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 py-2.5 border-[1.5px] border-border rounded-full bg-card text-ink-2 font-bold text-[.8rem] cursor-pointer hover:bg-cream-2 hover:border-brown-soft transition-colors"
        >
          ＋ Prossima
        </button>
      </div>
    </>
  );
}
