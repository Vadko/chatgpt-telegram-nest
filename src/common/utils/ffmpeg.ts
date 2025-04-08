import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg, { setFfmpegPath } from 'fluent-ffmpeg';

setFfmpegPath(ffmpegPath);

export const convertOggToMp3 = async (
  inputPath: string,
  outputPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat('mp3')
      .on('end', () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      })
      .save(outputPath);
  });
};
