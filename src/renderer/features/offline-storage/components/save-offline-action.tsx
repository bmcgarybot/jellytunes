import { useCallback } from 'react';

import {
    downloadTrack,
    removeDownloadedTrack,
} from '/@/renderer/features/offline-storage/download-manager';
import { useOfflineStore } from '/@/renderer/features/offline-storage/offline-store';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';

interface SaveOfflineActionProps {
    songs: Song[];
}

export const SaveOfflineAction = ({ songs }: SaveOfflineActionProps) => {
    const server = useCurrentServer();
    const downloadedTracks = useOfflineStore((s) => s.downloadedTracks);

    const allDownloaded = songs.every((s) => Boolean(downloadedTracks[s.id]));

    const onSelect = useCallback(async () => {
        if (!server) return;

        if (allDownloaded) {
            for (const song of songs) {
                await removeDownloadedTrack(song.id);
            }
        } else {
            for (const song of songs) {
                if (!downloadedTracks[song.id]) {
                    downloadTrack(song, server.id);
                }
            }
        }
    }, [server, songs, allDownloaded, downloadedTracks]);

    return (
        <ContextMenu.Item leftIcon={allDownloaded ? 'check' : 'cache'} onSelect={onSelect}>
            {allDownloaded ? 'Remove offline' : 'Save offline'}
        </ContextMenu.Item>
    );
};
