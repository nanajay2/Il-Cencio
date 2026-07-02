export function SwapsFab({ onClick, pendingCount }) {
  return (
    <button
      onClick={onClick}
      aria-label="Scambio turni"
      title="Scambio turni"
      className="fixed z-[250] w-14 h-14 rounded-full bg-brown text-[1.4rem] border-0 cursor-pointer flex items-center justify-center shadow-[0_4px_16px_rgba(78,34,15,.35)] hover:bg-brown-mid transition-colors"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)', right: 'calc(1rem + 4.25rem)' }}
    >
      <span className="relative flex items-center justify-center w-full h-full">
        🔁
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#c0392b] text-white text-[.65rem] font-bold flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </span>
    </button>
  );
}
