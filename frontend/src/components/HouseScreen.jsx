import { Home, Share2, ChevronRight, DoorOpen, Users, ClipboardList, RotateCw, Coffee, Sparkles } from 'lucide-react';
import { usePush } from '../hooks/usePush.js';

const ROTATION_LABELS = { weekly: 'Ogni settimana', monthly: 'Ogni mese' };

function rotationHint(house) {
  if (house.rotationType === 'daily') {
    return house.rotationDays === 1 ? 'Ogni giorno' : `Ogni ${house.rotationDays} giorni`;
  }
  return ROTATION_LABELS[house.rotationType] ?? ROTATION_LABELS.weekly;
}

function ManageRow({ icon: Icon, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 min-h-[52px] px-4 border-0 bg-transparent text-left text-ink cursor-pointer hover:bg-page transition-colors"
    >
      <span className="w-[34px] h-[34px] rounded-[10px] bg-page text-primary flex items-center justify-center flex-shrink-0">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0 text-[.9375rem] font-semibold truncate">{label}</span>
      {hint !== undefined && <span className="text-[.8125rem] text-ink-2 flex-shrink-0">{hint}</span>}
      <ChevronRight size={18} strokeWidth={2.2} className="text-ink-2 flex-shrink-0" aria-hidden="true" />
    </button>
  );
}

export function HouseScreen({ session, house, houseId, onOpenSwitcher, onOpenSub, onLogout, onLeaveHouse }) {
  const push = usePush();
  const isAdmin = session.isAdmin;
  const rules = house?.rules ?? [];
  const showRules = isAdmin || rules.length > 0;
  const memberCount = house?.users?.length ?? 0;
  const pushOn = push.status === 'active';
  const pushToggleable = push.status === 'active' || push.status === 'inactive';

  return (
    <>
      <h1 className="font-display font-extrabold text-[1.875rem] leading-[1.1] tracking-[-.02em]">Casa</h1>

      <section aria-label={session.houseName} className="bg-primary text-white rounded-[20px] p-4 flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-[14px] bg-white/15 flex items-center justify-center flex-shrink-0">
            <Home size={28} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[1.375rem] leading-tight break-words">{session.houseName}</div>
            <div className="text-[.8125rem] text-on-primary">
              {memberCount} {memberCount === 1 ? 'coinquilino' : 'coinquilini'}{house ? ` · ${rotationHint(house).toLowerCase()}` : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSwitcher}
            className="h-9 px-3 rounded-full border-[1.5px] border-white/35 bg-transparent text-white text-[.8125rem] font-bold cursor-pointer flex-shrink-0"
          >
            Cambia
          </button>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onOpenSub('coinquilini')}
            className="h-12 rounded-[14px] border-0 bg-soap text-ink text-[.9375rem] font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-soap-dark transition-colors"
          >
            <Share2 size={18} aria-hidden="true" /> Invita un coinquilino
          </button>
        )}
      </section>

      {house && (
        <section aria-label="Gestione della casa" className="bg-card rounded-[20px] py-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
            <h2 className="text-[.75rem] font-bold text-ink-2 uppercase tracking-[.06em]">Gestione</h2>
            {isAdmin && <span className="text-[.6875rem] font-bold text-primary bg-primary-soft px-2 py-[3px] rounded-full">Admin</span>}
          </div>
          <ManageRow icon={DoorOpen} label="Stanze" hint={house.rooms.length} onClick={() => onOpenSub('stanze')} />
          {isAdmin && <ManageRow icon={Users} label="Coinquilini" hint={memberCount} onClick={() => onOpenSub('coinquilini')} />}
          {showRules && <ManageRow icon={ClipboardList} label="Regole" hint={rules.length} onClick={() => onOpenSub('regole')} />}
          {isAdmin && <ManageRow icon={RotateCw} label="Rotazione turni" hint={rotationHint(house)} onClick={() => onOpenSub('rotazione')} />}
        </section>
      )}

      <section aria-label="Le tue impostazioni" className="bg-card rounded-[20px] py-1 overflow-hidden">
        <h2 className="text-[.75rem] font-bold text-ink-2 uppercase tracking-[.06em] px-4 pt-2.5 pb-1">Tu</h2>

        <div className="flex items-center gap-3 min-h-[52px] px-4">
          <span id="push-label" className="flex-1 text-[.9375rem] font-semibold">Notifiche push</span>
          {pushToggleable && (
            <button
              type="button"
              role="switch"
              aria-checked={pushOn}
              aria-labelledby="push-label"
              disabled={push.loading}
              onClick={() => pushOn ? push.unsubscribe(houseId) : push.subscribe(houseId)}
              className={
                'w-[52px] h-8 rounded-full border-0 p-[3px] flex cursor-pointer transition-colors disabled:opacity-60 flex-shrink-0 ' +
                (pushOn ? 'bg-primary justify-end' : 'bg-strong justify-start')
              }
            >
              <span className="w-[26px] h-[26px] rounded-full bg-card shadow-[0_1px_3px_rgba(23,36,31,.25)]" />
            </button>
          )}
          {push.status === 'denied' && (
            <button
              type="button"
              disabled={push.loading}
              onClick={() => push.subscribe(houseId)}
              className="h-9 px-3 rounded-full border border-border bg-card text-primary text-[.8125rem] font-bold cursor-pointer flex-shrink-0"
            >
              Riprova
            </button>
          )}
        </div>
        {push.status === 'unsupported' && (
          <p className="text-[.8125rem] text-ink-2 px-4 pb-3 -mt-1">
            Non supportate su questo browser. Su iOS servono Safari 16.4+ e l'app installata da schermata Home.
          </p>
        )}
        {push.status === 'denied' && (
          <p className="text-[.8125rem] text-ink-2 px-4 pb-3 -mt-1">
            Permesso negato. Riabilita le notifiche per questo sito dalle impostazioni del browser, poi tocca "Riprova".
          </p>
        )}

        <button
          type="button"
          onClick={onLeaveHouse}
          className="w-full min-h-[52px] px-4 border-0 border-t border-soft bg-transparent text-left text-ink text-[.9375rem] font-semibold cursor-pointer"
        >
          Abbandona questa casa
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[52px] px-4 border-0 border-t border-soft bg-transparent text-left text-red text-[.9375rem] font-bold cursor-pointer"
        >
          Esci
        </button>
      </section>

      <a
        href="https://buymeacoffee.com/dadaism0x"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-card rounded-[20px] p-4 text-center no-underline text-ink hover:opacity-90 transition-opacity"
      >
        <div className="font-bold text-[.9375rem] flex items-center justify-center gap-1.5"><Coffee size={16} aria-hidden="true" /> Ti piace Il Cencio?</div>
        <p className="text-[.8125rem] text-ink-2 flex items-center justify-center gap-1 mt-0.5">
          Clicca qui per offrirmi un caffè e aiutarmi a tenerla sempre viva <Sparkles size={13} className="flex-shrink-0" aria-hidden="true" />
        </p>
      </a>

      <p className="text-center text-[.75rem] text-ink-2">Il Cencio v{__APP_VERSION__}</p>
    </>
  );
}
