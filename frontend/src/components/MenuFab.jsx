import { useState } from 'react';

export function MenuFab({
  isAdmin, pendingSwaps,
  onOpenAbsences, onOpenSwaps, onOpenRooms, onOpenCoinquilini, onOpenRotation, onOpenSettings, onGenerateWeek,
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { icon: '🔭', label: 'Genera turno futuro', onClick: onGenerateWeek },
    { icon: '🗓️', label: 'Assenze', onClick: onOpenAbsences },
    { icon: '🔁', label: 'Scambio turni', badge: pendingSwaps, onClick: onOpenSwaps },
    { icon: '🏠', label: 'Stanze', onClick: onOpenRooms },
    ...(isAdmin ? [
      { icon: '👥', label: 'Coinquilini', onClick: onOpenCoinquilini },
      { icon: '⏳', label: 'Turni (rotazione)', onClick: onOpenRotation },
    ] : []),
    { icon: '⚙️', label: 'Impostazioni', onClick: onOpenSettings },
  ];

  function pick(fn) {
    setOpen(false);
    fn();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[240] transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={() => setOpen(false)}
      />

      <div
        className="fixed z-[245] flex flex-col-reverse items-end gap-3"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 5.25rem)', right: '1.25rem',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            className="transition-all ease-out"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(14px) scale(.8)',
              transitionDuration: '180ms',
              transitionDelay: open ? `${i * 35}ms` : '0ms',
            }}
          >
            <button
              onClick={() => pick(item.onClick)}
              aria-label={item.label}
              title={item.label}
              className="relative w-12 h-12 rounded-full bg-card border border-border text-[1.25rem] flex items-center justify-center cursor-pointer shadow-[0_2px_10px_rgba(46,26,14,.18)] hover:bg-cream-2 transition-colors flex-shrink-0"
            >
              {item.icon}
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c0392b] text-white text-[.6rem] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
        title="Menu"
        className="fixed right-4 z-[250] w-14 h-14 rounded-full bg-brown text-[1.4rem] border-0 cursor-pointer flex items-center justify-center shadow-[0_4px_16px_rgba(78,34,15,.35)] hover:bg-brown-mid transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <span
          className="relative flex items-center justify-center w-full h-full transition-transform duration-200 ease-out"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          {open ? '✕' : '⋮'}
          {!open && pendingSwaps > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#c0392b] text-white text-[.65rem] font-bold flex items-center justify-center">
              {pendingSwaps}
            </span>
          )}
        </span>
      </button>
    </>
  );
}
