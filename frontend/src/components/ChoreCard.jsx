import { isEditable } from '../constants.js';

// assignment: { userId, userName, roomId, roomName, roomIcon, roomColor, done }
export function ChoreCard({ assignment, absent, isMe, dimmed, week, onToggle }) {
  const { userId, userName, roomName, roomIcon, roomColor, done } = assignment;
  const color    = roomColor;
  const editable = isEditable(week);

  const cardCls = [
    'bg-card rounded-2xl border border-border relative overflow-hidden',
    'shadow-[0_1px_3px_rgba(0,0,0,.05),0_4px_12px_rgba(0,0,0,.06)]',
    'flex items-stretch transition-[box-shadow,transform] duration-[180ms]',
    'hover:shadow-[0_2px_6px_rgba(0,0,0,.07),0_8px_24px_rgba(0,0,0,.09)] hover:-translate-y-px',
    done   ? 'bg-[#f9fdf9]'   : '',
    absent ? 'opacity-[.45]'  : '',
    isMe   ? 'scale-[1.015] border-2 z-[1] shadow-[0_4px_14px_rgba(0,0,0,.11),0_10px_30px_rgba(0,0,0,.13)]' : '',
    dimmed ? 'opacity-[.68]'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardCls} style={isMe ? { borderColor: color } : {}}>

      {isMe && (
        <div className="absolute top-[9px] right-2.5 text-[.58rem] font-extrabold tracking-[.05em] bg-brown text-white px-2 py-0.5 rounded-full">
          TU 🏠
        </div>
      )}

      <div className="w-[5px] flex-shrink-0" style={{ background: color }} />

      <div className="flex-1 p-[14px_16px_14px_14px] flex items-center gap-3">
        <div className="text-[1.7rem] flex-shrink-0 leading-none drop-shadow-sm">{roomIcon}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[1.05rem] font-extrabold leading-[1.2] ${done ? 'line-through text-[#a0b4a8]' : 'text-ink'}`}>
            {roomName}
          </div>
          <div className="text-[.82rem] text-ink-2 mt-[3px]">
            Tocca a: <strong className="text-ink font-bold">{userName}</strong>
            {absent && (
              <span className="inline-block text-[.62rem] font-bold tracking-[.04em] bg-cream-2 text-brown-soft px-[7px] py-[2px] rounded-full ml-1 align-middle">
                assente
              </span>
            )}
          </div>
          {editable ? (
            <button
              className={`done-btn ${done ? 'checked' : ''}`}
              style={{ '--accent': color }}
              onClick={() => onToggle(week.id, userId)}
            >
              <span className="done-dot" />
              {done ? 'Fatto ✓' : 'Segna come fatto'}
            </button>
          ) : (
            <span
              className="done-btn"
              style={{
                opacity: .45, cursor: 'default', '--accent': color,
                ...(done ? { background: color, borderColor: color, color: '#fff' } : {}),
              }}
            >
              🔒 {done ? 'Fatto ✓' : 'Non fatto'}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
