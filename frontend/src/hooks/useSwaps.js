import { useCallback, useState } from 'react';
import { api } from '../api.js';

export function useSwaps() {
  const [swaps,   setSwaps]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async (houseId) => {
    setLoading(true);
    setError(null);
    try {
      setSwaps(await api.getSwaps(houseId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function proposeSwap(houseId, weekId, fromUserId, fromRoomId, toUserId, toRoomId) {
    const swap = await api.createSwap(houseId, weekId, fromUserId, fromRoomId, toUserId, toRoomId);
    setSwaps(s => [swap, ...s]);
    return swap;
  }

  async function acceptSwap(houseId, swapId) {
    await api.acceptSwap(houseId, swapId);
    setSwaps(s => s.map(x => x.id === swapId ? { ...x, status: 'accepted' } : x));
  }

  async function declineSwap(houseId, swapId) {
    await api.declineSwap(houseId, swapId);
    setSwaps(s => s.map(x => x.id === swapId ? { ...x, status: 'declined' } : x));
  }

  return { swaps, loading, error, load, proposeSwap, acceptSwap, declineSwap };
}
