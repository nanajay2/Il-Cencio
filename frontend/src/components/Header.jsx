import { DAYS, MONTHS } from '../constants.js';

export function Header({ currentUser, onLogout, onRefresh }) {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header>
      <div className="header-top">
        <div>
          <div className="header-title"><span>🏠</span>Turni di Casa</div>
          <div className="header-date">{dateStr}</div>
        </div>
        <div className="header-btns">
          {currentUser && (
            <button className="logout-btn" onClick={onLogout}>Esci →</button>
          )}
          <button className="icon-btn" onClick={onRefresh} title="Aggiorna">↻</button>
        </div>
      </div>
    </header>
  );
}
