export function AbsencesFab({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Assenze"
      title="Assenze"
      className="fixed right-4 z-[250] w-14 h-14 rounded-full bg-brown text-[1.4rem] border-0 cursor-pointer flex items-center justify-center shadow-[0_4px_16px_rgba(78,34,15,.35)] hover:bg-brown-mid transition-colors"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      🗓️
    </button>
  );
}
