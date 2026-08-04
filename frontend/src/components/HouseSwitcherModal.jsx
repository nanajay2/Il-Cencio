import { Check, LogIn, Home } from 'lucide-react';

export function HouseSwitcherModal({ accounts, activeHouseId, activeUserId, onSelect, onAddExisting, onAddNew, onClose }) {
  return (
    <div className="fixed inset-0 bg-[rgba(10,5,2,.72)] backdrop-blur-md z-[400] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl w-full max-w-[480px] px-6 pt-7 pb-11 shadow-[0_-8px_40px_rgba(0,0,0,.25)] [animation:slideUp_.35s_cubic-bezier(.34,1.56,.64,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <h2 className="font-serif text-[1.3rem] text-ink mb-1">Le tue case</h2>
        <p className="text-[.82rem] text-ink-2 mb-5">Passa da una casa all'altra o aggiungine una nuova</p>

        <div className="flex flex-col gap-2 mb-4">
          {accounts.map(a => {
            const active = a.houseId === activeHouseId && a.userId === activeUserId;
            return (
              <button
                key={`${a.houseId}:${a.userId}`}
                onClick={() => !active && onSelect(a)}
                className={
                  'p-[14px_16px] border-[1.5px] rounded-2xl cursor-pointer font-sans text-left transition-all flex items-center justify-between gap-3 ' +
                  (active ? 'border-brown bg-brown/20' : 'border-border bg-cream hover:border-sage hover:bg-cream-2')
                }
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[.95rem] font-extrabold text-ink truncate">{a.houseName}</span>
                  <span className="text-[.72rem] text-ink-2 truncate">{a.userName}{a.isAdmin ? ' · admin' : ''}</span>
                </span>
                {active && <Check size={18} className="text-ink flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <button
            onClick={onAddExisting}
            className="w-full py-3 rounded-2xl border-[1.5px] border-dashed border-border bg-transparent cursor-pointer text-[.85rem] font-bold text-ink-2 hover:border-brown hover:text-brown transition-colors flex items-center justify-center gap-1.5"
          >
            <LogIn size={16} /> Entra in un'altra casa
          </button>
          <button
            onClick={onAddNew}
            className="w-full py-3 rounded-2xl border-[1.5px] border-dashed border-border bg-transparent cursor-pointer text-[.85rem] font-bold text-ink-2 hover:border-brown hover:text-brown transition-colors flex items-center justify-center gap-1.5"
          >
            <Home size={16} /> Crea una nuova casa
          </button>
        </div>
      </div>
    </div>
  );
}
