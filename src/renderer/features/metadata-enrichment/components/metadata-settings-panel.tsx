/**
 * Metadata Enrichment Settings Panel
 * Allows users to configure API keys for Last.fm, Fanart.tv, etc.
 */
import { useState } from 'react';
import { useMetadataSettings } from '../hooks/use-metadata-settings';
import { clearMetadataCache } from '../api/metadata-service';
import styles from './metadata-settings.module.css';

export function MetadataSettingsPanel() {
    const { enrichmentEnabled, lastfmApiKey, fanartTvApiKey, updateSettings } =
        useMetadataSettings();
    const [localLastfmKey, setLocalLastfmKey] = useState(lastfmApiKey);
    const [localFanartKey, setLocalFanartKey] = useState(fanartTvApiKey);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateSettings({
            lastfmApiKey: localLastfmKey,
            fanartTvApiKey: localFanartKey,
        });
        clearMetadataCache();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>🎵 Metadata Enrichment</h3>
            <p className={styles.description}>
                JellyTunes can automatically fetch artist biographies, images, genres, and
                similar artists from external sources. Configure your free API keys below for
                the best experience.
            </p>

            <div className={styles.toggle}>
                <label className={styles.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={enrichmentEnabled}
                        onChange={(e) =>
                            updateSettings({ enrichmentEnabled: e.target.checked })
                        }
                    />
                    Enable metadata enrichment
                </label>
            </div>

            {enrichmentEnabled && (
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                            Last.fm API Key
                            <a
                                href="https://www.last.fm/api/account/create"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Get free key →
                            </a>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={localLastfmKey}
                            onChange={(e) => setLocalLastfmKey(e.target.value)}
                            placeholder="e.g., a1b2c3d4e5f6..."
                        />
                        <span className={styles.hint}>
                            Provides artist biographies, tags, similar artists, and play statistics
                        </span>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                            Fanart.tv API Key
                            <a
                                href="https://fanart.tv/get-an-api-key/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                Get free key →
                            </a>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={localFanartKey}
                            onChange={(e) => setLocalFanartKey(e.target.value)}
                            placeholder="e.g., f1g2h3i4j5k6..."
                        />
                        <span className={styles.hint}>
                            Provides high-quality artist backgrounds, thumbnails, logos, and banners
                        </span>
                    </div>

                    <div className={styles.info}>
                        <strong>MusicBrainz</strong> is always available (no API key needed).
                        It provides genres, tags, release dates, and cover art.
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.saveButton} onClick={handleSave}>
                            {saved ? '✓ Saved!' : 'Save Settings'}
                        </button>
                        <button
                            className={styles.clearButton}
                            onClick={() => {
                                clearMetadataCache();
                            }}
                        >
                            Clear Cache
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
