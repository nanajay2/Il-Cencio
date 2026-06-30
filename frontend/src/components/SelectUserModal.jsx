export function SelectUserModal({ users, onSelect }) {
  const claimed = users.filter(u => u.claimed);

  return (
    <div className="fixed inset-0 bg-[rgba(5,2,0,.72)] backdrop-blur-[6px] z-[400] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-card w-full sm:max-w-[380px] rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 shadow-[0_-8px_40px_rgba(0,0,0,.3)] sm:shadow-[0_20px_60px_rgba(0,0,0,.4)]">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="font-serif text-[1.55rem] text-brown text-center mb-1">Chi sei?</h2>
        <p className="text-[.8rem] text-ink-2 text-center mb-5">Tocca il tuo nome per accedere</p>

        <div className="flex flex-col gap-2.5">
          {claimed.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full text-left px-5 py-4 bg-cream-2 rounded-[14px] border border-border text-[1rem] font-bold text-ink hover:bg-sage hover:border-border transition-colors cursor-pointer"
            >
              {u.name}
            </button>
          ))}
          {claimed.length === 0 && (
            <p className="text-[.85rem] text-ink-2 text-center py-4">
              Nessun coinquilino ha ancora attivato il proprio account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
