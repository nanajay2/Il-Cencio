import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// stati possibili: 'unsupported' | 'denied' | 'inactive' | 'active'
function computeStatus(permission) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY)
    return 'unsupported';
  if (permission === 'denied') return 'denied';
  return null; // serve controllare la subscription per distinguere active/inactive
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePush() {
  const [status, setStatus] = useState('inactive');
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    const base = computeStatus(Notification?.permission);
    if (base) { setStatus(base); return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub ? 'active' : 'inactive');
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  async function subscribe(houseId, userId) {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await api.pushSubscribe(houseId, userId, sub.toJSON());
      setStatus('active');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe(houseId) {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.pushUnsubscribe(houseId, sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, subscribe, unsubscribe };
}
