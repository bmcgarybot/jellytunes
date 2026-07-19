# 🎵 JellyTunes

**An Apple Music-inspired music player for your Jellyfin library.**

JellyTunes brings Apple Music-level polish to your self-hosted Jellyfin music collection. Built on the excellent [Feishin](https://github.com/jeffvli/feishin) foundation, it adds metadata enrichment, smart playlists, a "For You" discovery section, and full PWA support.

![License](https://img.shields.io/badge/license-GPL--3.0-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop%20%7C%20PWA-brightgreen)

---

## ✨ Features

### 🎯 What Makes JellyTunes Special

| Feature | Description |
|---------|-------------|
| **🔍 Metadata Enrichment** | Auto-fetch artist bios, genres, similar artists, high-res images from MusicBrainz, Last.fm, and Fanart.tv |
| **💎 "For You" Section** | Personalized discovery with smart playlists — Recently Added, Most Played, Top Rated, Random Mix |
| **📅 Browse by Decade** | Auto-generated decade playlists (60s through 2020s) |
| **🎸 Genre Browsing** | Visual genre grid with auto-generated playlists |
| **📱 PWA Support** | Install as a native app on mobile and desktop from any browser |
| **🐳 Docker Ready** | Single `docker-compose.yaml` deploys JellyTunes alongside Jellyfin |

### 🎵 Inherited from Feishin

- Synced lyrics with animated display
- Audio visualizer (multiple modes)
- Discord Rich Presence
- Last.fm / ListenBrainz scrobbling
- Smart queue & Auto DJ
- Tag editor
- Customizable themes
- Radio station support
- Keyboard shortcuts
- Multi-server support (Jellyfin, Navidrome, Subsonic)
- Desktop app (Electron + MPV backend)

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/bmcgarybot/jellytunes.git
cd jellytunes

# Optional: Add API keys for metadata enrichment
export LASTFM_API_KEY=your_lastfm_key
export FANART_TV_API_KEY=your_fanart_key

docker compose up -d
```

JellyTunes will be available at `http://localhost:9180`.

### Docker (Web Only — BYO Jellyfin)

```yaml
services:
    jellytunes:
        container_name: jellytunes
        build: .
        restart: unless-stopped
        environment:
            - SERVER_NAME=jellyfin
            - SERVER_LOCK=true
            - SERVER_TYPE=jellyfin
            - SERVER_URL=http://your-jellyfin:8096
            - LASTFM_API_KEY=your_key_here
            - FANART_TV_API_KEY=your_key_here
        ports:
            - "9180:9180"
```

### Development

```bash
git clone https://github.com/bmcgarybot/jellytunes.git
cd jellytunes
pnpm install

# Web development
pnpm run dev:web       # Not available yet — use build:web
pnpm run build:web     # Build web version

# Desktop development
pnpm run dev           # Electron dev mode
pnpm run build         # Build desktop + remote
```

---

## 🔍 Metadata Enrichment

JellyTunes' killer feature is automatic metadata enrichment. It fetches rich data from multiple sources to give your personal library an Apple Music-level experience:

### Sources

| Provider | Data | API Key Required? |
|----------|------|-------------------|
| **MusicBrainz** | Genres, tags, release dates, cover art, MBIDs | ❌ Free, no key needed |
| **Last.fm** | Artist bios, similar artists, play stats, tags | ✅ [Free key](https://www.last.fm/api/account/create) |
| **Fanart.tv** | HD artist backgrounds, thumbnails, logos, banners | ✅ [Free key](https://fanart.tv/get-an-api-key/) |
| **Cover Art Archive** | High-quality album art | ❌ Free, no key needed |

### Configuration

1. Go to **Settings → Metadata Enrichment** in JellyTunes
2. Enter your API keys (or set via Docker environment variables)
3. MusicBrainz works out of the box — no configuration needed

---

## 💎 Smart Playlists & "For You"

JellyTunes auto-generates smart playlists from your Jellyfin library:

- **✨ Recently Added** — Fresh additions to your library
- **🔥 Most Played** — Your all-time favorites by play count
- **⭐ Top Rated** — Highest rated tracks
- **❤️ Favorites** — All your liked songs
- **🎲 Random Mix** — A fresh random selection
- **💎 For You** — Personalized recommendations
- **📅 Decades** — 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s
- **🎸 Genres** — Auto-detected from your library

---

## 📱 PWA (Progressive Web App)

JellyTunes is installable as a PWA from any modern browser:

1. Open JellyTunes in Chrome/Edge/Safari
2. Click "Install" in the browser's address bar (or Add to Home Screen on mobile)
3. JellyTunes runs as a standalone app with offline caching

Works great on phones and tablets for a native app-like experience without an app store.

---

## 🏗 Architecture

```
jellytunes/
├── src/
│   ├── renderer/              # React web UI
│   │   ├── features/
│   │   │   ├── metadata-enrichment/   # 🆕 MusicBrainz/Last.fm/Fanart.tv
│   │   │   │   ├── api/              # API clients for each provider
│   │   │   │   ├── components/       # ArtistBioPanel, MetadataSettings
│   │   │   │   ├── hooks/            # useArtistMetadata, useAlbumMetadata
│   │   │   │   └── types/            # TypeScript interfaces
│   │   │   ├── smart-playlists/       # 🆕 For You, Decades, Genres
│   │   │   │   ├── components/       # ForYouSection
│   │   │   │   └── utils/            # Smart playlist definitions
│   │   │   ├── albums/               # Album browsing
│   │   │   ├── artists/              # Artist browsing
│   │   │   ├── lyrics/               # Synced lyrics
│   │   │   ├── now-playing/          # Full-screen player
│   │   │   ├── player/               # Audio playback
│   │   │   └── ...                   # All Feishin features
│   │   └── ...
│   ├── main/                  # Electron main process
│   └── shared/                # Shared utilities
├── Dockerfile                 # Web deployment
├── docker-compose.yaml        # Full stack (JellyTunes + Jellyfin)
└── web.vite.config.ts         # PWA configuration
```

---

## 🙏 Credits

JellyTunes is built on the shoulders of these excellent projects:

- **[Feishin](https://github.com/jeffvli/feishin)** — The primary codebase. An incredible music player by [@jeffvli](https://github.com/jeffvli).
- **[Jelly Music App](https://github.com/Stannnnn/jelly-app)** — PWA approach and clean UI inspiration.
- **[Fintunes](https://github.com/leinelissen/jellyfin-audio-player)** — Mobile features inspiration (AirPlay, Chromecast, offline caching).

### Metadata Providers
- [MusicBrainz](https://musicbrainz.org/) — Open music encyclopedia
- [Last.fm](https://www.last.fm/) — Music discovery and scrobbling
- [Fanart.tv](https://fanart.tv/) — High-quality music artwork
- [Cover Art Archive](https://coverartarchive.org/) — Album cover art

---

## 📄 License

GPL-3.0 — See [LICENSE](LICENSE) for details.

Based on Feishin, which is also GPL-3.0 licensed.
