import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { TelegrafContext } from '../common/interfaces/telegraf-context.interface';
import { BotService } from './bot.service';
import { concatMap, throttleTime } from 'rxjs';
import telegramifyMarkdown from 'telegramify-markdown';

@Update()
export class BotInstance {
  constructor(private readonly botService: BotService) {}

  async processMessageStream(
    ctx: TelegrafContext,
    text: string,
    replyId: number,
    mediaUrls?: string[],
  ) {
    if (!ctx.message) {
      return;
    }

    const messageStream$ = await this.botService.processMessage$(
      text,
      ctx.message.chat.id,
      mediaUrls,
    );

    messageStream$
      .pipe(
        throttleTime(2000, undefined, { leading: true, trailing: true }),
        concatMap(async (message) => {
          await ctx.telegram.editMessageText(
            ctx.message!.chat.id,
            replyId,
            undefined,
            telegramifyMarkdown(message, 'remove'),
            { parse_mode: 'MarkdownV2' },
          );
          await ctx.sendChatAction('typing');
        }),
      )
      .subscribe();
  }

  @Start()
  async start(ctx: TelegrafContext) {
    await ctx.reply('Welcome to the bot! Please select an option:');
  }

  @On('photo')
  async processMessageWithPhoto(@Ctx() ctx: TelegrafContext) {
    if (!(ctx.message && 'photo' in ctx.message)) {
      return;
    }

    const image = ctx.message.photo.pop();

    if (!image) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage('Processing your image...');

    const link = await ctx.telegram.getFileLink(image);

    await this.processMessageStream(
      ctx,
      ctx.message.caption ?? 'describe this photo',
      reply.message_id,
      [link.href],
    );
  }

  @On('voice')
  async processAudio(@Ctx() ctx: TelegrafContext) {
    if (!(ctx.message && 'voice' in ctx.message)) {
      return;
    }

    const voice = ctx.message.voice;

    if (!voice) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage('Listening to your voice message...');

    const voiceLink = await ctx.telegram.getFileLink(voice);

    const transcribedVoice = await this.botService.processVoice(voiceLink.href);

    await ctx.telegram.editMessageText(
      ctx.message.chat.id,
      reply.message_id,
      undefined,
      'Listened your voice! Preparing reply for you...',
    );

    await this.processMessageStream(ctx, transcribedVoice, reply.message_id);
  }

  @On('message')
  async processMessage(@Ctx() ctx: TelegrafContext) {
    if (!(ctx.message && 'text' in ctx.message)) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage('Processing your message...');

    await this.processMessageStream(ctx, ctx.message.text, reply.message_id);
  }
}
