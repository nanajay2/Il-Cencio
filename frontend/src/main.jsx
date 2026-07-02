import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  // Il service worker chiama skipWaiting()/clients.claim() appena installato,
  // quindi quando prende il controllo vuol dire che e' stata scaricata una
  // nuova versione: ricarichiamo una volta sola per aggiornare l'app senza
  // che l'utente debba eliminare e reinstallare l'icona in home.
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Controlla subito se c'e' una versione piu' recente, e ogni volta
      // che l'app torna in primo piano (utile per la PWA installata,
      // che spesso resta aperta a lungo in background).
      registration.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    }).catch(err => {
      console.error('Registrazione service worker fallita:', err);
    });
  });
}
