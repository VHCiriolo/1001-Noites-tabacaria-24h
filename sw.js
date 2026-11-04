// Service worker da 1001 Noites.
// Ao publicar uma versão nova do app, aumente o número abaixo para os aparelhos atualizarem.
const VERSION = 'v8';
const SHELL = 'shell-' + VERSION;
const FONTS = 'fonts-v1';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './Icons/icon-192.png', './Icons/icon-512.png',
  './Icons/icon-maskable-512.png', './Icons/apple-touch-icon.png', './Icons/logo-1001-noites.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fontes do Google: guarda na primeira vez e funciona offline depois
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONTS).then(c =>
        c.match(req).then(hit => {
          const rede = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
          return hit || rede;
        })
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Página: tenta a rede primeiro (pega versão nova), cai para o cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(SHELL).then(c => c.put('./index.html', copia)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais arquivos: cache primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
