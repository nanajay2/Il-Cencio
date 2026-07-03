// Cattura l'evento beforeinstallprompt il prima possibile (Chrome/Edge su
// Android e desktop). Su iOS Safari e Firefox questo evento non esiste:
// li' l'installazione resta manuale (vedi InstallGate.jsx).
let deferredPrompt = null;
let listeners = [];

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach(fn => fn());
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function onDeferredPrompt(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export async function promptInstall() {
  if (!deferredPrompt) return null;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  return prompt.userChoice;
}
