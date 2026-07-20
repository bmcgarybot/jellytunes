import { useCallback, useEffect, useMemo, useState } from 'react';

import styles from './downloads-page.module.css';

import {
    clearAllDownloads,
    getStorageEstimate,
    removeDownloadedAlbum,
    removeDownloadedTrack,
} from '/@/renderer/features/offline-storage/download-manager';
import {
    useDownloadedTracks,
    useIsOfflineMode,
    useOfflineActions,
    useOfflineStorageUsed,
} from '/@/renderer/features/offline-storage/offline-store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const DownloadsPage = () => {
    const downloadedTracks = useDownloadedTracks();
    const storageUsed = useOfflineStorageUsed();
    const isOfflineMode = useIsOfflineMode();
    const { setOfflineMode } = useOfflineActions();

    const [storageQuota, setStorageQuota] = useState(0);

    useEffect(() => {
        getStorageEstimate().then(({ quota }) => setStorageQuota(quota));
    }, []);

    const grouped = useMemo(() => {
        const groups: Record<
            string,
            { albumName: string; tracks: (typeof downloadedTracks)[string][] }
        > = {};

        for (const track of Object.values(downloadedTracks)) {
            const key = track.albumId || 'unknown';

            if (!groups[key]) {
                groups[key] = { albumName: track.album || 'Unknown Album', tracks: [] };
            }

            groups[key].tracks.push(track);
        }

        return groups;
    }, [downloadedTracks]);

    const trackCount = Object.keys(downloadedTracks).length;
    const albumCount = Object.keys(grouped).length;

    const handleClearAll = useCallback(async () => {
        await clearAllDownloads();
    }, []);

    const handleRemoveTrack = useCallback(async (trackId: string) => {
        await removeDownloadedTrack(trackId);
    }, []);

    const handleRemoveAlbum = useCallback(async (albumId: string) => {
        await removeDownloadedAlbum(albumId);
    }, []);

    const storagePercent = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

    return (
        <div className={styles['container']}>
            <div className={styles['header']}>
                <Text fw={700} size="xl">
                    Downloads
                </Text>
                {trackCount > 0 && (
                    <Button onClick={handleClearAll} size="compact-sm" variant="outline">
                        Clear all
                    </Button>
                )}
            </div>

            {/* Offline toggle */}
            <div className={styles['offline-toggle']}>
                <Group gap="sm">
                    <Icon icon="wifiOff" />
                    <Text>Offline mode</Text>
                </Group>
                <Switch
                    checked={isOfflineMode}
                    onChange={(e) => setOfflineMode(e.currentTarget.checked)}
                />
            </div>

            {/* Storage bar */}
            <div className={styles['storage-bar-container']}>
                <div className={styles['storage-bar']}>
                    <div
                        className={styles['storage-bar-fill']}
                        style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                </div>
                <div className={styles['storage-info']}>
                    <span>
                        {formatBytes(storageUsed)} used
                        {storageQuota > 0 && ` of ${formatBytes(storageQuota)}`}
                    </span>
                    <span>
                        {trackCount} track{trackCount !== 1 ? 's' : ''} in {albumCount} album
                        {albumCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Track list grouped by album */}
            {trackCount === 0 ? (
                <div className={styles['empty']}>
                    <Icon color="muted" icon="download" size="2rem" />
                    <Text color="muted">No downloads yet</Text>
                    <Text color="muted" size="sm">
                        Save music offline from context menus or album pages
                    </Text>
                </div>
            ) : (
                Object.entries(grouped).map(([albumId, group]) => (
                    <div className={styles['album-group']} key={albumId}>
                        <div className={styles['album-group-header']}>
                            <Group gap="sm">
                                <Icon icon="album" size="1rem" />
                                <Text fw={600}>{group.albumName}</Text>
                                <Text color="muted" size="sm">
                                    ({group.tracks.length} tracks)
                                </Text>
                            </Group>
                            <ActionIcon
                                icon="delete"
                                onClick={() => handleRemoveAlbum(albumId)}
                                size="sm"
                                tooltip={{ label: 'Remove album', openDelay: 300 }}
                            />
                        </div>
                        {group.tracks.map((track) => (
                            <div className={styles['track-row']} key={track.id}>
                                <div className={styles['track-info']}>
                                    <span className={styles['track-title']}>{track.title}</span>
                                    <span className={styles['track-artist']}>{track.artist}</span>
                                </div>
                                <Group gap="sm">
                                    <span className={styles['track-size']}>
                                        {formatBytes(track.size)}
                                    </span>
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => handleRemoveTrack(track.id)}
                                        size="sm"
                                    />
                                </Group>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
};

export default DownloadsPage;
