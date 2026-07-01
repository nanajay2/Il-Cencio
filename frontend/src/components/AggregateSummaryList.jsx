export function AggregateSummaryList({ perUser }) {
  return (
    <div className="flex flex-col gap-2">
      {perUser.map(u => (
        <div key={u.userId} className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-ink text-[.92rem]">{u.userName}</span>
            <span className="text-[.7rem] font-bold text-ink-2 bg-cream-2 px-2 py-0.5 rounded-full">
              {u.totalCount} {u.totalCount === 1 ? 'turno' : 'turni'}
            </span>
          </div>
          {u.rooms.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {u.rooms.map(r => (
                <span
                  key={r.roomId}
                  className="flex items-center gap-1 text-[.78rem] text-ink-2 bg-cream px-2 py-1 rounded-full border border-border"
                >
                  <span>{r.roomIcon}</span> {r.roomName}{r.count > 1 ? ` ×${r.count}` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[.78rem] text-ink-2">Nessun turno in questo periodo.</p>
          )}
        </div>
      ))}
    </div>
  );
}
