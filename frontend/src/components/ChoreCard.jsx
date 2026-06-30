import { ICONS, CHORE_COLORS, isEditable } from '../constants.js';

export function ChoreCard({ chore, person, done, absent, isMe, week, onToggle }) {
  const color    = CHORE_COLORS[chore];
  const editable = isEditable(week);
  const cardCls  = ['chore-card', done ? 'done' : '', absent ? 'absent' : '', isMe ? 'me' : 'others']
    .filter(Boolean).join(' ');

  return (
    <div className={cardCls} style={isMe ? { borderColor: color } : {}}>
      {isMe && <div className="me-badge">TU 🏠</div>}
      <div className="card-accent" style={{ background: color }} />
      <div className="card-inner">
        <div className="card-icon">{ICONS[chore]}</div>
        <div className="card-info">
          <div className="card-chore">{chore}</div>
          <div className="card-person">
            Tocca a: <strong>{person}</strong>
            {absent && <span className="absent-tag">assente</span>}
          </div>
          {editable ? (
            <button
              className={`done-btn ${done ? 'checked' : ''}`}
              style={{ '--accent': color }}
              onClick={() => onToggle(week.id, person)}
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
