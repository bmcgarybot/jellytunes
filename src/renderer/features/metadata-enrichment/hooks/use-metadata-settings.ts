/**
 * Hook for metadata enrichment settings stored in localStorage
 */

const STORAGE_KEY = 'jellytunes-metadata-settings';

interface MetadataSettings {
    enrichmentEnabled: boolean;
    lastfmApiKey: string;
    fanartTvApiKey: string;
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
    const win = window as Record<string, unknown>;
    return {
        enrichmentEnabled: true,
        lastfmApiKey: (win.LASTFM_API_KEY as string) || '',
        fanartTvApiKey: (win.FANART_TV_API_KEY as string) || '',
    };
}

function saveSettings(settings: MetadataSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // ignore
    }
}

export function useMetadataSettings() {
    const settings = getSettings();

    const updateSettings = (partial: Partial<MetadataSettings>) => {
        const updated = { ...settings, ...partial };
        saveSettings(updated);
    };

    return {
        ...settings,
        updateSettings,
    };
}
