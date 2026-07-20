import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    downloadAlbum,
    downloadPlaylist,
    downloadTrack,
    removeDownloadedAlbum,
    removeDownloadedTrack,
} from '/@/renderer/features/offline-storage/download-manager';
import {
    useDownloadQueue,
    useIsTrackDownloaded,
    useOfflineStore,
} from '/@/renderer/features/offline-storage/offline-store';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { Song } from '/@/shared/types/domain-types';

interface DownloadButtonProps {
    /** For album-level downloads */
    albumId?: string;
    /** For playlist-level downloads */
    playlistId?: string;
    size?: string;
    /** For single-track downloads */
    song?: Song;
}

export const DownloadButton = ({ albumId, playlistId, size, song }: DownloadButtonProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const isTrackDownloaded = useIsTrackDownloaded(song?.id);
    const downloadQueue = useDownloadQueue();
    const downloadedTracks = useOfflineStore((s) => s.downloadedTracks);

    const [confirming, setConfirming] = useState(false);

    // Check album-level download status
    const isAlbumDownloaded =
        albumId &&
        Object.values(downloadedTracks).some((t) => t.albumId === albumId);

    const isInQueue = song
        ? downloadQueue.some((q) => q.id === song.id)
        : false;

    const queueItem = song
        ? downloadQueue.find((q) => q.id === song.id)
        : undefined;

    const isDownloaded = song ? isTrackDownloaded : isAlbumDownloaded;

    const handleClick = useCallback(async () => {
        if (!server) return;

        if (isDownloaded && !confirming) {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000);
            return;
        }

        if (isDownloaded && confirming) {
            setConfirming(false);

            if (song) {
                await removeDownloadedTrack(song.id);
            } else if (albumId) {
                await removeDownloadedAlbum(albumId);
            }

            return;
        }

        if (song) {
            downloadTrack(song, server.id);
        } else if (albumId) {
            downloadAlbum(albumId, server.id);
        } else if (playlistId) {
            downloadPlaylist(playlistId, server.id);
        }
    }, [server, isDownloaded, confirming, song, albumId, playlistId]);

    const getIcon = (): string => {
        if (confirming) return 'delete';
        if (isDownloaded) return 'check';
        if (isInQueue) return 'spinner';
        return 'download';
    };

    const getTooltipLabel = (): string => {
        if (confirming) return 'Remove download?';
        if (isDownloaded) return 'Downloaded';
        if (isInQueue && queueItem) return `Downloading ${queueItem.progress}%`;
        return 'Save offline';
    };

    return (
        <Tooltip label={getTooltipLabel()} openDelay={300}>
            <ActionIcon
                icon={getIcon() as any}
                iconProps={{ animate: isInQueue ? 'spin' : undefined }}
                onClick={handleClick}
                size={size || 'md'}
            />
        </Tooltip>
    );
};
