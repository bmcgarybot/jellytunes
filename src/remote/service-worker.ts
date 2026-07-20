/// <reference lib="WebWorker" />

export type {};

declare const self: ServiceWorkerGlobalScope;

const url = new URL(location.toString());
const version = url.searchParams.get('version');
const prod = url.searchParams.get('prod') === 'true';
const cacheName = `Feishin-remote-${version}`;

const resourcesToCache = ['./', './remote.js', './favicon.ico'];

if (prod) {
    resourcesToCache.push('./remote.css');
}

// ─── Offline audio DB helpers ───────────────────────────────

const OFFLINE_DB_NAME = 'jellytunes-offline';
const AUDIO_STORE = 'audio-blobs';

function openOfflineDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(AUDIO_STORE)) {
                db.createObjectStore(AUDIO_STORE);
            }
            if (!db.objectStoreNames.contains('artwork')) {
                db.createObjectStore('artwork');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getOfflineAudio(trackId: string): Promise<{ blob: Blob; mimeType: string } | null> {
    return openOfflineDB().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(AUDIO_STORE, 'readonly');
                const store = tx.objectStore(AUDIO_STORE);
                const req = store.get(trackId);
                req.onsuccess = () => {
                    const result = req.result;
                    if (result && result.blob) {
                        resolve({ blob: result.blob, mimeType: result.mimeType || 'audio/mpeg' });
                    } else {
                        resolve(null);
                    }
                };
                req.onerror = () => reject(req.error);
            }),
    );
}

/**
 * Attempt to extract a Jellyfin item ID from a download/stream URL.
 * Patterns:
 *   /items/{id}/download
 *   /Items/{id}/Download
 *   /audio/{id}/universal
 */
function extractTrackId(requestUrl: string): string | null {
    const match = requestUrl.match(/\/(?:items|audio)\/([a-f0-9]+)\//i);
    return match ? match[1] : null;
}

// ─── Service worker events ──────────────────────────────────

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(resourcesToCache);
        }),
    );
});

self.addEventListener('fetch', (e) => {
    const requestUrl = e.request.url;

    // Check if this is an audio request that might be available offline
    const trackId = extractTrackId(requestUrl);

    if (trackId) {
        e.respondWith(
            (async () => {
                // Try offline DB first
                try {
                    const offlineAudio = await getOfflineAudio(trackId);
                    if (offlineAudio) {
                        return new Response(offlineAudio.blob, {
                            headers: {
                                'Content-Type': offlineAudio.mimeType,
                            },
                            status: 200,
                        });
                    }
                } catch {
                    // Fall through to network
                }

                // Fall back to network
                try {
                    return await fetch(e.request);
                } catch {
                    return new Response('Offline and track not cached', { status: 503 });
                }
            })(),
        );
        return;
    }

    // Default: cache-first for static assets
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        }),
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== cacheName) {
                        return caches.delete(key);
                    }
                    return Promise.resolve();
                }),
            );
        }),
    );
});
