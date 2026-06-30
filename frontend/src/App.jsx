import { useState, useEffect } from 'react';
import { Header }             from './components/Header.jsx';
import { WeekNavigator }      from './components/WeekNavigator.jsx';
import { ChoreCard }          from './components/ChoreCard.jsx';
import { AbsencesPanel }      from './components/AbsencesPanel.jsx';
import { RevealModal }        from './components/RevealModal.jsx';
import { CatMascot }          from './components/CatMascot.jsx';
import { Toast, useToast }    from './components/Toast.jsx';
import { WelcomeScreen }      from './components/WelcomeScreen.jsx';
import { LoginScreen }        from './components/LoginScreen.jsx';
import { CreateHouseScreen }  from './components/CreateHouseScreen.jsx';
import { AdminPanel }         from './components/AdminPanel.jsx';
import { useWeeks }           from './hooks/useWeeks.js';
import { useAbsences }        from './hooks/useAbsences.js';
import { useHouse }           from './hooks/useHouse.js';
import { fmt, isCurW }        from './constants.js';

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
  const [showAdmin, setShowAdmin] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const { toast, show: showToast } = useToast();
  const weeksHook    = useWeeks();
  const absencesHook = useAbsences();
  const houseHook    = useHouse();

  const houseId = session.houseId;
  const userId  = session.userId;

  // When houseId is known, load house data
  useEffect(() => {
    if (!houseId) return;
    houseHook.load(houseId).catch(() => {});
    weeksHook.load(houseId).catch(e => showToast('❌ ' + e.message, 'error'));
    absencesHook.load(houseId).catch(e => showToast('❌ ' + e.message, 'error'));
  }, [houseId]);

  // Trigger reveal when current week changes and user is chosen
  useEffect(() => {
    if (!weeksHook.currentWeek || !userId) return;
    if (!isCurW(weeksHook.currentWeek)) return;
    const key = `revealed_${weeksHook.currentWeek.id}_${userId}`;
    if (!localStorage.getItem(key)) setShowReveal(true);
  }, [weeksHook.currentWeek?.id, userId]);

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

  async function handleToggle(weekId, uid) {
    try { await weeksHook.toggleDone(houseId, weekId, uid); }
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

  // ---- Routing ----
  if (view === 'welcome')      return <WelcomeScreen onLogin={() => setView('login')} onCreate={() => setView('create-house')} />;
  if (view === 'login')        return <LoginScreen onSuccess={handleJoinSuccess} onBack={() => setView('welcome')} savedHouseId={initial.houseId || null} />;
  if (view === 'create-house') return <CreateHouseScreen onSuccess={handleCreateSuccess} onBack={() => setView('welcome')} />;

  // ---- Main app ----
  const { currentWeek, weeks, currentIdx, loading } = weeksHook;
  const house = houseHook.house;

  const choreCards = currentWeek
    ? [...(currentWeek.assignments ?? [])]
        .sort((a, b) => {
          if (a.userId === userId) return -1;
          if (b.userId === userId) return 1;
          return 0;
        })
        .map(asgn => (
          <ChoreCard
            key={asgn.userId}
            assignment={asgn}
            done={asgn.done}
            absent={absencesHook.isAbsent(asgn.userId, currentWeek.start, currentWeek.end)}
            isMe={asgn.userId === userId}
            dimmed={!!userId && asgn.userId !== userId}
            week={currentWeek}
            onToggle={handleToggle}
          />
        ))
    : [];

  return (
    <>
      <Header
        houseName={session.houseName}
        currentUser={session.userName}
        isAdmin={session.isAdmin}
        onLogout={logout}
        onAdmin={() => setShowAdmin(true)}
        onRefresh={refresh}
      />

      {currentWeek ? (
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
          <div className="px-4 pt-4 flex flex-col gap-2.5">
            {choreCards}
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

      <AbsencesPanel
        users={house?.users ?? []}
        absences={absencesHook.absences}
        onAdd={handleAddAbsence}
        onRemove={handleRemoveAbsence}
      />

      <div className="h-12" />

      {showReveal && (
        <RevealModal
          week={currentWeek}
          userId={userId}
          onDismiss={() => setShowReveal(false)}
        />
      )}

      {showAdmin && house && (
        <AdminPanel
          house={house}
          onClose={() => setShowAdmin(false)}
          onRemoveUser={async (uid) => {
            await houseHook.removeUser(houseId, uid);
          }}
          onAddRoom={async (data) => {
            await houseHook.addRoom(houseId, data);
            showToast(`✅ Stanza aggiunta`);
          }}
          onRemoveRoom={async (roomId) => {
            await houseHook.removeRoom(houseId, roomId);
          }}
          onAddRule={async (type, config) => {
            await houseHook.addRule(houseId, type, config);
          }}
          onRemoveRule={async (ruleId) => {
            await houseHook.removeRule(houseId, ruleId);
          }}
        />
      )}

      <CatMascot weeks={weeks} userId={userId} />
      <Toast toast={toast} />
    </>
  );
}
