/**
 * "For You" section component — Apple Music-inspired discovery page
 */
import { BUILT_IN_PLAYLISTS, getDecadePlaylists } from '../utils/smart-playlist-definitions';
import type { SmartPlaylistDefinition } from '../utils/smart-playlist-definitions';
import styles from './for-you.module.css';

interface ForYouSectionProps {
    onPlaylistClick?: (playlist: SmartPlaylistDefinition) => void;
    genres?: string[];
}

export function ForYouSection({ onPlaylistClick, genres = [] }: ForYouSectionProps) {
    const decadePlaylists = getDecadePlaylists();

    // Build genre playlists from available genres
    const genrePlaylists: SmartPlaylistDefinition[] = genres.slice(0, 12).map((genre) => ({
        id: `smart-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'genre' as const,
        name: genre,
        description: `All ${genre} tracks in your library`,
        icon: '🎵',
        color: stringToColor(genre),
        param: genre,
    }));

    return (
        <div className={styles.forYouContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>For You</h1>
                <p className={styles.subtitle}>Your personalized music experience</p>
            </div>

            {/* Main Smart Playlists */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Made for You</h2>
                <div className={styles.playlistGrid}>
                    {BUILT_IN_PLAYLISTS.map((playlist) => (
                        <button
                            key={playlist.id}
                            className={styles.playlistCard}
                            onClick={() => onPlaylistClick?.(playlist)}
                            style={{
                                background: `linear-gradient(135deg, ${playlist.color}dd, ${playlist.color}88)`,
                            }}
                        >
                            <span className={styles.playlistIcon}>{playlist.icon}</span>
                            <span className={styles.playlistName}>{playlist.name}</span>
                            <span className={styles.playlistDesc}>{playlist.description}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Decades */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Browse by Decade</h2>
                <div className={styles.decadeGrid}>
                    {decadePlaylists.map((playlist) => (
                        <button
                            key={playlist.id}
                            className={styles.decadeCard}
                            onClick={() => onPlaylistClick?.(playlist)}
                            style={{
                                background: `linear-gradient(135deg, ${playlist.color}cc, ${playlist.color}66)`,
                            }}
                        >
                            <span className={styles.decadeName}>{playlist.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Genres */}
            {genrePlaylists.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Browse by Genre</h2>
                    <div className={styles.genreGrid}>
                        {genrePlaylists.map((playlist) => (
                            <button
                                key={playlist.id}
                                className={styles.genreCard}
                                onClick={() => onPlaylistClick?.(playlist)}
                                style={{
                                    background: `linear-gradient(135deg, ${playlist.color}cc, ${playlist.color}66)`,
                                }}
                            >
                                <span className={styles.genreName}>{playlist.name}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

/**
 * Deterministic color from string
 */
function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 45%)`;
}
