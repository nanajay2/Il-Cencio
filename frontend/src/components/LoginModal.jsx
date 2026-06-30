import { PEOPLE, PEOPLE_EMAILS } from '../constants.js';

export function LoginModal({ onLogin }) {
  return (
    <div className="login-overlay open">
      <div className="login-sheet">
        <div className="modal-handle" />
        <h2>Chi sei? 🏠</h2>
        <p>Tocca il tuo nome per accedere</p>
        <div className="person-grid">
          {PEOPLE.map(name => (
            <button key={name} className="person-btn" onClick={() => onLogin(name)}>
              <span className="pb-name">{name}</span>
              <span className="pb-email">{PEOPLE_EMAILS[name]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
