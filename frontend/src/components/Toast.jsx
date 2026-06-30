import { useState, useCallback, useRef } from 'react';

let _setToast;

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
  return (
    <div
      id="toast"
      className={[toast.visible ? 'show' : '', toast.type].filter(Boolean).join(' ')}
    >
      {toast.msg}
    </div>
  );
}
