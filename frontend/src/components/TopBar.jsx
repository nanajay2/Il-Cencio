import { Home, ChevronDown, Bell } from 'lucide-react';
import { Avatar } from './Avatar.jsx';

// Barra in cima a Oggi: casa attiva e accesso alle impostazioni.
export function TopBar({ houseName, userName, notificationsOff, onOpenSwitcher, onOpenSettings }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onOpenSwitcher}
        aria-label={`Cambia casa, casa attiva: ${houseName}`}
        className="min-w-0 h-11 pl-3 pr-3.5 rounded-full border border-border bg-card text-ink text-[.875rem] font-semibold cursor-pointer flex items-center gap-1.5"
      >
        <Home size={18} className="text-primary flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{houseName || 'Il Cencio'}</span>
        <ChevronDown size={16} strokeWidth={2.4} className="text-ink-2 flex-shrink-0" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={notificationsOff ? 'Notifiche non attive, apri le impostazioni' : 'Notifiche, apri le impostazioni'}
          className="relative w-11 h-11 rounded-full border border-border bg-card text-ink cursor-pointer flex items-center justify-center"
        >
          <Bell size={20} aria-hidden="true" />
          {notificationsOff && (
            <span className="absolute top-[9px] right-[10px] w-[10px] h-[10px] rounded-full bg-red border-2 border-card" />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={`Impostazioni di ${userName}`}
          className="w-11 h-11 rounded-full border-0 p-0 bg-transparent cursor-pointer"
        >
          <Avatar name={userName} size={44} />
        </button>
      </div>
    </div>
  );
}
