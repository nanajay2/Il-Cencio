import { fmt, isCurW, isPastW } from '../constants.js';

export function WeekNavigator({ week, currentIdx, totalWeeks, onPrev, onNext, onThisWeek, onGenerate }) {
  if (!week) return null;

  const statusLabel = isCurW(week) ? 'Questa settimana' : isPastW(week) ? 'Settimana passata' : 'Settimana futura';
  const statusClass = isCurW(week) ? 'current'          : isPastW(week) ? 'past'              : 'future';

  return (
    <>
      <div className="week-nav">
        <button className="nav-arrow" onClick={onPrev} disabled={currentIdx === 0}>‹</button>
        <div className="week-label-wrap">
          <div className="week-label">{fmt(week.start)} – {fmt(week.end)}</div>
          <div><span className={`week-status ${statusClass}`}>{statusLabel}</span></div>
        </div>
        <button className="nav-arrow" onClick={onNext} disabled={currentIdx === totalWeeks - 1}>›</button>
      </div>

      <div className="week-actions">
        <button className="btn-this-week" onClick={onThisWeek}>Questa settimana</button>
        <button className="btn-add-week"  onClick={onGenerate}>＋ Prossima</button>
      </div>
    </>
  );
}
