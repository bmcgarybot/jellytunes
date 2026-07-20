import { useEffect, useRef, useState } from 'react';

import { getAudioBlob } from '/@/renderer/features/offline-storage/offline-db';
import { useIsTrackDownloaded } from '/@/renderer/features/offline-storage/offline-store';

/**
 * Given a trackId, returns a `blob:` URL when the track is available
 * offline, or `null` if it should fall back to the server stream.
 *
 * Automatically revokes old blob URLs on unmount or when the trackId changes.
 */
export function useOfflineAudio(trackId: string | undefined): string | null {
    const isDownloaded = useIsTrackDownloaded(trackId);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!trackId || !isDownloaded) {
            // Revoke previous URL if the track is no longer downloaded
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }

            setBlobUrl(null);
            return;
        }

        (async () => {
            try {
                const record = await getAudioBlob(trackId);

                if (cancelled || !record) {
                    return;
                }

                // Revoke previous before creating a new one
                if (urlRef.current) {
                    URL.revokeObjectURL(urlRef.current);
                }

                const url = URL.createObjectURL(record.blob);
                urlRef.current = url;
                setBlobUrl(url);
            } catch {
                setBlobUrl(null);
            }
        })();

        return () => {
            cancelled = true;

            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [trackId, isDownloaded]);

    return blobUrl;
}
