# yt-music-downloader

🎧 CLI tool to download songs from YouTube Music in MP3 format, with rich ID3 metadata 🏷️: artist, album, title, and cover art.

## How to Use

#### 1. **Install the tool** (if not already done):

```bash
npm link
```

#### 2. **Download a song** by providing the YouTube Music URL:

```bash
Usage: yt-music-downloader [options] [command]

CLI to download music from YouTube Music

Options:
  -V, --version             output the version number
  -h, --help                display help for command

Commands:
  search <query>            Search for tracks on YouTube Music by query
  download [options] <url>  Download a track by URL
  help [command]            display help for command
```

Examples:

```bash
ytd search "As it was - Harry Styles"
```

```bash
ytd download "https://music.youtube.com/watch?v=example_song_id"
```

```bash
ytd download --playlist "https://music.youtube.com/playlist?list=example_playlist_id"
```

The song will be downloaded to the default output folder with proper metadata.
