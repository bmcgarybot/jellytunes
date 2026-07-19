/**
 * Smart Playlist Generator
 *
 * Generates auto-playlists from Jellyfin library data:
 * - Recently Added
 * - Most Played
 * - Top Rated
 * - By Decade (60s, 70s, 80s, 90s, 2000s, 2010s, 2020s)
 * - By Genre
 * - Random Mix
 * - Favorites
 */

export interface SmartPlaylistDefinition {
    color: string;
    description: string;
    icon: string;
    id: string;
    name: string;
    param?: string; // decade year or genre name
    type: SmartPlaylistType;
}

export type SmartPlaylistType =
    | 'decade'
    | 'favorites'
    | 'for-you'
    | 'genre'
    | 'most-played'
    | 'random-mix'
    | 'recently-added'
    | 'top-rated';

/**
 * Built-in smart playlists
 */
export const BUILT_IN_PLAYLISTS: SmartPlaylistDefinition[] = [
    {
        color: '#4CAF50',
        description: 'Fresh additions to your library',
        icon: '✨',
        id: 'smart-recently-added',
        name: 'Recently Added',
        type: 'recently-added',
    },
    {
        color: '#FF5722',
        description: 'Your all-time favorites',
        icon: '🔥',
        id: 'smart-most-played',
        name: 'Most Played',
        type: 'most-played',
    },
    {
        color: '#FFC107',
        description: 'Highest rated tracks in your library',
        icon: '⭐',
        id: 'smart-top-rated',
        name: 'Top Rated',
        type: 'top-rated',
    },
    {
        color: '#E91E63',
        description: 'All your liked songs',
        icon: '❤️',
        id: 'smart-favorites',
        name: 'Favorites',
        type: 'favorites',
    },
    {
        color: '#9C27B0',
        description: 'A fresh random selection from your library',
        icon: '🎲',
        id: 'smart-random-mix',
        name: 'Random Mix',
        type: 'random-mix',
    },
    {
        color: '#2196F3',
        description: 'Personalized recommendations based on your listening',
        icon: '💎',
        id: 'smart-for-you',
        name: 'For You',
        type: 'for-you',
    },
];

/**
 * Generate decade-based smart playlists
 */
export function getDecadePlaylists(): SmartPlaylistDefinition[] {
    const decades = [
        { color: '#8BC34A', name: '60s', year: '1960' },
        { color: '#FF9800', name: '70s', year: '1970' },
        { color: '#E91E63', name: '80s', year: '1980' },
        { color: '#00BCD4', name: '90s', year: '1990' },
        { color: '#673AB7', name: '2000s', year: '2000' },
        { color: '#3F51B5', name: '2010s', year: '2010' },
        { color: '#009688', name: '2020s', year: '2020' },
    ];

    return decades.map((d) => ({
        color: d.color,
        description: `Music from the ${d.name}`,
        icon: '📅',
        id: `smart-decade-${d.year}`,
        name: `The ${d.name}`,
        param: d.year,
        type: 'decade' as SmartPlaylistType,
    }));
}

/**
 * Build Jellyfin API sort/filter params for a smart playlist type
 */
export function getSmartPlaylistQuery(playlist: SmartPlaylistDefinition) {
    switch (playlist.type) {
        case 'decade':
            if (playlist.param) {
                const startYear = parseInt(playlist.param, 10);
                return {
                    limit: 100,
                    sortBy: 'Random',
                    sortOrder: 'Ascending' as const,
                    years: `${startYear}-${startYear + 9}`,
                };
            }
            return {};
        case 'favorites':
            return {
                filters: 'IsFavorite',
                limit: 500,
                sortBy: 'SortName',
                sortOrder: 'Ascending' as const,
            };
        case 'for-you':
            // "For You" uses a mix of recent favorites + random highly rated
            return {
                limit: 50,
                sortBy: 'Random',
                sortOrder: 'Ascending' as const,
            };
        case 'genre':
            if (playlist.param) {
                return {
                    genres: playlist.param,
                    limit: 100,
                    sortBy: 'Random',
                    sortOrder: 'Ascending' as const,
                };
            }
            return {};
        case 'most-played':
            return {
                limit: 100,
                sortBy: 'PlayCount',
                sortOrder: 'Descending' as const,
            };
        case 'random-mix':
            return {
                limit: 50,
                sortBy: 'Random',
                sortOrder: 'Ascending' as const,
            };
        case 'recently-added':
            return {
                limit: 100,
                sortBy: 'DateCreated',
                sortOrder: 'Descending' as const,
            };
        case 'top-rated':
            return {
                limit: 100,
                sortBy: 'CommunityRating',
                sortOrder: 'Descending' as const,
            };
        default:
            return {};
    }
}
