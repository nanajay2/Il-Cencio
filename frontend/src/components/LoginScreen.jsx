import { useState } from 'react';
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-card text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

// Supabase restituisce messaggi in inglese: traduciamo solo i casi più
// comuni, per il resto mostriamo il messaggio originale.
const ERROR_MESSAGES = {
  'Invalid login credentials': 'Email o password non corretti',
  'User already registered': 'Esiste già un account con questa email',
  'Password should be at least 6 characters': 'La password deve avere almeno 6 caratteri',
  'Email not confirmed': 'Devi confermare la tua email prima di accedere (controlla la posta)',
};
function translateError(message) {
  return ERROR_MESSAGES[message] ?? message;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}

// Autenticazione tramite Supabase Auth (email+password o Google). Non
// sa nulla di case/coinquilini: una volta stabilita la sessione, è
// App.jsx (via supabase.auth.onAuthStateChange) a decidere il passo
// successivo — creare/entrare in una casa, o andare dritti all'app se
// l'identità è già collegata a una o più case.
export function LoginScreen({ onBack }) {
  const [mode,     setMode]     = useState('signin'); // 'signin' | 'signup'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) return;
    setLoading(true); setError(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          // Senza questo, il link nell'email di conferma usa la Site URL
          // configurata nel progetto Supabase (spesso non allineata
          // all'origine reale) e "non porta da nessuna parte". Va comunque
          // aggiunta anche l'origine corrente alla allow-list "Redirect
          // URLs" nel dashboard Supabase (Authentication → URL
          // Configuration), altrimenti il redirect viene comunque rifiutato.
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Se la conferma email è richiesta dal progetto Supabase, non c'è
        // ancora una sessione: lo diciamo, ma non serve un bottone "ho
        // confermato" — cliccando il link nell'email si torna qui con la
        // sessione già stabilita (supabase.auth.onAuthStateChange in
        // App.jsx la rileva da solo e porta avanti l'utente).
        if (!data.session) { setSignupDone(true); return; }
      }
    } catch (e) {
      setError(translateError(e.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }

  // Nessun bottone "ho confermato": aprire il link nell'email stabilisce
  // la sessione da solo (redirect con token, rilevato automaticamente da
  // supabase-js) e l'app prosegue da App.jsx senza altra azione qui.
  if (signupDone) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2 max-w-[340px]">
        <div className="flex justify-center text-brown mb-2"><Mail size={40} /></div>
        <div className="font-serif text-[1.6rem] text-brown">Controlla la tua email</div>
        <p className="text-[.85rem] text-ink-2 mt-2">
          Ti abbiamo mandato un link di conferma a <strong>{email}</strong>. Aprilo: tornerai automaticamente qui già connessa/o, senza fare altro.
        </p>
      </div>
      <button
        onClick={() => { setSignupDone(false); setMode('signin'); }}
        className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Ho sbagliato email, torna indietro
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">{mode === 'signin' ? 'Bentornati' : 'Crea il tuo account'}</div>
        <p className="text-[.85rem] text-ink-2 mt-1">
          {mode === 'signin' ? 'Accedi con email e password' : 'Ti servirà per entrare o creare una casa'}
        </p>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email" autoFocus value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@esempio.it"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Almeno 6 caratteri"
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !email.trim() || password.length < 6}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Un attimo…' : <>{mode === 'signin' ? 'Accedi' : 'Registrati'} <ArrowRight size={18} /></>}
      </button>

      <div className="w-full max-w-[320px] flex items-center gap-3 text-ink-2 text-[.75rem]">
        <div className="flex-1 h-px bg-border" /> oppure <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full max-w-[320px] bg-card border-[1.5px] border-border text-ink font-bold text-[.9rem] rounded-2xl py-3.5 cursor-pointer hover:border-brown transition-colors flex items-center justify-center gap-2"
      >
        <GoogleIcon /> Continua con Google
      </button>

      <button
        onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }}
        className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1"
      >
        {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna indietro
      </button>
    </div>
  );
}
