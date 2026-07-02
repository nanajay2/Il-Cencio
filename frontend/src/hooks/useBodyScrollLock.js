import { useEffect } from 'react';

// Blocca lo scroll del body finche' il componente che lo usa (un overlay
// fixed inset-0) e' montato, cosi' non si scrolla il contenuto sottostante.
export function useBodyScrollLock() {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);
}
