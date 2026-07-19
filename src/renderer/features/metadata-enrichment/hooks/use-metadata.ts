/**
 * React hooks for metadata enrichment
 */
import { useQuery } from '@tanstack/react-query';
import { getEnrichedArtistMetadata, getEnrichedAlbumMetadata } from '../api/metadata-service';
import { useMetadataSettings } from './use-metadata-settings';

/**
 * Hook to fetch enriched artist metadata
 */
export function useArtistMetadata(artistName: string | undefined) {
    const { lastfmApiKey, fanartTvApiKey, enrichmentEnabled } = useMetadataSettings();

    return useQuery({
        queryKey: ['jellytunes', 'artist-metadata', artistName],
        queryFn: () =>
            getEnrichedArtistMetadata(artistName!, {
                lastfmApiKey: lastfmApiKey || undefined,
                fanartTvApiKey: fanartTvApiKey || undefined,
            }),
        enabled: !!artistName && enrichmentEnabled,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
        retry: 1,
    });
}

/**
 * Hook to fetch enriched album metadata
 */
export function useAlbumMetadata(albumName: string | undefined, artistName: string | undefined) {
    const { lastfmApiKey, fanartTvApiKey, enrichmentEnabled } = useMetadataSettings();

    return useQuery({
        queryKey: ['jellytunes', 'album-metadata', albumName, artistName],
        queryFn: () =>
            getEnrichedAlbumMetadata(albumName!, artistName!, {
                lastfmApiKey: lastfmApiKey || undefined,
                fanartTvApiKey: fanartTvApiKey || undefined,
            }),
        enabled: !!albumName && !!artistName && enrichmentEnabled,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 1,
    });
}
