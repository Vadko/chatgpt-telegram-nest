import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telegraf';
import { ClientTelegrafContext } from '../interfaces/telegraf-context.interface';
import { UserService } from '../../user/user.service';
import { UserStatus } from '../types/user-status.enum';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../../generated/i18n.generated';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UserService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx =
      TelegrafExecutionContext.create(
        context,
      ).getContext<ClientTelegrafContext>();

    if (!ctx.message) {
      return false;
    }

    const user = await this.usersService.getById(
      ctx.message.chat.id.toString(),
    );

    const fallbackLang = ctx.message.from.language_code ?? 'en';

    ctx.user = user;

    switch (ctx.user?.status) {
      case UserStatus.Verified:
        return true;
      case UserStatus.Unverified:
        throw new TelegrafException(
          this.i18n.t('client.UNVERIFIED_ERROR', {
            lang: user?.lang ?? fallbackLang,
          }),
        );
      case UserStatus.Reviewing:
        throw new TelegrafException(
          this.i18n.t('client.ACCOUNT_UNDER_REVIEW', {
            lang: user?.lang ?? fallbackLang,
          }),
        );
      case UserStatus.Blocked:
        throw new TelegrafException();
      default:
        throw new TelegrafException(
          this.i18n.t('client.UNVERIFIED_ERROR', {
            lang: user?.lang ?? fallbackLang,
          }),
        );
    }
  }
}
