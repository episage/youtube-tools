#!/usr/bin/env node

import { Command } from 'commander';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Commander setup
const program = new Command();

// Helper function to create a unique temp directory
function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `youtube-tools-run-${uuidv4()}`);
  fs.mkdirSync(tempDir);
  return tempDir;
}

// Helper function to clean up temp files
function cleanUp(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
}

// Function to download video and audio separately with extra error handling
async function downloadVideoAndAudio(url, videoOutput, audioOutput) {
  try {
    // Initialize streams for video and audio
    const videoStream = ytdl(url, { quality: 'highestvideo' });
    const audioStream = ytdl(url, { quality: 'highestaudio' });

    const videoFile = fs.createWriteStream(videoOutput);
    const audioFile = fs.createWriteStream(audioOutput);

    // Set up error handling for video and audio streams
    videoStream.on('error', (err) => {
      console.error(`Error in video stream: ${err.message}`);
      videoFile.destroy(); // Destroy the file stream if an error occurs
      throw new Error('Video stream download failed.');
    });

    audioStream.on('error', (err) => {
      console.error(`Error in audio stream: ${err.message}`);
      audioFile.destroy(); // Destroy the file stream if an error occurs
      throw new Error('Audio stream download failed.');
    });

    // Set up error handling for file write streams
    videoFile.on('error', (err) => {
      console.error(`Error writing video file: ${err.message}`);
      throw new Error('Video file write failed.');
    });

    audioFile.on('error', (err) => {
      console.error(`Error writing audio file: ${err.message}`);
      throw new Error('Audio file write failed.');
    });

    // Pipe the streams to the file outputs
    videoStream.pipe(videoFile);
    audioStream.pipe(audioFile);

    // Await completion of both file writes with proper error handling
    await Promise.all([
      new Promise((resolve, reject) => {
        videoFile.on('finish', resolve);
        videoFile.on('error', reject);
      }),
      new Promise((resolve, reject) => {
        audioFile.on('finish', resolve);
        audioFile.on('error', reject);
      })
    ]);

    console.error('Video and audio downloaded successfully.');
  } catch (error) {
    console.error('Error during download:', error.message);
    // Clean up any partially written files
    if (fs.existsSync(videoOutput)) fs.unlinkSync(videoOutput);
    if (fs.existsSync(audioOutput)) fs.unlinkSync(audioOutput);
    throw error; // Rethrow the error to allow higher-level handling
  }
}

// Function to determine the output format based on file extension
function getFormatFromExtension(outputFilePath) {
  const ext = path.extname(outputFilePath).toLowerCase();

  if (ext === '.mp4') {
    return 'mp4';
  } else if (ext === '.mov') {
    return 'mov';
  } else {
    throw new Error(`Unsupported file extension: ${ext}. Only .mp4 and .mov are supported.`);
  }
}

// Function to merge video and audio into a single file
function mergeVideoAndAudioToFile(videoOutput, audioOutput, outputFilePath, format) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = ffmpeg()
      .input(videoOutput)
      .input(audioOutput)
      .videoCodec('copy') // Copy the original video codec
      .audioCodec('aac')  // Ensure that audio is encoded with AAC
      .format(format)     // Output format (mp4 or mov)
      .output(outputFilePath) // Write to specified output file
      .on('stderr', (stderrLine) => {
        console.error('FFmpeg stderr:', stderrLine);
      })
      .on('end', () => {
        console.error(`Merged video and audio into ${outputFilePath} successfully!`);
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
  .description('A tool to download YouTube videos, audios and save them to a file.')
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output <file>', 'Output file path for the merged video and audio', 'output.mp4')
  .action(async (url, options) => {
    const { output } = options;

    const tempDir = createTempDir(); // Create unique temporary directory
    console.error(`Working directory: ${tempDir}`);
    const videoOutput = path.join(tempDir, 'video.mp4');
    const audioOutput = path.join(tempDir, 'audio.mp3');
    const finalOutput = output;

    try {
      // Determine format based on the file extension
      const format = getFormatFromExtension(output);

      console.error(`Downloading from: ${url}`);
      await downloadVideoAndAudio(url, videoOutput, audioOutput);

      console.error(`Merging video and audio to: ${finalOutput}`);
      await mergeVideoAndAudioToFile(videoOutput, audioOutput, finalOutput, format);

      // Clean up temp files
      cleanUp(tempDir);
    } catch (error) {
      console.error('Error:', error);
      // Clean up in case of error
      cleanUp(tempDir);
    }
  });

// Parse and execute CLI input
program.parse(process.argv);
