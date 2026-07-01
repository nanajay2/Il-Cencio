import { isEditable } from '../constants.js';

// assignment: { userId, userName, roomId, roomName, roomIcon, roomColor, done }
export function ChoreCard({ assignment, absent, isMe, compact, week, onToggle, roomIndex, roomTotal }) {
  const { userId, roomId, userName, roomName, roomIcon, roomColor, done } = assignment;
  const editable = isEditable(week);

  // ── Compact variant (altri coinquilini) ──────────────────────────
  if (compact) return (
    <div className={`flex items-center gap-3 px-4 py-[11px] transition-opacity ${absent ? 'opacity-40' : ''}`}>
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[.72rem] font-extrabold text-white"
        style={{ background: roomColor }}
      >
        {userName.charAt(0)}
      </div>
      <span className="flex-1 text-[.88rem] font-semibold text-ink truncate">{userName}</span>
      {absent && (
        <span className="text-[.6rem] font-bold tracking-[.04em] text-ink-2 bg-cream-2 px-2 py-0.5 rounded-full">assente</span>
      )}
      <span className="text-[1.05rem]">{roomIcon}</span>
      <span className="text-[.82rem] text-ink-2 max-w-[90px] truncate">{roomName}</span>
      <span
        className="w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all"
        style={done
          ? { background: roomColor, borderColor: roomColor }
          : { borderColor: '#BDB395' }
        }
      >
        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
    </div>
  );

  // ── Hero variant (il mio turno) ──────────────────────────────────
  return (
    <div
      className="bg-card rounded-2xl overflow-hidden border-2 transition-all"
      style={{ borderColor: done ? '#D5C7A3' : '#BDB395' }}
    >
      {/* Striscia colore in cima */}
      <div className="h-1.5 transition-colors" style={{ background: done ? '#D5C7A3' : '#BDB395' }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <span className="text-[.65rem] font-bold uppercase tracking-[.08em] text-ink-2">
            {roomTotal > 1 ? `Il tuo turno (${roomIndex}/${roomTotal})` : 'Il tuo turno'}
          </span>
          {absent && (
            <span className="text-[.6rem] font-bold tracking-[.04em] text-brown-soft bg-cream-2 px-2 py-0.5 rounded-full">
              sei assente
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 mb-5">
          <span
            className="text-[3rem] leading-none w-[60px] h-[60px] flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: done ? '#F6F0F0' : '#D5C7A3' }}
          >
            {roomIcon}
          </span>
          <div>
            <div className={`font-serif text-[1.55rem] leading-tight ${done ? 'text-ink-2 line-through' : 'text-ink'}`}>
              {roomName}
            </div>
            {done && <div className="text-[.75rem] text-ink-2 mt-0.5">Completato ✓</div>}
          </div>
        </div>

        {editable ? (
          <button
            className="w-full py-3 rounded-xl font-bold text-[.88rem] border-0 cursor-pointer transition-all"
            style={done
              ? { background: '#F6F0F0', color: '#7A5038' }
              : { background: '#BDB395', color: '#4E220F', border: '1.5px solid #a89e83', boxShadow: '0 2px 8px rgba(168,158,131,.35)' }
            }
            onClick={() => onToggle(week.id, userId, roomId)}
          >
            {done ? '↩ Segna come non fatto' : 'Segna come fatto ✓'}
          </button>
        ) : (
          <div
            className="w-full py-3 rounded-xl text-[.85rem] text-center font-semibold"
            style={{ background: '#F6F0F0', color: '#7A5038', opacity: .7 }}
          >
            🔒 {done ? 'Fatto' : 'Non ancora fatto'}
          </div>
        )}
      </div>
    </div>
  );
}
