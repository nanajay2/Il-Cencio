import { useState, useEffect } from 'react';
import { Header }         from './components/Header.jsx';
import { WeekNavigator }  from './components/WeekNavigator.jsx';
import { ChoreCard }      from './components/ChoreCard.jsx';
import { AbsencesPanel }  from './components/AbsencesPanel.jsx';
import { LoginModal }     from './components/LoginModal.jsx';
import { RevealModal }    from './components/RevealModal.jsx';
import { CatMascot }      from './components/CatMascot.jsx';
import { Toast, useToast } from './components/Toast.jsx';
import { useWeeks }       from './hooks/useWeeks.js';
import { useAbsences }    from './hooks/useAbsences.js';
import { CHORES, fmt, isCurW }   from './constants.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('currentUser'));
  const [showReveal,  setShowReveal]  = useState(false);
  const { toast, show: showToast } = useToast();

  const weeksHook    = useWeeks();
  const absencesHook = useAbsences();

  useEffect(() => {
    weeksHook.load().catch(e => showToast('❌ ' + e.message, 'error'));
    absencesHook.load().catch(e => showToast('❌ ' + e.message, 'error'));
  }, []);

  // trigger reveal when current week changes and user is logged in
  useEffect(() => {
    if (!weeksHook.currentWeek || !currentUser) return;
    if (!isCurW(weeksHook.currentWeek)) return;
    const key = `revealed_${weeksHook.currentWeek.id}_${currentUser}`;
    if (!localStorage.getItem(key)) setShowReveal(true);
  }, [weeksHook.currentWeek?.id, currentUser]);

  function login(name) {
    setCurrentUser(name);
    localStorage.setItem('currentUser', name);
  }
  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }

  async function refresh() {
    try {
      await Promise.all([weeksHook.load(), absencesHook.load()]);
      showToast('Aggiornato ↻');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleToggle(weekId, person) {
    try { await weeksHook.toggleDone(weekId, person); }
    catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleGenerate() {
    const { currentWeek, weeks } = weeksHook;
    const sorted = [...weeks];
    const last   = sorted[sorted.length - 1];
    if (!last) return;
    if (!window.confirm(`Generare la settimana dopo il ${fmt(last.end)}?`)) return;
    try {
      const nw = await weeksHook.generateWeek();
      showToast('✅ Settimana aggiunta!', 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleAddAbsence(person, from, to) {
    try {
      await absencesHook.addAbsence(person, from, to);
      showToast(`✅ Assenza di ${person} aggiunta`, 'success');
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  async function handleRemoveAbsence(id) {
    try { await absencesHook.removeAbsence(id); }
    catch (e) { showToast('❌ ' + e.message, 'error'); }
  }

  const { currentWeek, weeks, currentIdx, loading, goTo, goToCurrent } = weeksHook;

  const choreCards = currentWeek
    ? CHORES
        .map(chore => {
          const person = Object.entries(currentWeek.assignments || {}).find(([, c]) => c === chore)?.[0];
          if (!person) return null;
          return {
            isMe: !!currentUser && person === currentUser,
            el: (
              <ChoreCard
                key={chore}
                chore={chore}
                person={person}
                done={currentWeek.done?.[person] ?? false}
                absent={absencesHook.isAbsent(person, currentWeek.start, currentWeek.end)}
                isMe={!!currentUser && person === currentUser}
                week={currentWeek}
                onToggle={handleToggle}
              />
            ),
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0))
    : [];

  return (
    <>
      <Header currentUser={currentUser} onLogout={logout} onRefresh={refresh} />

      {!currentUser && <LoginModal onLogin={login} />}

      {currentWeek ? (
        <>
          <WeekNavigator
            week={currentWeek}
            currentIdx={currentIdx}
            totalWeeks={weeks.length}
            onPrev={() => goTo(-1)}
            onNext={() => goTo(1)}
            onThisWeek={goToCurrent}
            onGenerate={handleGenerate}
          />
          <div className="cards-wrap">
            {choreCards.map(c => c.el)}
          </div>
        </>
      ) : loading ? (
        <div className="state-box" style={{ margin: '24px 16px 0' }}>
          <div className="ico">⏳</div>
          <p>Caricamento…</p>
        </div>
      ) : (
        <div className="state-box" style={{ margin: '24px 16px 0' }}>
          <div className="ico">📋</div>
          <p>Nessuna settimana disponibile.</p>
        </div>
      )}

      <AbsencesPanel
        absences={absencesHook.absences}
        onAdd={handleAddAbsence}
        onRemove={handleRemoveAbsence}
      />

      <div className="bottom-space" />

      {showReveal && (
        <RevealModal
          week={currentWeek}
          currentUser={currentUser}
          onDismiss={() => setShowReveal(false)}
        />
      )}

      <CatMascot weeks={weeks} currentUser={currentUser} />
      <Toast toast={toast} />
    </>
  );
}
