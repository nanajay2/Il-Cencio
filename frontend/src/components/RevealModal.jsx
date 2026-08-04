import { useEffect, useRef } from 'react';
import { Cat } from 'lucide-react';
import { isCurW } from '../constants.js';

export function RevealModal({ week, userId, onDismiss }) {
  const dismissed = useRef(false);

  const assignments = week?.assignments?.filter(a => a.userId === userId) ?? [];
  const revealKey  = week && userId ? `revealed_${week.id}_${userId}` : null;

  useEffect(() => {
    if (!week || !userId || !isCurW(week)) return;
    if (!assignments.length) return;
    if (localStorage.getItem(revealKey)) return;
    localStorage.setItem(revealKey, '1');
    dismissed.current = false;
    const timer = setTimeout(() => { if (!dismissed.current) onDismiss(); }, 4500);
    return () => clearTimeout(timer);
  }, [week?.id, userId]);

  if (!week || !userId || !isCurW(week)) return null;
  if (!assignments.length) return null;
  if (!localStorage.getItem(revealKey)) return null;

  function dismiss() { dismissed.current = true; onDismiss(); }

  return (
    <div
      className="fixed inset-0 bg-[rgba(5,2,0,.84)] backdrop-blur-[10px] z-[500] flex items-center justify-center p-6"
      onClick={dismiss}
    >
      <div className="bg-card rounded-[28px] p-[44px_32px_40px] text-center max-w-[300px] w-full shadow-[0_20px_60px_rgba(0,0,0,.45)] relative overflow-hidden [animation:popIn_.5s_cubic-bezier(.34,1.56,.64,1)]">
        <span className="sparkle" /><span className="sparkle" /><span className="sparkle" />
        <span className="sparkle" /><span className="sparkle" /><span className="sparkle" />

        <span className="flex justify-center text-brown mb-[14px] [animation:revealBounce_.65s_ease-in-out_infinite_alternate]"><Cat size={45} /></span>
        <div className="text-[.72rem] font-bold uppercase tracking-[.1em] text-ink-2 mb-[10px]">
          Il tuo turno questa settimana
        </div>
        {assignments.map(a => (
          <div key={a.roomId} className="mb-1.5">
            <span className="block text-[2.2rem] mb-1.5">{a.roomIcon || '✨'}</span>
            <div className="font-serif text-[2rem] text-brown leading-[1.2]">{a.roomName}</div>
          </div>
        ))}
        <div className="text-[.75rem] text-ink-2 mt-2">Tocca per chiudere</div>
      </div>
    </div>
  );
}
