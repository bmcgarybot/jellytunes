import { useEffect, useRef } from 'react';

import {
    useDownloadQueue,
    useIsOfflineMode,
    useOfflineActions,
} from '/@/renderer/features/offline-storage/offline-store';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

/**
 * Small indicator meant to sit in the sidebar or header.
 * - Shows when offline mode is active
 * - Shows active download count + progress
 * - Auto-detects server unreachable and suggests offline mode
 */
export const OfflineIndicator = () => {
    const isOfflineMode = useIsOfflineMode();
    const downloadQueue = useDownloadQueue();
    const { setOfflineMode } = useOfflineActions();

    const activeDownloads = downloadQueue.filter(
        (q) => q.status === 'downloading' || q.status === 'pending',
    );

    // Auto-detect offline via browser's navigator.onLine
    const wasOnline = useRef(navigator.onLine);

    useEffect(() => {
        const handleOffline = () => {
            if (wasOnline.current) {
                setOfflineMode(true);
            }

            wasOnline.current = false;
        };

        const handleOnline = () => {
            wasOnline.current = true;
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [setOfflineMode]);

    if (!isOfflineMode && activeDownloads.length === 0) {
        return null;
    }

    return (
        <Group gap="xs" style={{ padding: '0.25rem 0.5rem' }}>
            {isOfflineMode && (
                <Tooltip label="Offline mode — playing from local downloads">
                    <Group gap={4}>
                        <Icon color="muted" icon="wifiOff" size="0.9rem" />
                        <Text color="muted" size="xs">
                            Offline
                        </Text>
                    </Group>
                </Tooltip>
            )}
            {activeDownloads.length > 0 && (
                <Tooltip label={`Downloading ${activeDownloads.length} track(s)`}>
                    <Group gap={4}>
                        <Icon animate="spin" color="muted" icon="spinner" size="0.9rem" />
                        <Text color="muted" size="xs">
                            {activeDownloads.length}
                        </Text>
                    </Group>
                </Tooltip>
            )}
        </Group>
    );
};
