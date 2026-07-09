const CACHE = 'music-player-v1';
const ASSETS = [
    '/',
    '/index.html',
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
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting())  // only skip if install succeeded
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())  // claim only after old caches purged
    );
});

self.addEventListener('fetch', e => {
    // Handle range requests for audio (browsers send these for seeking)
    if (e.request.headers.get('range')) {
        e.respondWith(
            caches.open(CACHE).then(async cache => {
                const cached = await cache.match(e.request.url); // match without range header
                if (!cached) return fetch(e.request);
                const buf = await cached.arrayBuffer();
                const range = e.request.headers.get('range');
                const [, start, end] = /bytes=(\d+)-(\d*)/.exec(range);
                const from = Number(start);
                const to = end ? Number(end) : buf.byteLength - 1;
                return new Response(buf.slice(from, to + 1), {
                    status: 206,
                    headers: {
                        'Content-Range': `bytes ${from}-${to}/${buf.byteLength}`,
                        'Content-Length': String(to - from + 1),
                        'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
                    },
                });
            })
        );
        return;
    }
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
