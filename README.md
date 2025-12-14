# 🎵 yt-music-downloader

> 🚀 CLI tool to download songs from YouTube Music in medium-quality MP3 format with rich ID3 metadata

Download your favorite tracks from YouTube Music with automatic metadata enrichment including artist, album, title, and cover art 🎨

## ✨ Features

- 🎧 **High-quality audio** - Download tracks in MP3 format with optimal bitrate
- 🏷️ **Rich metadata** - Automatic ID3 tags: artist, album, title, year, and more
- 🖼️ **Album artwork** - Embedded cover art in high resolution
- 🔍 **Search functionality** - Find tracks directly from the CLI
- 📦 **Playlist support** - Download entire playlists with a single command

## 📋 Requirements

- Node.js (v18 or higher)
- npm or yarn
- FFmpeg (included via ffmpeg-static)

## 🔧 Installation

### Option 1: Install globally via npm link

```bash
# Clone the repository
git clone https://github.com/yourusername/yt-music-downloader.git
cd yt-music-downloader

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### Option 2: Run directly with npm

```bash
npm install
npm run build
npm start -- search "your query"
```

## 🚀 Usage

Once installed, use the `ytd` command:

### 📖 Available Commands

```bash
ytd [options] [command]

CLI to download music from YouTube Music

Options:
  -V, --version             Output the version number
  -h, --help                Display help for command

Commands:
  search <query>            Search for tracks on YouTube Music
  download [options] <url>  Download a track or playlist
  help [command]            Display help for command
```

## 💡 Examples

### 🔍 Search for a track

```bash
ytd search "As it was - Harry Styles"
```

This will display a list of matching tracks with their details.

### ⬇️ Download a single track

```bash
ytd download "https://music.youtube.com/watch?v=example_song_id"
```

The track will be saved to the default output folder with complete metadata.

### 📦 Download an entire playlist

```bash
ytd download --playlist "https://music.youtube.com/playlist?list=example_playlist_id"
```

All tracks from the playlist will be downloaded sequentially with their metadata.

## 📁 Output Structure

Downloaded tracks are saved with the following naming convention:

```
📂 output/
  ├── 🎵 Artist - Track Name.mp3
  ├── 🎵 Another Artist - Song Title.mp3
  └── ...
```

Each file includes:

- ✅ Artist name
- ✅ Track title
- ✅ Album name
- ✅ Release year
- ✅ Cover artwork (embedded)

## 🛠️ Development

### Scripts

```bash
# Build the project
npm run build

# Watch mode (development)
npm run dev

# Run linter
npm run lint:check

# Fix linting issues
npm run lint:fix

# Start the application
npm start
```

### Tech Stack

- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework
- **Inquirer** - Interactive prompts
- **youtubei.js** - YouTube Music API wrapper
- **FFmpeg** - Audio conversion
- **Sharp** - Image processing
- **node-id3** - ID3 metadata writer
- **Chalk** - Terminal styling

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters) principles:

```
📂 src/
  ├── 🎯 application/     - Use cases & business logic
  ├── 🔷 domain/          - Domain models & value objects
  ├── 🔌 infrastructure/  - External adapters (CLI, YouTube, FFmpeg)
  └── 🚀 bootstrap/       - Dependency injection container
```

## 📄 License

This project is licensed under the **GPL-3.0-or-later** License.

## ⚠️ Disclaimer

This tool is for **personal use only**. Please respect copyright laws and YouTube's Terms of Service. Only download content you have the right to download.

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

<div align="center" style="margin-top: 10px;">
  Made with ❤️ and TypeScript
</div>
