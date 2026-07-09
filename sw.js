const CACHE = 'music-player-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/img/01.jpg', '/img/02.jpg', '/img/03.jpg', '/img/04.jpg', '/img/05.jpg',
    '/img/06.jpg', '/img/07.jpg', '/img/08.jpg', '/img/09.jpg', '/img/10.jpg',
    '/songs/01-chung-ta-cua-hien-tai.mp3',
    '/songs/02-let-me-down-slowly.mp3',
    '/songs/03-give-me-your-love.mp3',
    '/songs/04-without-you.mp3',
    '/songs/05-perfect.mp3',
    '/songs/06-rendezvous.mp3',
    '/songs/07-fractures.mp3',
    '/songs/08-mayday.mp3',
    '/songs/09-solitude.mp3',
    '/songs/10-chosen.mp3',
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
