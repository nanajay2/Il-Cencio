import { useState, useEffect } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import { Header }             from './components/Header.jsx';
import { HouseSwitcherModal } from './components/HouseSwitcherModal.jsx';
import { ChoreCard }          from './components/ChoreCard.jsx';
import { RevealModal }        from './components/RevealModal.jsx';
import { CatMascot }          from './components/CatMascot.jsx';
import { Toast, useToast }    from './components/Toast.jsx';
import { WelcomeScreen }      from './components/WelcomeScreen.jsx';
import { UpgradeNoticeScreen } from './components/UpgradeNoticeScreen.jsx';
import { LoginScreen }        from './components/LoginScreen.jsx';
import { ChooseHouseScreen }  from './components/ChooseHouseScreen.jsx';
import { JoinHouseScreen }    from './components/JoinHouseScreen.jsx';
import { CreateHouseScreen }  from './components/CreateHouseScreen.jsx';
import { SettingsPanel }      from './components/SettingsPanel.jsx';
import { ViewModeSwitcher }   from './components/ViewModeSwitcher.jsx';
import { WeekAggregateView }  from './components/WeekAggregateView.jsx';
import { MonthAggregateView } from './components/MonthAggregateView.jsx';
import { AbsencesScreen }     from './components/AbsencesScreen.jsx';
import { SwapsScreen }        from './components/SwapsScreen.jsx';
import { MenuFab }            from './components/MenuFab.jsx';
import { RoomsScreen }        from './components/RoomsScreen.jsx';
import { CoinquiliniScreen }  from './components/CoinquiliniScreen.jsx';
import { RotationScreen }     from './components/RotationScreen.jsx';
import { InstallGate }        from './components/InstallGate.jsx';
import { useWeeks }           from './hooks/useWeeks.js';
import { useAbsences }        from './hooks/useAbsences.js';
import { useHouse }           from './hooks/useHouse.js';
import { useSwaps }           from './hooks/useSwaps.js';
import { usePush }            from './hooks/usePush.js';
import { api }                from './api.js';
import { supabase }           from './lib/supabase.js';
import { isCurW, todayStr }   from './constants.js';
import { findTurnoForDate }   from './lib/calendarBuckets.js';
import { isStandalone }       from './lib/platform.js';

// In sviluppo (npm run dev) l'app resta usabile da browser normale per
// comodita'; in produzione (build) e' obbligatorio averla installata.
const BYPASS_INSTALL_GATE = import.meta.env.DEV;

// Unico dato persistito lato client: quale casa era attiva l'ultima
// volta. Tutto il resto (identità, elenco case) viene dalla sessione
// Supabase + da GET /houses/mine, mai da una cache locale non
// verificata — un'identità, N case, nessun re-login per passare da
// una all'altra (US-02.5).
function loadActiveHouseId() {
  return localStorage.getItem('activeHouseId') || null;
}
function saveActiveHouseId(id) {
  if (id) localStorage.setItem('activeHouseId', id);
  else localStorage.removeItem('activeHouseId');
}

// US-05.2 — chi ha usato l'app prima di FEAT-01/02 ha ancora in
// localStorage la vecchia sessione PIN-based (userId numerico, mai
// più scritta da questo codice). La sua presenza, senza sessione
// Supabase attiva, e' il segnale per mostrare l'avviso di rollout
// invece della welcome normale.
const LEGACY_KEYS = ['houseId', 'houseName', 'userId', 'userName', 'isAdmin', 'accounts'];
function hasLegacySession() {
  return !!localStorage.getItem('userId');
}
function clearLegacySession() {
  LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
}

