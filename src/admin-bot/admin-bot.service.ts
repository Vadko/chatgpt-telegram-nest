import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import {
  AdminTelegrafContext,
  ClientTelegrafContext,
} from '../common/interfaces/telegraf-context.interface';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../generated/i18n.generated';
import { UserService } from '../user/user.service';
import { UserStatus } from '../common/types/user-status.enum';

@Injectable()
export class AdminBotService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly i18n: I18nService<I18nTranslations>,
    @InjectBot('admin') private adminBot: Telegraf<AdminTelegrafContext>,
    @InjectBot('client') private clientBot: Telegraf<ClientTelegrafContext>,
  ) {}

  async sendToReview(id: string, isGroup: boolean, username: string) {
    await this.adminBot.telegram.sendMessage(
      this.configService.getOrThrow('TELEGRAM_ADMIN_ID'),
      this.i18n.t(
        isGroup ? 'admin.VERIFY_REQUEST_GROUP' : 'admin.VERIFY_REQUEST',
        { args: { username, id } },
      ),
      {
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              this.i18n.t('admin.APPROVE_USER'),
              `approve:${id}:${username}:${isGroup}`,
            ),
            Markup.button.callback(
              this.i18n.t('admin.BLOCK_USER'),
              `block:${id}:${username}:${isGroup}`,
            ),
          ],
        ]),
      },
    );
  }

  async blockUser(id: string) {
    await this.userService.updateVerificationStatus(id, UserStatus.Blocked);
  }

  async approveUser(id: string) {
    const user = await this.userService.getByIdOrThrow(id);
    await this.userService.updateVerificationStatus(id, UserStatus.Verified);
    await this.clientBot.telegram.sendMessage(
      id,
      this.i18n.t('client.APPROVAL_CONGRATS', { lang: user.lang }),
    );
  }
}
