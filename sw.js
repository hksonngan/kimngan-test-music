const CACHE = 'music-player-v4';
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
    if (!e.request.url.startsWith('http')) return; // skip non-http (empty, blob, data URLs)
    // Handle range requests for audio (browsers send these for seeking)
    if (e.request.headers.get('range')) {
        e.respondWith(
            caches.open(CACHE).then(async cache => {
                const cached = await cache.match(e.request.url, { ignoreVary: true });
                if (!cached) return fetch(e.request);
                const buf = await cached.arrayBuffer();
                const range = e.request.headers.get('range');
                const m = /bytes=(\d+)-(\d*)/.exec(range);
                if (!m) return new Response('Invalid range', { status: 416 });
                const from = Number(m[1]);
                const to = Math.min(m[2] ? Number(m[2]) : buf.byteLength - 1, buf.byteLength - 1);
                if (from >= buf.byteLength) {
                    return new Response(null, {
                        status: 416,
                        headers: { 'Content-Range': `bytes */${buf.byteLength}` },
                    });
                }
                const chunk = buf.slice(from, to + 1);
                return new Response(chunk, {
                    status: 206,
                    headers: {
                        'Content-Range': `bytes ${from}-${to}/${buf.byteLength}`,
                        'Content-Length': String(chunk.byteLength),
                        'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
                    },
                });
            })
        );
        return;
    }
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
