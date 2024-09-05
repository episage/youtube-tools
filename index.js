#!/usr/bin/env node

const { Command } = require('commander');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Commander setup
const program = new Command();

// Function to download video and audio separately
async function downloadVideoAndAudio(url, videoOutput, audioOutput) {
  try {
    // Download video and audio streams
    const videoStream = ytdl(url, { quality: 'highestvideo' });
    const audioStream = ytdl(url, { quality: 'highestaudio' });

    const videoFile = fs.createWriteStream(videoOutput);
    const audioFile = fs.createWriteStream(audioOutput);

    videoStream.pipe(videoFile);
    audioStream.pipe(audioFile);

    await Promise.all([
      new Promise((resolve) => videoFile.on('finish', resolve)),
      new Promise((resolve) => audioFile.on('finish', resolve)),
    ]);

    console.log('Video and audio downloaded successfully.');
  } catch (error) {
    console.error('Error downloading video/audio:', error);
  }
}

// Function to merge video and audio into a single file and output to stdout
function mergeVideoAndAudioToStdout(videoOutput, audioOutput) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = ffmpeg()
      .input(videoOutput)
      .input(audioOutput)
      .format('mp4')
      .output(process.stdout)
      .on('end', () => {
        console.log('Merged video and audio and sent to stdout successfully!');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error merging video and audio:', err);
        reject(err);
      });

    ffmpegProcess.run();
  });
}

// Define the command-line interface using commander
program
  .name('youtube-tools')
  .version('1.0.0')
  .description('A tool to download YouTube videos and audios at the highest quality and output to stdout.')
  .argument('<url>', 'YouTube video URL')
  .action(async (url) => {
    // Check if the output is piped
    if (!process.stdout.isTTY) {
      const outputDir = './tmp'; // Temporary directory for intermediate files
      const videoOutput = path.join(outputDir, 'video.mp4');
      const audioOutput = path.join(outputDir, 'audio.mp3');

      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      try {
        console.error(`Downloading from: ${url}`);
        await downloadVideoAndAudio(url, videoOutput, audioOutput);

        console.error('Merging video and audio...');
        await mergeVideoAndAudioToStdout(videoOutput, audioOutput);

        // Clean up temporary files after the process
        fs.unlinkSync(videoOutput);
        fs.unlinkSync(audioOutput);
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      console.error('Error: No output pipe detected. Please pipe the output to a file or another process.');
      process.exit(1);
    }
  });

// Parse and execute CLI input
program.parse(process.argv);
