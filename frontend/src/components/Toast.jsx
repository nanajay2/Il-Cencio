import { useState, useCallback, useRef } from 'react';
import { CircleCheck, CircleX, Info } from 'lucide-react';

export function useToast() {
  const [toast, setToast] = useState({ msg: '', type: '', visible: false });
  const timer = useRef(null);

  const show = useCallback((msg, type = '') => {
    clearTimeout(timer.current);
    setToast({ msg, type, visible: true });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), type === 'error' ? 3000 : 2800);
  }, []);

  return { toast, show };
}

const ICONS = { error: CircleX, success: CircleCheck };

export function Toast({ toast }) {
  const colorCls = toast.type === 'error'   ? 'bg-red'
                 : toast.type === 'success' ? 'bg-primary'
                 : 'bg-ink';

  const visibleCls = toast.visible
    ? 'translate-y-0 scale-100'
    : 'translate-y-40 scale-95';

  const Icon = ICONS[toast.type] ?? Info;

  return (
    <div
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-1/2 -translate-x-1/2 ${visibleCls} ${colorCls} text-white px-5 py-[11px] rounded-2xl max-w-[calc(100%-2rem)] w-max text-[.83rem] font-bold tracking-[.02em] shadow-[0_6px_24px_rgba(0,0,0,.22)] transition-[transform] duration-[280ms] pointer-events-none z-[650] [transition-timing-function:cubic-bezier(.34,1.4,.64,1)] flex items-center gap-2 break-words`}
    >
      <Icon size={16} strokeWidth={2.5} className="flex-shrink-0" />
      {toast.msg}
    </div>
  );
}
