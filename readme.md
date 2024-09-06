# YouTube Tools

YouTube Tools is a simple command-line interface (CLI) application that lets you download YouTube videos and audio in the highest quality. The tool supports saving the video and audio streams separately and merging them.

## Features

- Download video and audio streams from YouTube.
- Merge video and audio into a single file.
- CLI-friendly and configurable with various options.

## Installation

To install the package globally using npm, run the following command:

```bash
npm install -g youtube-tools
```

## Usage

Once installed, you can use the CLI tool by running the following command:

```bash
youtube-tools <YouTube-URL> -o <output-file> [options]
```

### Examples

- **Download a YouTube video and merge video/audio into `output.mp4`:**

  ```bash
  youtube-tools https://www.youtube.com/watch?v=1Kvb7gWZOcY -o output.mp4
  ```

- **Download a YouTube video:**

  ```bash
  youtube-tools https://www.youtube.com/watch?v=1Kvb7gWZOcY -o output.mp4
  ```

### Options

- `-o, --output <file>`: Output file path for the merged video and audio.

## Requirements

Before using this tool, make sure you have the following dependencies installed:

- **Node.js** (>= 12.x)
- **FFmpeg** (required for merging video and audio)

### FFmpeg Installation

To install FFmpeg:

- On macOS:  
  ```bash
  brew install ffmpeg
  ```

- On Ubuntu:  
  ```bash
  sudo apt-get install ffmpeg
  ```

- On Windows:  
  Download from the [official FFmpeg website](https://ffmpeg.org/download.html).

## Development

If you want to contribute or run the tool locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/episage/youtube-tools.git
   cd youtube-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the tool:
   ```bash
   node index.js <YouTube-URL> -o <output-file> [options]
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
