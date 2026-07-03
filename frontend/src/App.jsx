import { useState, useEffect } from 'react';
import { Header }             from './components/Header.jsx';
import { WeekNavigator }      from './components/WeekNavigator.jsx';
import { ChoreCard }          from './components/ChoreCard.jsx';
import { RevealModal }        from './components/RevealModal.jsx';
import { CatMascot }          from './components/CatMascot.jsx';
import { Toast, useToast }    from './components/Toast.jsx';
import { WelcomeScreen }      from './components/WelcomeScreen.jsx';
import { LoginScreen }        from './components/LoginScreen.jsx';
import { CreateHouseScreen }  from './components/CreateHouseScreen.jsx';
import { SettingsPanel }      from './components/SettingsPanel.jsx';
import { ViewModeSwitcher }   from './components/ViewModeSwitcher.jsx';
import { WeekAggregateView }  from './components/WeekAggregateView.jsx';
import { MonthAggregateView } from './components/MonthAggregateView.jsx';
import { AbsencesFab }        from './components/AbsencesFab.jsx';
import { AbsencesScreen }     from './components/AbsencesScreen.jsx';
import { SwapsFab }           from './components/SwapsFab.jsx';
import { SwapsScreen }        from './components/SwapsScreen.jsx';
import { InstallGate }        from './components/InstallGate.jsx';
import { useWeeks }           from './hooks/useWeeks.js';
import { useAbsences }        from './hooks/useAbsences.js';
import { useHouse }           from './hooks/useHouse.js';
import { useSwaps }           from './hooks/useSwaps.js';
import { usePush }            from './hooks/usePush.js';
import { api }                from './api.js';
import { fmt, isCurW }        from './constants.js';
import { findTurnoForDate }   from './lib/calendarBuckets.js';
import { isStandalone }       from './lib/platform.js';

// In sviluppo (npm run dev) l'app resta usabile da browser normale per
// comodita'; in produzione (build) e' obbligatorio averla installata.
const BYPASS_INSTALL_GATE = import.meta.env.DEV;

function loadSession() {
  return {
    houseId:   localStorage.getItem('houseId'),
    houseName: localStorage.getItem('houseName'),
    userId:    localStorage.getItem('userId')   ? Number(localStorage.getItem('userId'))   : null,
    userName:  localStorage.getItem('userName'),
    isAdmin:   localStorage.getItem('isAdmin')  === 'true',
  };
}
function saveSession(s) {
  localStorage.setItem('houseId',   s.houseId   ?? '');
  localStorage.setItem('houseName', s.houseName  ?? '');
  localStorage.setItem('userId',    s.userId     ?? '');
  localStorage.setItem('userName',  s.userName   ?? '');
  localStorage.setItem('isAdmin',   s.isAdmin    ? 'true' : 'false');
}
function clearSession() {
  // Tiene houseId/houseName: al prossimo accesso salta il codice casa
  ['userId','userName','isAdmin'].forEach(k => localStorage.removeItem(k));
}

