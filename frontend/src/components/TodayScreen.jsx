import { Loader2, ClipboardList, DoorOpen } from 'lucide-react';
import { DAYS, MONTHS_LONG } from '../constants.js';
import { ChoreCard } from './ChoreCard.jsx';
import { RoomIcon } from './RoomIcon.jsx';
import { TopBar } from './TopBar.jsx';
import { WeekAggregateView } from './WeekAggregateView.jsx';

function todayLabel() {
  const now = new Date();
  const day = DAYS[now.getDay()];
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${now.getDate()} ${MONTHS_LONG[now.getMonth()]}`;
}

export function TodayScreen({
  session, house, week, weeks, loading, loadError, onRetry, userId, isAbsent, notificationsOff,
  onOpenSwitcher, onOpenSettings, onAddRooms, onToggle, weekViewProps,
}) {
  const assignments = week?.assignments ?? [];
  const mine   = assignments.filter(a => a.userId === userId);
  const others = assignments.filter(a => a.userId !== userId);
  const uncovered = week ? (house?.rooms ?? []).filter(r => !assignments.some(a => a.roomId === r.id)) : [];
  const doneCount = assignments.filter(a => a.done).length;

  return (
    <>
      <TopBar
        houseName={session.houseName}
        userName={session.userName}
        notificationsOff={notificationsOff}
        onOpenSwitcher={onOpenSwitcher}
        onOpenSettings={onOpenSettings}
      />

      <div>
        <p className="text-[.875rem] text-ink-2">{todayLabel()}</p>
        <h1 className="font-display font-extrabold text-[2rem] leading-[1.1] tracking-[-.02em] mt-0.5 break-words">
          Ciao, {session.userName}
        </h1>
      </div>

      {week ? (
        <>
          {mine.length > 0 ? mine.map((a, i) => (
            <ChoreCard
              key={a.roomId}
              assignment={a}
              absent={isAbsent(a.userId, week.start, week.end)}
              week={week}
              onToggle={onToggle}
              roomIndex={i + 1}
              roomTotal={mine.length}
            />
          )) : (
            <section className="bg-card rounded-3xl p-6 text-center">
              <p className="font-display font-bold text-[1.25rem]">Nessun turno</p>
              <p className="text-[.875rem] text-ink-2 mt-1">Non hai stanze assegnate in questo periodo.</p>
            </section>
          )}

          <WeekAggregateView {...weekViewProps} />

          {assignments.length > 0 && (
            <section aria-label="La casa in questo turno" className="bg-card rounded-[20px] px-4 pt-3.5 pb-1.5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[.9375rem] font-bold">La casa in questo turno</h2>
                <span className="text-[.8125rem] text-ink-2 font-semibold">{doneCount}/{assignments.length} fatti</span>
              </div>
              <div className="h-1.5 rounded-full bg-soft overflow-hidden mb-1">
                <div
                  className="h-full bg-primary rounded-full transition-[width] duration-300"
                  style={{ width: `${(doneCount / assignments.length) * 100}%` }}
                />
              </div>
              <div className="divide-y divide-soft">
                {others.map(a => (
                  <ChoreCard
                    key={`${a.userId}-${a.roomId}`}
                    assignment={a}
                    absent={isAbsent(a.userId, week.start, week.end)}
                    compact
                    week={week}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Stanze scoperte: tutti gli idonei assenti, o stanza aggiunta a turno già iniziato */}
          {uncovered.length > 0 && (
            <section aria-label="Stanze scoperte" className="bg-card rounded-[20px] border border-dashed border-strong px-4 pt-3.5 pb-1.5">
              <h2 className="text-[.9375rem] font-bold mb-1">Stanze scoperte</h2>
              <div className="divide-y divide-soft">
                {uncovered.map(r => (
                  <div key={r.id} className="flex items-center gap-3 min-h-[54px] py-1.5">
                    <RoomIcon icon={r.icon} size={20} className="text-ink-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[.9375rem] font-semibold truncate">{r.name}</div>
                      <div className="text-[.8125rem] text-ink-2">Nessuno assegnato in questo turno</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : loadError && !loading ? (
        <section className="bg-card rounded-3xl p-6 text-center flex flex-col items-center gap-3">
          <p role="alert" className="text-[.875rem] text-ink break-words max-w-full">Impossibile caricare i turni: {loadError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-12 rounded-2xl border-0 bg-primary text-white text-[.9375rem] font-bold cursor-pointer hover:bg-primary-dark transition-colors"
          >
            Riprova
          </button>
        </section>
      ) : house?.rooms?.length === 0 && !loading ? (
        <section className="bg-card rounded-3xl p-6 text-center flex flex-col items-center gap-3">
          <DoorOpen size={36} className="text-primary" aria-hidden="true" />
          <div>
            <p className="font-display font-bold text-[1.25rem]">Mancano le stanze</p>
            <p className="text-[.875rem] text-ink-2 mt-1">Aggiungi le stanze della casa: i turni si creano da soli.</p>
          </div>
          <button
            type="button"
            onClick={onAddRooms}
            className="w-full h-[52px] rounded-2xl border-0 bg-soap text-ink text-[1rem] font-bold cursor-pointer hover:bg-soap-dark transition-colors"
          >
            Aggiungi stanze
          </button>
        </section>
      ) : (
        <section className="bg-card rounded-3xl p-10 text-center text-ink-2">
          <div className="flex justify-center mb-3">
            {loading
              ? <Loader2 size={36} className="animate-spin" aria-hidden="true" />
              : <ClipboardList size={36} aria-hidden="true" />}
          </div>
          <p className="text-[.875rem]">{loading ? 'Caricamento…' : 'Nessun turno disponibile.'}</p>
        </section>
      )}
    </>
  );
}
