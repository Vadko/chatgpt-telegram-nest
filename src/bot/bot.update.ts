import { Action, Command, Ctx, Help, On, Start, Update } from 'nestjs-telegraf';
import { TelegrafContext } from '../common/interfaces/telegraf-context.interface';
import { BotService } from './bot.service';
import { concatMap, throttleTime } from 'rxjs';
import telegramifyMarkdown from 'telegramify-markdown';
import { Markup } from 'telegraf';
import { MessageProcessorParams } from './types/message-processor.type';
import { AiModelType } from '../common/types/ai-model.enum';
import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../generated/i18n.generated';
import { I18nTelegraf } from '../common/decorators/i18n-telegraf.decorator';
import { TelegrafExceptionFilter } from '../common/filters/telegraf-exception.filter';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Start()
  async start(@Ctx() ctx: TelegrafContext, @I18nTelegraf() lang: string) {
    await ctx.reply(this.i18n.t('local.WELCOME_MESSAGE', { lang }));
  }

  @Help()
  async help(@Ctx() ctx: TelegrafContext, @I18nTelegraf() lang: string) {
    await ctx.reply(this.i18n.t('local.HELP_MESSAGE', { lang }));
  }

  @Command('select')
  @UseGuards(AuthGuard)
  async selectModel(@Ctx() ctx: TelegrafContext, @I18nTelegraf() lang: string) {
    await ctx.reply(this.i18n.t('local.SELECT_MODEL', { lang }), {
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('💬 ChatGPT', 'select_gpt'),
          Markup.button.callback('🎨 DALL·E', 'select_dalle'),
        ],
      ]),
    });
  }

  @Action('select_gpt')
  async selectChatGPT(
    @Ctx() ctx: TelegrafContext,
    @I18nTelegraf() lang: string,
  ) {
    if (!ctx.callbackQuery?.message) {
      return;
    }

    await ctx.answerCbQuery();

    await this.botService.updateModelSetting(
      ctx.callbackQuery.message.chat.id.toString(),
      AiModelType.GPT,
    );

    await ctx.editMessageText(this.i18n.t('local.SELECTED_CHATGPT', { lang }));
  }

  @Action('select_dalle')
  async selectDallE(@Ctx() ctx: TelegrafContext, @I18nTelegraf() lang: string) {
    if (!ctx.callbackQuery?.message) {
      return;
    }

    await ctx.answerCbQuery();

    await this.botService.updateModelSetting(
      ctx.callbackQuery.message.chat.id.toString(),
      AiModelType.DALLEE,
    );

    await ctx.editMessageText(this.i18n.t('local.SELECTED_DALLE', { lang }));
  }

  @On('photo')
  @UseGuards(AuthGuard)
  async processMessageWithPhoto(
    @Ctx() ctx: TelegrafContext,
    @I18nTelegraf() lang: string,
  ) {
    if (!(ctx.message && 'photo' in ctx.message)) {
      return;
    }

    const image = ctx.message.photo.pop();

    if (!image) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage(
      this.i18n.t('local.PROCESSING_IMAGE', { lang }),
    );

    const link = await ctx.telegram.getFileLink(image);

    if (ctx.user?.model === AiModelType.DALLEE) {
      await ctx.telegram.editMessageText(
        ctx.message.chat.id,
        reply.message_id,
        undefined,
        this.i18n.t('local.DALLE_IMAGE_PROMPT_ERROR', { lang }),
      );
    } else {
      await this.processMessageStream({
        ctx,
        user: ctx.user,
        text:
          ctx.message.caption ??
          this.i18n.t('local.GPT_DEFAULT_IMAGE_CAPTION_PROMPT', { lang }),
        replyId: reply.message_id,
        mediaUrls: [link.href],
      });
    }
  }

  @On('voice')
  @UseGuards(AuthGuard)
  async processAudio(
    @Ctx() ctx: TelegrafContext,
    @I18nTelegraf() lang: string,
  ) {
    if (!(ctx.message && 'voice' in ctx.message)) {
      return;
    }

    const voice = ctx.message.voice;

    if (!voice) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage(
      this.i18n.t('local.TRANSCRIBING_VOICE', { lang }),
    );

    const voiceLink = await ctx.telegram.getFileLink(voice);

    const transcribedVoice = await this.botService.processVoice(voiceLink.href);

    await ctx.telegram.editMessageText(
      ctx.message.chat.id,
      reply.message_id,
      undefined,
      this.i18n.t('local.PROCESSING_VOICE', { lang }),
    );

    await this.processMessageStream({
      ctx,
      user: ctx.user,
      text: transcribedVoice,
      replyId: reply.message_id,
    });
  }

  @On('message')
  @UseGuards(AuthGuard)
  async processMessage(
    @Ctx() ctx: TelegrafContext,
    @I18nTelegraf() lang: string,
  ) {
    if (!(ctx.message && 'text' in ctx.message)) {
      return;
    }

    await ctx.sendChatAction('typing');

    const reply = await ctx.sendMessage(
      this.i18n.t('local.PROCESSING_MESSAGE', { lang }),
    );

    if (ctx.user?.model === AiModelType.DALLEE) {
      await this.processMediaReply({
        ctx,
        user: ctx.user,
        text: ctx.message.text,
        replyId: reply.message_id,
      });
    } else {
      await this.processMessageStream({
        ctx,
        user: ctx.user,
        text: ctx.message.text,
        replyId: reply.message_id,
      });
    }
  }

  async processMessageStream({
    ctx,
    user,
    text,
    replyId,
    mediaUrls,
  }: MessageProcessorParams) {
    if (!ctx.message) {
      return;
    }

    const messageStream$ = await this.botService.processTextStream$({
      user,
      text,
      chatId: ctx.message.chat.id,
      mediaUrls,
    });

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

  async processMediaReply({
    ctx,
    user,
    text,
    replyId,
    mediaUrls,
  }: MessageProcessorParams) {
    if (!ctx.message) {
      return;
    }

    const imageUrl = await this.botService.processMediaRequest({
      user,
      text,
      chatId: ctx.message.chat.id,
      mediaUrls,
    });

    await ctx.telegram.editMessageMedia(
      ctx.message.chat.id,
      replyId,
      undefined,
      { type: 'photo', media: imageUrl },
    );
  }
}
