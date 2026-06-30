import { DAYS, MONTHS } from '../constants.js';

export function Header({ houseName, currentUser, isAdmin, onLogout, onAdmin, onRefresh }) {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="bg-gradient-to-br from-[#2e1a0e] via-[#3d2314] to-[#2a180c] px-5 pt-[18px] pb-[14px] shadow-[0_2px_16px_rgba(0,0,0,.3)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-[1.65rem] text-white leading-[1.1] tracking-[-0.01em]">
            <span className="text-[1.4rem] mr-1.5">🏠</span>{houseName || 'Turni di Casa'}
          </div>
          <div className="text-[.72rem] text-white/50 mt-1 tracking-[.03em]">{dateStr}</div>
        </div>
        <div className="flex gap-2 mt-0.5">
          {isAdmin && (
            <button
              onClick={onAdmin}
              title="Pannello admin"
              className="w-[34px] h-[34px] rounded-full border-0 bg-white/10 text-white/80 text-[.9rem] cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ⚙️
            </button>
          )}
          {currentUser && (
            <button
              onClick={onLogout}
              className="h-[34px] px-3 rounded-full border-0 bg-white/10 text-white/75 text-[.72rem] font-bold cursor-pointer hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Esci →
            </button>
          )}
          <button
            onClick={onRefresh}
            title="Aggiorna"
            className="w-[34px] h-[34px] rounded-full border-0 bg-white/10 text-white/80 text-[.95rem] cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>
      {currentUser && (
        <div className="mt-[10px] text-[.78rem] text-white/60">
          Ciao, <strong className="text-white/85">{currentUser}</strong>
        </div>
      )}
    </header>
  );
}
