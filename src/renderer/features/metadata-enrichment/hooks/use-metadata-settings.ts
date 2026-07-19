import { useCallback, useState } from 'react';

/**
 * Hook for metadata enrichment settings stored in localStorage
 */

const STORAGE_KEY = 'jellytunes-metadata-settings';

interface MetadataSettings {
    enrichmentEnabled: boolean;
    fanartTvApiKey: string;
    lastfmApiKey: string;
}

export function useMetadataSettings() {
    // State-backed so consumers re-render when settings change; the old
    // version wrote to localStorage without updating any state, leaving
    // the UI stale until a full reload.
    const [settings, setSettings] = useState<MetadataSettings>(getSettings);

    const updateSettings = useCallback((partial: Partial<MetadataSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...partial };
            saveSettings(updated);
            return updated;
        });
    }, []);

    return {
        ...settings,
        updateSettings,
    };
}

function getSettings(): MetadataSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // ignore
    }

    // Check for environment-level config (Docker env vars injected via settings.js)
    const win = window as unknown as Record<string, unknown>;
    return {
        enrichmentEnabled: true,
        fanartTvApiKey: (win.FANART_TV_API_KEY as string) || '',
        lastfmApiKey: (win.LASTFM_API_KEY as string) || '',
    };
}

function saveSettings(settings: MetadataSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // ignore
    }
}
