import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ msg: '', type: '', visible: false });
  const timer = useRef(null);

  const show = useCallback((msg, type = '') => {
    clearTimeout(timer.current);
    setToast({ msg, type, visible: true });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  }, []);

  return { toast, show };
}

export function Toast({ toast }) {
  const colorCls = toast.type === 'error'   ? 'bg-red'
                 : toast.type === 'success' ? 'bg-green'
                 : 'bg-brown';

  const visibleCls = toast.visible
    ? 'translate-y-0 scale-100'
    : 'translate-y-20 scale-95';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${visibleCls} ${colorCls} text-white px-6 py-[11px] rounded-full text-[.83rem] font-bold tracking-[.02em] shadow-[0_6px_24px_rgba(0,0,0,.22)] transition-[transform] duration-[280ms] pointer-events-none z-[300] [transition-timing-function:cubic-bezier(.34,1.4,.64,1)]`}
    >
      {toast.msg}
    </div>
  );
}
