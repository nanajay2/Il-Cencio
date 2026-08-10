import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { X, Users, Link2, Check, QrCode } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';
import { api } from '../api.js';

const btnCls =
  'h-[42px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.85rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.9rem] font-sans ' +
  'bg-cream text-ink outline-none h-[42px] transition-colors focus:border-brown w-full';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';
const labelCls   = 'block text-[.7rem] font-bold text-ink-2 mb-1.5 uppercase tracking-[.05em]';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red hover:bg-red-pale';

const linkBtnCls =
  'border-0 bg-transparent cursor-pointer text-brown text-[.72rem] font-bold px-[6px] py-[3px] rounded-md transition-all hover:bg-cream-2 flex items-center gap-1';

// Link + QR condivisibili (FEAT-06): sostituiscono il vecchio codice
// esadecimale. `buildInvite` genera un token via API e il QR client-side
// (nessun servizio esterno coinvolto).
function useInviteLink(houseId, userId) {
  const [link, setLink] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const { token } = await api.createInvite(houseId, userId);
      const url = `${window.location.origin}/join/${token}`;
      setLink(url);
      setQr(await QRCode.toDataURL(url, { margin: 1, width: 220 }));
    } finally {
      setLoading(false);
    }
  }, [houseId, userId]);

  return { link, qr, loading, generate };
}

function InviteBlock({ houseId, userId }) {
  const { link, qr, loading, generate } = useInviteLink(houseId, userId);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!link) return (
    <button onClick={generate} disabled={loading} className={btnCls + ' flex items-center gap-1.5 disabled:opacity-50'}>
      <Link2 size={15} /> {loading ? 'Genero…' : 'Genera link invito'}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2 mt-1">
      {qr && <img src={qr} alt="QR invito" width={160} height={160} className="rounded-[10px] border border-border" />}
      <div className="flex items-center gap-2 w-full">
        <code className="flex-1 text-[.72rem] font-mono bg-cream-2 border border-border rounded-[10px] py-2 px-2 text-brown truncate">
          {link}
        </code>
        <button onClick={copyLink} className={btnCls + ' flex items-center gap-1.5'}>
          {copied ? <><Check size={16} /> Copiato</> : 'Copia'}
        </button>
      </div>
      <p className="text-[.7rem] text-ink-2">Valido 30 giorni{userId ? ', un solo uso' : ', riutilizzabile finché non scade'}.</p>
    </div>
  );
}

export function CoinquiliniScreen({ house, onAddUser, onRemoveUser, onClose }) {
  useBodyScrollLock();
  const [uName, setUName] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [personalInviteFor, setPersonalInviteFor] = useState(null); // userId in fase di invito personale

  async function addUser() {
    if (!uName.trim()) return;
    setAddingUser(true);
    try {
      await onAddUser(uName.trim());
      setUName('');
    } finally {
      setAddingUser(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate flex items-center gap-2">
            <Users size={22} className="flex-shrink-0" /> Coinquilini
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        <section className={sectionCls}>
          <div className={titleCls + ' flex items-center gap-1.5'}><QrCode size={16} /> Fai entrare qualcuno da solo</div>
          <p className="text-[.77rem] text-ink-2 -mt-1">
            Condividi il link o fai scansionare il QR: potrà accedere con la propria email e scegliere il proprio nome.
          </p>
          <InviteBlock houseId={house.id} />
        </section>

        <section className={sectionCls}>
          <div className={titleCls}>Oppure crea uno slot col suo nome</div>
          <p className="text-[.77rem] text-ink-2 -mt-1">
            Utile se vuoi che il turno sia già intestato a lei/lui: genera poi un invito personale (qui sotto, nella lista) per collegarlo direttamente a questo nome.
          </p>
          <div className="flex gap-2">
            <input
              value={uName} onChange={e => setUName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="Nome coinquilino" className={inputCls}
            />
            <button onClick={addUser} disabled={addingUser || !uName.trim()} className={btnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
              {addingUser ? '…' : 'Aggiungi'}
            </button>
          </div>
        </section>

        <section className={sectionCls}>
          <div className={titleCls}>In questa casa</div>
          <div className="flex flex-col gap-1.5">
            {house.users.map(u => (
              <div key={u.id} className="flex flex-col gap-1.5 px-3 py-[10px] bg-cream rounded-[10px] border border-border text-[.87rem]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <strong>{u.name}</strong>
                    {u.isAdmin && <span className="text-[.62rem] font-bold bg-brown text-ink px-[7px] py-[2px] rounded-full">admin</span>}
                    {!u.claimed && <span className="text-[.62rem] font-bold bg-cream-2 text-ink-2 px-[7px] py-[2px] rounded-full">non attivato</span>}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {!u.claimed && (
                      <button
                        onClick={() => setPersonalInviteFor(id => id === u.id ? null : u.id)}
                        className={linkBtnCls}
                      >
                        <Link2 size={13} /> Invito personale
                      </button>
                    )}
                    {!u.isAdmin && (
                      <button onClick={() => onRemoveUser(u.id)} className={dangerCls}><X size={14} strokeWidth={1.8} /></button>
                    )}
                  </span>
                </div>
                {personalInviteFor === u.id && (
                  <div className="pt-1 border-t border-border mt-1">
                    <InviteBlock houseId={house.id} userId={u.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
