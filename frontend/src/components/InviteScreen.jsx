import { useState } from 'react';
import { api } from '../api.js';

export function InviteScreen({ onSuccess, onBack }) {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleJoin() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      const session = await api.join(c);
      onSuccess(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Entra nella casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci il codice invito ricevuto dall'admin</p>
      </div>

      <input
        type="text"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleJoin()}
        placeholder="ES. AB12CD"
        maxLength={10}
        className="w-full max-w-[320px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[1.4rem] font-bold font-mono tracking-[.15em] bg-white text-brown outline-none focus:border-brown transition-colors"
      />

      {error && (
        <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={loading || !code.trim()}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Accesso…' : 'Entra →'}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Torna indietro
      </button>
    </div>
  );
}
