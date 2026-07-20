const DB_NAME = 'jellytunes-offline';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-blobs';
const ARTWORK_STORE = 'artwork';

export interface AudioBlobRecord {
    blob: Blob;
    mimeType: string;
    size: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(AUDIO_STORE)) {
                db.createObjectStore(AUDIO_STORE);
            }

            if (!db.objectStoreNames.contains(ARTWORK_STORE)) {
                db.createObjectStore(ARTWORK_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => {
            dbPromise = null;
            reject(request.error);
        };
    });

    return dbPromise;
}

function tx(
    storeName: string,
    mode: IDBTransactionMode,
): Promise<{ store: IDBObjectStore; tx: IDBTransaction }> {
    return openDB().then((db) => {
        const transaction = db.transaction(storeName, mode);
        return { store: transaction.objectStore(storeName), tx: transaction };
    });
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ─── Audio Blobs ────────────────────────────────────────────

export async function saveAudioBlob(
    trackId: string,
    record: AudioBlobRecord,
): Promise<void> {
    const { store } = await tx(AUDIO_STORE, 'readwrite');
    await promisify(store.put(record, trackId));
}

export async function getAudioBlob(
    trackId: string,
): Promise<AudioBlobRecord | undefined> {
    const { store } = await tx(AUDIO_STORE, 'readonly');
    return promisify(store.get(trackId));
}

export async function deleteAudioBlob(trackId: string): Promise<void> {
    const { store } = await tx(AUDIO_STORE, 'readwrite');
    await promisify(store.delete(trackId));
}

export async function getAllTrackIds(): Promise<string[]> {
    const { store } = await tx(AUDIO_STORE, 'readonly');
    const keys = await promisify(store.getAllKeys());
    return keys.map(String);
}

export async function getStorageUsed(): Promise<number> {
    const { store } = await tx(AUDIO_STORE, 'readonly');

    return new Promise((resolve, reject) => {
        const request = store.openCursor();
        let total = 0;

        request.onsuccess = () => {
            const cursor = request.result;

            if (cursor) {
                const record = cursor.value as AudioBlobRecord;
                total += record.size;
                cursor.continue();
            } else {
                resolve(total);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

// ─── Artwork ────────────────────────────────────────────────

export async function saveArtwork(
    albumId: string,
    blob: Blob,
): Promise<void> {
    const { store } = await tx(ARTWORK_STORE, 'readwrite');
    await promisify(store.put(blob, albumId));
}

export async function getArtwork(
    albumId: string,
): Promise<Blob | undefined> {
    const { store } = await tx(ARTWORK_STORE, 'readonly');
    return promisify(store.get(albumId));
}

export async function deleteArtwork(albumId: string): Promise<void> {
    const { store } = await tx(ARTWORK_STORE, 'readwrite');
    await promisify(store.delete(albumId));
}
