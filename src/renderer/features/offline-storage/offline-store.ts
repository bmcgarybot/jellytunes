import { get, set } from 'idb-keyval';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { idbStateStorage } from '/@/renderer/store/utils';

// ─── Types ──────────────────────────────────────────────────

export interface DownloadedTrackMeta {
    album: string;
    albumId: string;
    artist: string;
    downloadedAt: number;
    duration: number;
    id: string;
    mimeType: string;
    serverId: string;
    size: number;
    title: string;
}

export type DownloadStatus = 'cancelled' | 'downloading' | 'error' | 'pending';

export interface QueueItem {
    id: string;
    progress: number;
    status: DownloadStatus;
    title: string;
}

// ─── State ──────────────────────────────────────────────────

interface OfflineState {
    downloadQueue: QueueItem[];
    downloadedTracks: Record<string, DownloadedTrackMeta>;
    isOfflineMode: boolean;
    storageUsed: number;
}

interface OfflineActions {
    actions: {
        addToQueue: (item: QueueItem) => void;
        clearAll: () => void;
        removeFromQueue: (trackId: string) => void;
        removeTrack: (trackId: string) => void;
        setOfflineMode: (value: boolean) => void;
        setStorageUsed: (bytes: number) => void;
        toggleOfflineMode: () => void;
        trackDownloaded: (meta: DownloadedTrackMeta) => void;
        updateQueueItem: (trackId: string, patch: Partial<QueueItem>) => void;
    };
}

export type OfflineSlice = OfflineActions & OfflineState;

// ─── Persistence helpers ────────────────────────────────────

const IDB_KEY = 'store_offline';

/**
 * Serialise `downloadedTracks` as an array so the JSON round-trip
 * doesn't lose data when lodash merge re-hydrates.
 */
interface PersistedShape {
    downloadedTracks: DownloadedTrackMeta[];
    isOfflineMode: boolean;
    storageUsed: number;
}

// ─── Store ──────────────────────────────────────────────────

export const useOfflineStore = createWithEqualityFn<OfflineSlice>()(
    persist(
        devtools(
            immer((set) => ({
                actions: {
                    addToQueue: (item) => {
                        set((state) => {
                            state.downloadQueue.push(item);
                        });
                    },
                    clearAll: () => {
                        set((state) => {
                            state.downloadedTracks = {};
                            state.downloadQueue = [];
                            state.storageUsed = 0;
                        });
                    },
                    removeFromQueue: (trackId) => {
                        set((state) => {
                            state.downloadQueue = state.downloadQueue.filter(
                                (q) => q.id !== trackId,
                            );
                        });
                    },
                    removeTrack: (trackId) => {
                        set((state) => {
                            const track = state.downloadedTracks[trackId];

                            if (track) {
                                state.storageUsed = Math.max(
                                    0,
                                    state.storageUsed - track.size,
                                );
                                delete state.downloadedTracks[trackId];
                            }
                        });
                    },
                    setOfflineMode: (value) => {
                        set((state) => {
                            state.isOfflineMode = value;
                        });
                    },
                    setStorageUsed: (bytes) => {
                        set((state) => {
                            state.storageUsed = bytes;
                        });
                    },
                    toggleOfflineMode: () => {
                        set((state) => {
                            state.isOfflineMode = !state.isOfflineMode;
                        });
                    },
                    trackDownloaded: (meta) => {
                        set((state) => {
                            state.downloadedTracks[meta.id] = meta;
                            state.storageUsed += meta.size;
                        });
                    },
                    updateQueueItem: (trackId, patch) => {
                        set((state) => {
                            const item = state.downloadQueue.find((q) => q.id === trackId);

                            if (item) {
                                Object.assign(item, patch);
                            }
                        });
                    },
                },
                downloadQueue: [],
                downloadedTracks: {},
                isOfflineMode: false,
                storageUsed: 0,
            })),
            { name: 'store_offline' },
        ),
        {
            merge: (persisted, current) => {
                const p = persisted as any;

                if (!p?.state) return current;

                const tracks: Record<string, DownloadedTrackMeta> = {};

                if (Array.isArray(p.state.downloadedTracks)) {
                    for (const t of p.state.downloadedTracks as DownloadedTrackMeta[]) {
                        tracks[t.id] = t;
                    }
                } else if (p.state.downloadedTracks && typeof p.state.downloadedTracks === 'object') {
                    Object.assign(tracks, p.state.downloadedTracks);
                }

                return {
                    ...current,
                    downloadedTracks: tracks,
                    isOfflineMode: p.state.isOfflineMode ?? false,
                    storageUsed: p.state.storageUsed ?? 0,
                };
            },
            name: IDB_KEY,
            partialize: (state) => ({
                downloadedTracks: state.downloadedTracks,
                isOfflineMode: state.isOfflineMode,
                storageUsed: state.storageUsed,
            }),
            storage: {
                getItem: async (name) => {
                    const raw = await get(name);
                    if (!raw) return null;

                    try {
                        return JSON.parse(raw as string);
                    } catch {
                        return null;
                    }
                },
                removeItem: async (name) => {
                    const { del } = await import('idb-keyval');
                    await del(name);
                },
                setItem: async (name, value) => {
                    await set(name, JSON.stringify(value));
                },
            },
        },
    ),
);

// ─── Selectors ──────────────────────────────────────────────

export const useOfflineActions = () => useOfflineStore((s) => s.actions);
export const useIsOfflineMode = () => useOfflineStore((s) => s.isOfflineMode);
export const useDownloadedTracks = () => useOfflineStore((s) => s.downloadedTracks);
export const useDownloadQueue = () => useOfflineStore((s) => s.downloadQueue);
export const useOfflineStorageUsed = () => useOfflineStore((s) => s.storageUsed);

export const useIsTrackDownloaded = (trackId: string | undefined) =>
    useOfflineStore((s) => (trackId ? Boolean(s.downloadedTracks[trackId]) : false));
