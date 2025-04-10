import {
  Action,
  Command,
  Ctx,
  TelegrafException,
  Update,
} from 'nestjs-telegraf';
import { AdminTelegrafContext } from '../common/interfaces/telegraf-context.interface';
import { AdminBotService } from './admin-bot.service';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../generated/i18n.generated';
import { APPROVE_REGEX, BLOCK_REGEX } from '../common/helpers/admin-regex';
import { UseFilters, UseGuards } from '@nestjs/common';
import { TelegrafExceptionFilter } from '../common/filters/telegraf-exception.filter';
import { AdminGuard } from '../common/guards/admin.guard';
import { CommandContextExtn } from 'telegraf/src/telegram-types';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class AdminBotUpdate {
  constructor(
    private readonly adminBotService: AdminBotService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Action(APPROVE_REGEX)
  async approveAction(@Ctx() ctx: AdminTelegrafContext) {
    if (!(ctx.callbackQuery?.message && 'data' in ctx.callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const id = ctx.callbackQuery.data.match(APPROVE_REGEX)?.[1];
    const username = ctx.callbackQuery.data.match(APPROVE_REGEX)?.[2];
    const isGroup = ctx.callbackQuery.data.match(APPROVE_REGEX)?.[3] === 'true';

    if (!id || !username) {
      throw new TelegrafException('Not found id or username');
    }

    await this.adminBotService.approveUser(id);

    await ctx.editMessageText(
      this.i18n.t(
        isGroup ? 'admin.APPROVED_MESSAGE_GROUP' : 'admin.APPROVED_MESSAGE',
        {
          args: { username },
        },
      ),
    );
  }

  @Action(BLOCK_REGEX)
  async blockAction(@Ctx() ctx: AdminTelegrafContext) {
    if (!(ctx.callbackQuery?.message && 'data' in ctx.callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const id = ctx.callbackQuery.data.match(BLOCK_REGEX)?.[1];
    const username = ctx.callbackQuery.data.match(BLOCK_REGEX)?.[2];
    const isGroup = ctx.callbackQuery.data.match(APPROVE_REGEX)?.[3] === 'true';

    if (!id || !username) {
      throw new TelegrafException('Not found id or username');
    }

    await this.adminBotService.blockUser(id);

    await ctx.editMessageText(
      this.i18n.t(
        isGroup ? 'admin.BLOCKED_MESSAGE_GROUP' : 'admin.BLOCKED_MESSAGE',
        {
          args: { username },
        },
      ),
    );
  }

  @Command('block')
  @UseGuards(AdminGuard)
  async blockUser(@Ctx() ctx: CommandContextExtn) {
    await this.adminBotService.blockUser(ctx.payload);
  }

  @Command('approve')
  @UseGuards(AdminGuard)
  async approveUser(@Ctx() ctx: CommandContextExtn) {
    await this.adminBotService.approveUser(ctx.payload);
  }
}
