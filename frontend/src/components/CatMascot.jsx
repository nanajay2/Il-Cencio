import { isCurW } from '../constants.js';

function catState(weeks, userId) {
  if (!userId || !weeks.length) return 'tranquillo';
  const sorted   = [...weeks].sort((a, b) => a.start.localeCompare(b.start));
  const curIdx   = sorted.findIndex(w => isCurW(w));
  const curWeek  = curIdx >= 0 ? sorted[curIdx]     : null;
  const prevWeek = curIdx >  0 ? sorted[curIdx - 1] : null;
  const day      = new Date().getDay();
  const curDone  = curWeek?.assignments?.find(a => a.userId === userId)?.done  ?? false;
  const prevDone = prevWeek ? (prevWeek.assignments?.find(a => a.userId === userId)?.done ?? false) : true;

  if (curWeek && (day === 4 || day === 5) && !curDone) return 'agitato';
  if (curDone)                                          return 'felice';
  if (prevWeek && !prevDone)                            return 'triste';
  return 'tranquillo';
}

export function CatMascot({ weeks, userId }) {
  const state = catState(weeks, userId);

  return (
    <div
      id="cat-mascot"
      className={`fixed bottom-5 right-4 w-16 h-16 z-[100] cursor-default select-none drop-shadow-[0_3px_8px_rgba(0,0,0,.18)] cat-${state}`}
    >
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M48,53 Q61,42 55,27" stroke="#2e1a0e" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <ellipse cx="30" cy="46" rx="17" ry="13" fill="#f5efe6" stroke="#2e1a0e" strokeWidth="1.5"/>
        <ellipse cx="30" cy="49" rx="8" ry="5.5" fill="#ede4d8"/>
        <circle cx="30" cy="24" r="14" fill="#f5efe6" stroke="#2e1a0e" strokeWidth="1.5"/>
        <polygon points="18,15 13,4 24,13" fill="#c97b4b"/>
        <polygon points="42,15 47,4 36,13" fill="#c97b4b"/>
        <polygon points="18,15 16,7 23,13" fill="#f5efe6" opacity=".45"/>
        <polygon points="42,15 44,7 37,13" fill="#f5efe6" opacity=".45"/>
        <ellipse cx="25" cy="23" rx="2.5" ry="3" fill="#2e1a0e"/>
        <ellipse cx="35" cy="23" rx="2.5" ry="3" fill="#2e1a0e"/>
        <circle cx="26" cy="21.5" r=".9" fill="#fff"/>
        <circle cx="36" cy="21.5" r=".9" fill="#fff"/>
        <path d="M28.5,28.5 L30,30.5 L31.5,28.5 Z" fill="#c97b4b"/>
        <line x1="22" y1="28" x2="13" y2="26" stroke="#2e1a0e" strokeWidth=".8" opacity=".4"/>
        <line x1="22" y1="30" x2="13" y2="31.5" stroke="#2e1a0e" strokeWidth=".8" opacity=".4"/>
        <line x1="38" y1="28" x2="47" y2="26" stroke="#2e1a0e" strokeWidth=".8" opacity=".4"/>
        <line x1="38" y1="30" x2="47" y2="31.5" stroke="#2e1a0e" strokeWidth=".8" opacity=".4"/>
        <path d="M27,31.5 Q30,34.5 33,31.5" stroke="#2e1a0e" strokeWidth="1" strokeLinecap="round" fill="none"/>
        <ellipse className="cat-tear" cx="24" cy="30" rx="1.3" ry="2.5" fill="#6a96c4"/>
        <ellipse className="cat-tear" cx="36" cy="30" rx="1.3" ry="2.5" fill="#6a96c4"/>
      </svg>
    </div>
  );
}
