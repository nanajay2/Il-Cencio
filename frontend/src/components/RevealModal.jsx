import { useEffect, useRef } from 'react';
import { ICONS, isCurW } from '../constants.js';

export function RevealModal({ week, currentUser, onDismiss }) {
  const dismissed = useRef(false);

  useEffect(() => {
    if (!week || !currentUser || !isCurW(week)) return;
    const key = `revealed_${week.id}_${currentUser}`;
    if (localStorage.getItem(key)) return;
    const chore = week.assignments?.[currentUser];
    if (!chore) return;
    localStorage.setItem(key, '1');
    dismissed.current = false;

    const timer = setTimeout(() => {
      if (!dismissed.current) onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [week?.id, currentUser]);

  if (!week || !currentUser || !isCurW(week)) return null;
  const key   = `revealed_${week.id}_${currentUser}`;
  const chore = week.assignments?.[currentUser];
  if (!chore || !localStorage.getItem(key)) return null;

  function dismiss() {
    dismissed.current = true;
    onDismiss();
  }

  return (
    <div className="reveal-overlay open" onClick={dismiss}>
      <div className="reveal-box">
        <span className="sparkle" /><span className="sparkle" /><span className="sparkle" />
        <span className="sparkle" /><span className="sparkle" /><span className="sparkle" />
        <span className="reveal-cat">🐱</span>
        <div className="reveal-title">Il tuo turno questa settimana</div>
        <span className="reveal-icon">{ICONS[chore] || '✨'}</span>
        <div className="reveal-chore">{chore}</div>
        <div className="reveal-sub">Tocca per chiudere</div>
      </div>
    </div>
  );
}