export default function App() {
  const initial = loadSession();

  // view: 'welcome' | 'login' | 'create-house' | 'app'
  const [view,     setView]     = useState(
    initial.houseId && initial.userId ? 'app' :
    initial.houseId                   ? 'login' :
                                        'welcome'
  );
  const [session,  setSession]  = useState(initial);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);
  const [showSwaps, setShowSwaps] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [viewMode, setViewMode] = useState('oggi'); // 'oggi' | 'settimana' | 'mese'

  const { toast, show: showToast } = useToast();
  const weeksHook    = useWeeks();
  const absencesHook = useAbsences();
  const houseHook    = useHouse();
  const swapsHook    = useSwaps();
  const pushHook     = usePush();

  const houseId = session.houseId;
  const userId  = session.userId;

  // When houseId is known, load house data
  useEffect(() => {
    if (!houseId) return;
    houseHook.load(houseId).catch(() => {});
    weeksHook.load(houseId).catch(e => showToast('❌ ' + e.message, 'error'));
    absencesHook.load(houseId).catch(e => showToast('❌ ' + e.message, 'error'));
    swapsHook.load(houseId).catch(e => showToast('❌ ' + e.message, 'error'));
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
    pushHook.subscribe(houseId, userId).catch(() => {});
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

  function applySession(s) {
    setSession(s);
    saveSession(s);
  }

  function handleJoinSuccess(apiSession) {
    // apiSession: { userId, userName, isAdmin, houseId, houseName }
    const s = {
      houseId:   apiSession.houseId,
      houseName: apiSession.houseName,
      userId:    apiSession.userId,
      userName:  apiSession.userName,
      isAdmin:   apiSession.isAdmin,
    };
    applySession(s);
    setView('app');
  }

  function handleCreateSuccess(apiSession) {
    // apiSession: { houseId, houseName, userId, userName, isAdmin, inviteCode }
    const s = {
      houseId:   apiSession.houseId,
      houseName: apiSession.houseName,
      userId:    apiSession.userId,
      userName:  apiSession.userName,
      isAdmin:   apiSession.isAdmin,
    };
    applySession(s);
    setView('app');
  }

  function handleSelectUser(user) {
    const s = { ...session, userId: user.id, userName: user.name, isAdmin: user.isAdmin };
    applySession(s);
    setView('app');
  }

  function logout() {
    clearSession();
    setSession({ houseId: null, houseName: null, userId: null, userName: null, isAdmin: false });
    setView('welcome');
  }

  async function handleLeaveHouse() {
    if (!window.confirm('Sei sicuro di voler abbandonare questa casa? Non potrai più accedere senza un nuovo invito.')) return;
    try {
      await api.leaveHouse(houseId, userId);
      setShowSettings(false);
      logout();
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function refresh() {
    if (!houseId) return;
    try {
      await Promise.all([
        houseHook.load(houseId),
        weeksHook.load(houseId),
        absencesHook.load(houseId),
      ]);
      showToast('Aggiornato ↻');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleToggle(weekId, uid, roomId) {
    try { await weeksHook.toggleDone(houseId, weekId, uid, roomId); }
    catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleGenerate() {
    const { weeks } = weeksHook;
    const last = weeks[weeks.length - 1];
    if (!last) return;
    if (!window.confirm(`Generare la settimana dopo il ${fmt(last.end)}?`)) return;
    try {
      await weeksHook.generateWeek(houseId);
      showToast('✅ Settimana aggiunta!', 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleAddAbsence(uid, from, to) {
    try {
      await absencesHook.addAbsence(houseId, uid, from, to);
      const name = houseHook.house?.users?.find(u => u.id === uid)?.name ?? 'Utente';
      showToast(`✅ Assenza di ${name} aggiunta`, 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleRemoveAbsence(id) {
    try { await absencesHook.removeAbsence(houseId, id); }
    catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleProposeSwap(weekId, fromUserId, fromRoomId, toUserId, toRoomId) {
    try {
      await swapsHook.proposeSwap(houseId, weekId, fromUserId, fromRoomId, toUserId, toRoomId);
      showToast('✅ Richiesta di scambio inviata', 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleAcceptSwap(swapId) {
    try {
      await swapsHook.acceptSwap(houseId, swapId);
      await weeksHook.load(houseId);
      showToast('✅ Scambio accettato', 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleDeclineSwap(swapId) {
    try { await swapsHook.declineSwap(houseId, swapId); }
    catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  function jumpToDay(dateStr) {
    const turno = findTurnoForDate(weeksHook.weeks, dateStr);
    if (!turno) { showToast('Nessun turno disponibile per questo giorno'); return; }
    weeksHook.goToId(turno.id);
    setViewMode('oggi');
  }

  // ---- Routing ----
  if (!BYPASS_INSTALL_GATE && !isStandalone()) return <InstallGate />;
  if (view === 'welcome')      return <WelcomeScreen onLogin={() => setView('login')} onCreate={() => setView('create-house')} />;
  if (view === 'login')        return <LoginScreen onSuccess={handleJoinSuccess} onBack={() => setView('welcome')} savedHouseId={initial.houseId || null} />;
  if (view === 'create-house') return <CreateHouseScreen onSuccess={handleCreateSuccess} onBack={() => setView('welcome')} />;

  // ---- Main app ----
  const { currentWeek, weeks, currentIdx, loading } = weeksHook;
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
        onSettings={() => setShowSettings(true)}
      />

      <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />

      {viewMode === 'settimana' ? (
        <WeekAggregateView weeks={weeks} users={house?.users ?? []} onJumpToDay={jumpToDay} />
      ) : viewMode === 'mese' ? (
        <MonthAggregateView weeks={weeks} users={house?.users ?? []} userId={userId} onJumpToDay={jumpToDay} />
      ) : currentWeek ? (
        <>
          <WeekNavigator
            week={currentWeek}
            currentIdx={currentIdx}
            totalWeeks={weeks.length}
            onPrev={() => weeksHook.goTo(-1)}
            onNext={() => weeksHook.goTo(1)}
            onThisWeek={weeksHook.goToCurrent}
            onGenerate={handleGenerate}
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
          <div className="text-[2.6rem] mb-3">⏳</div>
          <p className="text-[.88rem]">Caricamento…</p>
        </div>
      ) : (
        <div className="mx-4 mt-6 bg-card rounded-2xl border border-border p-10 text-center text-ink-2">
          <div className="text-[2.6rem] mb-3">📋</div>
          <p className="text-[.88rem]">Nessuna settimana disponibile.</p>
        </div>
      )}

      <div className="h-12" />

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
          onRemoveUser={async (uid) => {
            await houseHook.removeUser(houseId, uid);
            await weeksHook.load(houseId);
          }}
          onAddRoom={async (data) => {
            await houseHook.addRoom(houseId, data);
            await weeksHook.load(houseId);
            showToast(`✅ Stanza aggiunta`);
          }}
          onRemoveRoom={async (roomId) => {
            await houseHook.removeRoom(houseId, roomId);
            await weeksHook.load(houseId);
          }}
          onAddRule={async (type, config) => {
            await houseHook.addRule(houseId, type, config);
            await weeksHook.load(houseId);
          }}
          onRemoveRule={async (ruleId) => {
            await houseHook.removeRule(houseId, ruleId);
            await weeksHook.load(houseId);
          }}
          onUpdateRotation={async (rotationType, rotationDays) => {
            await houseHook.updateRotation(houseId, rotationType, rotationDays);
            await weeksHook.load(houseId);
            showToast('✅ Rotazione aggiornata');
          }}
        />
      )}

      <AbsencesFab onClick={() => setShowAbsences(true)} />

      {showAbsences && house && (
        <AbsencesScreen
          house={house}
          currentUserId={userId}
          absences={absencesHook.absences}
          onAdd={handleAddAbsence}
          onRemove={handleRemoveAbsence}
          onClose={() => setShowAbsences(false)}
        />
      )}

      <SwapsFab
        onClick={() => {
          setShowSwaps(true);
          swapsHook.load(houseId).catch(() => {});
        }}
        pendingCount={swapsHook.swaps.filter(s => s.toUserId === userId && s.status === 'pending').length}
      />

      {showSwaps && house && (
        <SwapsScreen
          house={house}
          userId={userId}
          currentWeek={currentWeek}
          swaps={swapsHook.swaps}
          onPropose={handleProposeSwap}
          onAccept={handleAcceptSwap}
          onDecline={handleDeclineSwap}
          onClose={() => setShowSwaps(false)}
        />
      )}

      {/* <CatMascot weeks={weeks} userId={userId} /> */}
      <Toast toast={toast} />
    </>
  );
}
