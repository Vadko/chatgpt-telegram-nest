import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Readable } from 'stream';
import * as fs from 'fs';
import path from 'path';
import { convertOggToMp3 } from '../common/utils/ffmpeg';
import {
  ResponseInputImage,
  ResponseInputMessageContentList,
} from 'openai/resources/responses/responses';
import { TelegrafException } from 'nestjs-telegraf';

@Injectable()
export class OpenaiService {
  private readonly client: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  async processMediaRequest(prompt: string, _mediaUrls?: string[]) {
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const url = response.data[0].url;

    if (url) {
      return url;
    } else {
      throw new TelegrafException('Not able to generate image');
    }
  }

  async processMessage(
    message: string,
    conversationId?: string | null,
    mediaUrls?: string[],
  ) {
    const content: string | ResponseInputMessageContentList = !mediaUrls
      ? message
      : [
          {
            type: 'input_text',
            text: message,
          },
          ...mediaUrls.map(
            (url) =>
              ({
                type: 'input_image',
                image_url: url,
              }) as ResponseInputImage,
          ),
        ];

    return this.client.responses.create({
      model: 'gpt-4o',
      previous_response_id: conversationId,
      truncation: 'auto',
      input: [
        {
          role: 'user',
          content,
        },
      ],
      stream: true,
    });
  }

  getAudioPath(uuid: string, extension: string) {
    if (!fs.existsSync(this.configService.getOrThrow('AUDIO_CACHE_DIR'))) {
      fs.mkdirSync(this.configService.getOrThrow('AUDIO_CACHE_DIR'));
    }

    return path.join(
      this.configService.getOrThrow('AUDIO_CACHE_DIR'),
      `${uuid}.${extension}`,
    );
  }

  async processAudio(audioUrl: string) {
    const uuidFilename = crypto.randomUUID();
    const response = await this.httpService.axiosRef<Readable>({
      url: audioUrl,
      method: 'GET',
      responseType: 'stream',
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(
          this.getAudioPath(uuidFilename, 'ogg'),
        );

        response.data.pipe(writeStream);

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      await convertOggToMp3(
        this.getAudioPath(uuidFilename, 'ogg'),
        this.getAudioPath(uuidFilename, 'mp3'),
      );

      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(this.getAudioPath(uuidFilename, 'mp3')),
        model: 'gpt-4o-transcribe',
      });

      return transcription.text;
    } finally {
      fs.unlinkSync(this.getAudioPath(uuidFilename, 'ogg'));
      fs.unlinkSync(this.getAudioPath(uuidFilename, 'mp3'));
    }
  }
}

// return this.client.images.generate({
//   model: 'dall-e-3',
//   response_format: 'url',
//   prompt: message,
//   n: 1,
//   size: '1024x1024',
// });
