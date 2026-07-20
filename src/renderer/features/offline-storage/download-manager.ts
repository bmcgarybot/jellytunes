import { api } from '/@/renderer/api';
import {
    deleteAudioBlob,
    saveAudioBlob,
} from '/@/renderer/features/offline-storage/offline-db';
import {
    DownloadedTrackMeta,
    useOfflineStore,
} from '/@/renderer/features/offline-storage/offline-store';
import { getServerById } from '/@/renderer/store';
import { Song } from '/@/shared/types/domain-types';

// ─── Concurrency control ───────────────────────────────────

const MAX_CONCURRENT = 2;
let activeCount = 0;
const pending: Array<() => void> = [];
const abortControllers = new Map<string, AbortController>();

function enqueue(): Promise<void> {
    if (activeCount < MAX_CONCURRENT) {
        activeCount++;
        return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
        pending.push(resolve);
    });
}

function dequeue(): void {
    activeCount--;

    if (pending.length > 0) {
        activeCount++;
        const next = pending.shift()!;
        next();
    }
}

// ─── Single track download ─────────────────────────────────

export async function downloadTrack(
    song: Song,
    serverId: string,
): Promise<void> {
    const { actions } = useOfflineStore.getState();
    const trackId = song.id;

    // Already downloaded?
    const existing = useOfflineStore.getState().downloadedTracks[trackId];
    if (existing) return;

    // Already in queue?
    const inQueue = useOfflineStore.getState().downloadQueue.find((q) => q.id === trackId);
    if (inQueue) return;

    actions.addToQueue({
        id: trackId,
        progress: 0,
        status: 'pending',
        title: song.name,
    });

    await enqueue();

    // Check if cancelled while waiting
    const queueItem = useOfflineStore.getState().downloadQueue.find((q) => q.id === trackId);
    if (!queueItem || queueItem.status === 'cancelled') {
        dequeue();
        actions.removeFromQueue(trackId);
        return;
    }

    const ac = new AbortController();
    abortControllers.set(trackId, ac);

    actions.updateQueueItem(trackId, { status: 'downloading' });

    try {
        const server = getServerById(serverId);

        if (!server) throw new Error('Server not found');

        const downloadUrl = api.controller.getDownloadUrl({
            apiClientProps: { serverId },
            query: { id: trackId },
        });

        const response = await fetch(downloadUrl, {
            signal: ac.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        const mimeType =
            response.headers.get('content-type') || 'audio/mpeg';

        const reader = response.body?.getReader();

        if (!reader) {
            throw new Error('No readable stream');
        }

        const chunks: Uint8Array[] = [];
        let received = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            received += value.length;

            if (contentLength > 0) {
                actions.updateQueueItem(trackId, {
                    progress: Math.round((received / contentLength) * 100),
                });
            }
        }

        const blob = new Blob(chunks, { type: mimeType });

        await saveAudioBlob(trackId, {
            blob,
            mimeType,
            size: blob.size,
        });

        const meta: DownloadedTrackMeta = {
            album: song.album || '',
            albumId: song.albumId,
            artist: song.artistName,
            downloadedAt: Date.now(),
            duration: song.duration,
            id: trackId,
            mimeType,
            serverId,
            size: blob.size,
            title: song.name,
        };

        actions.trackDownloaded(meta);
        actions.removeFromQueue(trackId);
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            actions.updateQueueItem(trackId, { status: 'cancelled' });
        } else {
            console.error(`[offline] Failed to download track ${trackId}:`, error);
            actions.updateQueueItem(trackId, { status: 'error' });
        }
    } finally {
        abortControllers.delete(trackId);
        dequeue();
    }
}

// ─── Album download ────────────────────────────────────────

export async function downloadAlbum(
    albumId: string,
    serverId: string,
): Promise<void> {
    if (!getServerById(serverId)) return;

    const albumDetail = await api.controller.getAlbumDetail({
        apiClientProps: { serverId },
        query: { id: albumId },
    });

    if (!albumDetail?.songs) return;

    // Serialise downloads, but each one goes through the concurrency pool
    for (const song of albumDetail.songs) {
        await downloadTrack(song, serverId);
    }
}

// ─── Playlist download ──────────────────────────────────────

export async function downloadPlaylist(
    playlistId: string,
    serverId: string,
): Promise<void> {
    if (!getServerById(serverId)) return;

    const playlistSongs = await api.controller.getPlaylistSongList({
        apiClientProps: { serverId },
        query: { id: playlistId, limit: 10000, startIndex: 0 },
    });

    if (!playlistSongs?.items) return;

    for (const song of playlistSongs.items) {
        await downloadTrack(song, serverId);
    }
}

// ─── Remove helpers ─────────────────────────────────────────

export async function removeDownloadedTrack(trackId: string): Promise<void> {
    const { actions } = useOfflineStore.getState();
    await deleteAudioBlob(trackId);
    actions.removeTrack(trackId);
}

export async function removeDownloadedAlbum(albumId: string): Promise<void> {
    const { downloadedTracks } = useOfflineStore.getState();
    const trackIds = Object.values(downloadedTracks)
        .filter((t) => t.albumId === albumId)
        .map((t) => t.id);

    for (const id of trackIds) {
        await removeDownloadedTrack(id);
    }
}

export async function clearAllDownloads(): Promise<void> {
    const { actions, downloadedTracks } = useOfflineStore.getState();

    for (const id of Object.keys(downloadedTracks)) {
        await deleteAudioBlob(id);
    }

    actions.clearAll();
}

// ─── Cancel ─────────────────────────────────────────────────

export function cancelDownload(trackId: string): void {
    const ac = abortControllers.get(trackId);

    if (ac) {
        ac.abort();
    }

    const { actions } = useOfflineStore.getState();
    actions.updateQueueItem(trackId, { status: 'cancelled' });
}

// ─── Storage estimate ───────────────────────────────────────

export async function getStorageEstimate(): Promise<{
    quota: number;
    usage: number;
}> {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
            quota: estimate.quota ?? 0,
            usage: estimate.usage ?? 0,
        };
    }

    return { quota: 0, usage: 0 };
}