export default function App() {
  // view: 'welcome' | 'auth' | 'choose-house' | 'join-house' | 'create-house' | 'app'
  const [view, setView] = useState('welcome');
  const [authSession, setAuthSession] = useState(undefined); // undefined = non ancora controllata
  const [houses,        setHouses]        = useState([]); // da GET /houses/mine
  const [activeHouseId, setActiveHouseId] = useState(loadActiveHouseId());
  const [addingHouse,   setAddingHouse]   = useState(false); // true quando si aggiunge una casa dallo switcher (non primo accesso)

  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);
  const [showSwaps, setShowSwaps] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showCoinquilini, setShowCoinquilini] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [viewMode, setViewMode] = useState('settimana'); // 'settimana' | 'mese'
  const [weekAnchorDay, setWeekAnchorDay] = useState(todayStr());

  const { toast, show: showToast } = useToast();
  const weeksHook    = useWeeks();
  const absencesHook = useAbsences();
  const houseHook    = useHouse();
  const swapsHook    = useSwaps();
  const pushHook     = usePush();

  const session = houses.find(h => h.houseId === activeHouseId) ?? null;
  const houseId = session?.houseId ?? null;
  const userId  = session?.userId ?? null;

  // Ascolta lo stato di autenticazione Supabase: parte con la sessione
  // corrente (se c'e' gia', da localStorage gestito dall'SDK) e reagisce
  // a login/logout/refresh token per tutta la vita dell'app.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setAuthSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Quando cambia la sessione (login/logout), ricarica l'elenco case di
  // questa identità e decide dove atterrare.
  useEffect(() => {
    if (authSession === undefined) return; // ancora in controllo
    if (!authSession) {
      setHouses([]);
      setView('welcome');
      return;
    }
    api.myHouses()
      .then(list => {
        setHouses(list);
        if (list.length === 0) {
          setView('choose-house');
          return;
        }
        const stillValid = list.some(h => h.houseId === activeHouseId);
        const next = stillValid ? activeHouseId : list[0].houseId;
        if (next !== activeHouseId) { setActiveHouseId(next); saveActiveHouseId(next); }
        setView('app');
      })
      .catch(e => showToast(e.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession]);

  // When houseId is known, load house data
  useEffect(() => {
    if (!houseId) return;
    houseHook.load(houseId).catch(() => {});
    weeksHook.load(houseId).catch(e => showToast(e.message, 'error'));
    absencesHook.load(houseId).catch(e => showToast(e.message, 'error'));
    swapsHook.load(houseId).catch(e => showToast(e.message, 'error'));
  }, [houseId]);

  // Chiede il permesso di notifica appena l'utente entra, ma solo la prima
  // volta in assoluto per lui in questo browser (permesso mai deciso prima
  // e mai richiesto automaticamente prima): dopo puo' sempre riattivarle
  // a mano da Impostazioni, non lo richiediamo piu' in automatico.
  useEffect(() => {
    if (!houseId || !userId) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;
    const key = `push_auto_prompted_${userId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    pushHook.subscribe(houseId).catch(() => {});
  }, [houseId, userId]);

  // Trigger reveal when current week changes and user is chosen
  useEffect(() => {
    if (!weeksHook.currentWeek || !userId) return;
    if (!isCurW(weeksHook.currentWeek)) return;
    const key = `revealed_${weeksHook.currentWeek.id}_${userId}`;
    if (!localStorage.getItem(key)) setShowReveal(true);
  }, [weeksHook.currentWeek?.id, userId]);

  // Ricarica i dati quando l'app torna in primo piano (es. tocco su una
  // notifica push che mette a fuoco una tab gia' aperta invece di
  // ricaricare la pagina): altrimenti richieste di scambio, assenze e
  // turni creati da altri coinquilini restano invisibili finche' non si
  // ricarica manualmente.
  useEffect(() => {
    if (!houseId) return;
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      weeksHook.load(houseId).catch(() => {});
      absencesHook.load(houseId).catch(() => {});
      swapsHook.load(houseId).catch(() => {});
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [houseId]);

  // Deep link da una notifica di scambio turno: apre direttamente la
  // schermata scambi, sia quando l'app viene aperta da zero (?swap= nella
  // URL) sia quando il service worker mette a fuoco una tab gia' aperta
  // (messaggio push-open-swap).
  useEffect(() => {
    if (!houseId) return;
    const swapParam = new URLSearchParams(window.location.search).get('swap');
    if (swapParam) {
      setShowSwaps(true);
      swapsHook.load(houseId).catch(() => {});
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [houseId]);

  useEffect(() => {
    if (!houseId) return;
    function onOpenSwap() {
      setShowSwaps(true);
      swapsHook.load(houseId).catch(() => {});
    }
    function onSwapsUpdated() {
      swapsHook.load(houseId).catch(() => {});
      weeksHook.load(houseId).catch(() => {});
    }
    window.addEventListener('push-open-swap', onOpenSwap);
    window.addEventListener('swaps-updated', onSwapsUpdated);
    return () => {
      window.removeEventListener('push-open-swap', onOpenSwap);
      window.removeEventListener('swaps-updated', onSwapsUpdated);
    };
  }, [houseId]);

  // Rilegge le case dal server e attiva quella indicata (o la prima
  // disponibile). Usata dopo /claim o dopo la creazione di una casa.
  async function refreshHouses(preferHouseId) {
    const list = await api.myHouses();
    setHouses(list);
    const target = preferHouseId && list.some(h => h.houseId === preferHouseId)
      ? preferHouseId
      : (list.find(h => h.houseId === activeHouseId)?.houseId ?? list[0]?.houseId ?? null);
    setActiveHouseId(target);
    saveActiveHouseId(target);
    return list;
  }

  function handleJoinSuccess(membership) {
    refreshHouses(membership.houseId).then(() => {
      setAddingHouse(false);
      setView('app');
    });
  }

  function handleCreateSuccess(created) {
    refreshHouses(created.houseId).then(() => {
      setAddingHouse(false);
      setView('app');
    });
  }

  function switchAccount(house) {
    setActiveHouseId(house.houseId);
    saveActiveHouseId(house.houseId);
    setShowSwitcher(false);
    setView('app');
  }

  function startAddHouse(target) {
    setShowSwitcher(false);
    setAddingHouse(true);
    setView(target); // 'join-house' | 'create-house'
  }

  function cancelAddHouse() {
    setAddingHouse(false);
    setView('app');
  }

  // Esce dall'identità Supabase (unica sessione, condivisa da tutte le
  // case): non esiste più un "logout di una sola casa" separato dalle
  // altre, perché non c'è più nulla da cachare per-casa lato client.
  function logout() {
    saveActiveHouseId(null);
    setShowSettings(false);
    supabase.auth.signOut();
  }

  async function handleLeaveHouse() {
    if (!window.confirm('Sei sicuro di voler abbandonare questa casa? Non potrai più accedere senza un nuovo invito.')) return;
    try {
      await api.leaveHouse(houseId);
      setShowSettings(false);
      const list = await api.myHouses();
      setHouses(list);
      const next = list[0]?.houseId ?? null;
      setActiveHouseId(next);
      saveActiveHouseId(next);
      setView(next ? 'app' : 'choose-house');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function refresh() {
    if (!houseId) return;
    try {
      await Promise.all([
        houseHook.load(houseId),
        weeksHook.load(houseId),
        absencesHook.load(houseId),
      ]);
      showToast('Aggiornato', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleToggle(weekId, uid, roomId) {
    try { await weeksHook.toggleDone(houseId, weekId, uid, roomId); }
    catch (e) { showToast(e.message, 'error'); }
  }

  async function handleAddAbsence(uid, from, to) {
    try {
      await absencesHook.addAbsence(houseId, uid, from, to);
      await weeksHook.load(houseId);
      const name = houseHook.house?.users?.find(u => u.id === uid)?.name ?? 'Utente';
      showToast(`Assenza di ${name} aggiunta`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleUpdateAbsence(id, uid, from, to) {
    try {
      await absencesHook.updateAbsence(houseId, id, uid, from, to);
      await weeksHook.load(houseId);
      showToast('Assenza aggiornata', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleRemoveAbsence(id) {
    try {
      await absencesHook.removeAbsence(houseId, id);
      await weeksHook.load(houseId);
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleProposeSwap(weekId, fromUserId, fromRoomId, toUserId, toRoomId) {
    try {
      await swapsHook.proposeSwap(houseId, weekId, fromUserId, fromRoomId, toUserId, toRoomId);
      showToast('Richiesta di scambio inviata', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleAcceptSwap(swapId) {
    try {
      await swapsHook.acceptSwap(houseId, swapId);
      await weeksHook.load(houseId);
      showToast('Scambio accettato', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleDeclineSwap(swapId) {
    try { await swapsHook.declineSwap(houseId, swapId); }
    catch (e) { showToast(e.message, 'error'); }
  }

  function jumpToDay(dateStr) {
    const turno = findTurnoForDate(weeksHook.weeks, dateStr);
    if (!turno) { showToast('Nessun turno disponibile per questo giorno'); return; }
    weeksHook.goToId(turno.id);
    setWeekAnchorDay(dateStr);
    setViewMode('settimana');
  }

  // ---- Routing ----
  if (!BYPASS_INSTALL_GATE && !isStandalone()) return <InstallGate />;

  if (authSession === undefined) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brown" />
    </div>
  );

  if (view === 'welcome')      return hasLegacySession()
    ? <UpgradeNoticeScreen onContinue={() => { clearLegacySession(); setView('auth'); }} />
    : <WelcomeScreen onStart={() => setView('auth')} />;
  if (view === 'auth')         return <LoginScreen onBack={() => setView('welcome')} />;
  if (view === 'choose-house') return (
    <ChooseHouseScreen
      onJoin={() => setView('join-house')}
      onCreate={() => setView('create-house')}
      onBack={addingHouse ? cancelAddHouse : undefined}
      onLogout={addingHouse ? undefined : () => supabase.auth.signOut()}
    />
  );
  if (view === 'join-house')   return (
    <JoinHouseScreen
      onSuccess={handleJoinSuccess}
      onBack={addingHouse ? cancelAddHouse : () => setView('choose-house')}
    />
  );
  if (view === 'create-house') return (
    <CreateHouseScreen
      onSuccess={handleCreateSuccess}
      onBack={addingHouse ? cancelAddHouse : () => setView('choose-house')}
    />
  );

  // ---- Main app ----
  if (!session) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brown" />
    </div>
  );

  const { currentWeek, weeks, loading } = weeksHook;
  const house = houseHook.house;

  const assignments = currentWeek?.assignments ?? [];
  const myAssignments     = assignments.filter(a => a.userId === userId);
  const othersAssignments = assignments.filter(a => a.userId !== userId);
  const unassignedRooms = currentWeek
    ? (house?.rooms ?? []).filter(r => !assignments.some(a => a.roomId === r.id))
    : [];

  return (
    <>
      <Header
        houseName={session.houseName}
        currentUser={session.userName}
        onOpenSwitcher={() => setShowSwitcher(true)}
      />

      {showSwitcher && (
        <HouseSwitcherModal
          houses={houses}
          activeHouseId={activeHouseId}
          onSelect={switchAccount}
          onAddExisting={() => startAddHouse('join-house')}
          onAddNew={() => startAddHouse('create-house')}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />

      {viewMode === 'mese' ? (
        <MonthAggregateView
          weeks={weeks}
          users={house?.users ?? []}
          userId={userId}
          houseId={houseId}
          ensureThrough={weeksHook.ensureThrough}
          navLoading={weeksHook.navLoading}
          onJumpToDay={jumpToDay}
        />
      ) : currentWeek ? (
        <>
          <WeekAggregateView
            weeks={weeks}
            users={house?.users ?? []}
            userId={userId}
            houseId={houseId}
            ensureThrough={weeksHook.ensureThrough}
            navLoading={weeksHook.navLoading}
            onJumpToDay={jumpToDay}
            onToday={() => { weeksHook.goToCurrent(); setWeekAnchorDay(todayStr()); }}
            anchorDay={weekAnchorDay}
          />

          <div className="px-4 pt-3 flex flex-col gap-3">
            {/* Hero: il mio turno (può essere più di una stanza) */}
            {myAssignments.map((a, i) => (
              <ChoreCard
                key={a.roomId}
                assignment={a}
                absent={absencesHook.isAbsent(a.userId, currentWeek.start, currentWeek.end)}
                isMe
                week={currentWeek}
                onToggle={handleToggle}
                roomIndex={i + 1}
                roomTotal={myAssignments.length}
              />
            ))}

            {/* Sezione compatta: gli altri */}
            {othersAssignments.length > 0 && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[.62rem] font-bold uppercase tracking-[.08em] text-ink-2">Coinquilini</span>
                </div>
                <div className="divide-y divide-border">
                  {othersAssignments.map(asgn => (
                    <ChoreCard
                      key={`${asgn.userId}-${asgn.roomId}`}
                      assignment={asgn}
                      absent={absencesHook.isAbsent(asgn.userId, currentWeek.start, currentWeek.end)}
                      compact
                      week={currentWeek}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stanze scoperte: tutti gli idonei sono assenti per l'intero turno */}
            {unassignedRooms.length > 0 && (
              <div className="bg-card rounded-2xl border border-dashed border-sage overflow-hidden">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[.62rem] font-bold uppercase tracking-[.08em] text-ink-2">Stanze scoperte</span>
                </div>
                <div className="divide-y divide-border">
                  {unassignedRooms.map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-[11px] text-ink-2">
                      <span className="text-[1.05rem]">{r.icon}</span>
                      <span className="flex-1 text-[.85rem]">
                        <strong className="text-ink">{r.name}</strong> — nessuno assegnato: tutti assenti questo turno
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : loading ? (
        <div className="mx-4 mt-6 bg-card rounded-2xl border border-border p-10 text-center text-ink-2">
          <div className="flex justify-center mb-3"><Loader2 size={40} className="animate-spin" /></div>
          <p className="text-[.88rem]">Caricamento…</p>
        </div>
      ) : (
        <div className="mx-4 mt-6 bg-card rounded-2xl border border-border p-10 text-center text-ink-2">
          <div className="flex justify-center mb-3"><ClipboardList size={40} /></div>
          <p className="text-[.88rem]">Nessuna settimana disponibile.</p>
        </div>
      )}

      <div style={{ height: 'calc(env(safe-area-inset-bottom) + 6rem)' }} />

      {showReveal && (
        <RevealModal
          week={currentWeek}
          userId={userId}
          onDismiss={() => setShowReveal(false)}
        />
      )}

      {showSettings && house && (
        <SettingsPanel
          house={house}
          isAdmin={session.isAdmin}
          houseId={houseId}
          userId={userId}
          onClose={() => setShowSettings(false)}
          onLogout={logout}
          onLeaveHouse={handleLeaveHouse}
          onAddRule={async (type, config) => {
            await houseHook.addRule(houseId, type, config);
            await weeksHook.load(houseId);
          }}
          onEditRule={async (ruleId, type, config) => {
            await houseHook.editRule(houseId, ruleId, type, config);
            await weeksHook.load(houseId);
          }}
          onRemoveRule={async (ruleId) => {
            await houseHook.removeRule(houseId, ruleId);
            await weeksHook.load(houseId);
          }}
        />
      )}

      <MenuFab
        isAdmin={session.isAdmin}
        pendingSwaps={swapsHook.swaps.filter(s => s.toUserId === userId && s.status === 'pending').length}
        onOpenAbsences={() => setShowAbsences(true)}
        onOpenSwaps={() => {
          setShowSwaps(true);
          swapsHook.load(houseId).catch(() => {});
        }}
        onOpenRooms={() => setShowRooms(true)}
        onOpenCoinquilini={() => setShowCoinquilini(true)}
        onOpenRotation={() => setShowRotation(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showAbsences && house && (
        <AbsencesScreen
          house={house}
          currentUserId={userId}
          absences={absencesHook.absences}
          onAdd={handleAddAbsence}
          onUpdate={handleUpdateAbsence}
          onRemove={handleRemoveAbsence}
          onClose={() => setShowAbsences(false)}
        />
      )}

      {showSwaps && house && (
        <SwapsScreen
          house={house}
          userId={userId}
          weeks={weeks}
          currentWeek={currentWeek}
          swaps={swapsHook.swaps}
          onPropose={handleProposeSwap}
          onAccept={handleAcceptSwap}
          onDecline={handleDeclineSwap}
          onClose={() => setShowSwaps(false)}
        />
      )}

      {showRooms && house && (
        <RoomsScreen
          house={house}
          onAddRoom={async (data) => {
            await houseHook.addRoom(houseId, data);
            await weeksHook.load(houseId);
            showToast('Stanza aggiunta', 'success');
          }}
          onEditRoom={async (roomId, data) => {
            await houseHook.editRoom(houseId, roomId, data);
            await weeksHook.load(houseId);
            showToast('Stanza aggiornata', 'success');
          }}
          onRemoveRoom={async (roomId) => {
            await houseHook.removeRoom(houseId, roomId);
            await weeksHook.load(houseId);
          }}
          onClose={() => setShowRooms(false)}
        />
      )}

      {showCoinquilini && house && session.isAdmin && (
        <CoinquiliniScreen
          house={house}
          onAddUser={async (name) => {
            await houseHook.addUser(houseId, name, '');
            await weeksHook.load(houseId);
            showToast(`${name} aggiunto`, 'success');
          }}
          onRemoveUser={async (uid) => {
            await houseHook.removeUser(houseId, uid);
            await weeksHook.load(houseId);
          }}
          onClose={() => setShowCoinquilini(false)}
        />
      )}

      {showRotation && house && session.isAdmin && (
        <RotationScreen
          house={house}
          onUpdateRotation={async (rotationType, rotationDays) => {
            await houseHook.updateRotation(houseId, rotationType, rotationDays);
            await weeksHook.load(houseId);
          }}
          onClose={() => setShowRotation(false)}
        />
      )}

      {/* <CatMascot weeks={weeks} userId={userId} /> */}
      <Toast toast={toast} />
    </>
  );
}
