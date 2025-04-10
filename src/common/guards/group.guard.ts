import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telegraf';
import { ClientTelegrafContext } from '../interfaces/telegraf-context.interface';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class GroupGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const ctx =
      TelegrafExecutionContext.create(
        context,
      ).getContext<ClientTelegrafContext>();

    switch (ctx.message?.chat.type) {
      case 'private':
        return true;
      case 'group':
      case 'supergroup':
        if (
          'text' in ctx.message &&
          ctx.message.text.includes(
            `@${this.configService.getOrThrow('TELEGRAM_BOT_USERNAME')}`,
          )
        ) {
          return true;
        }

        if (
          'caption' in ctx.message &&
          ctx.message.caption?.includes(
            `@${this.configService.getOrThrow('TELEGRAM_BOT_USERNAME')}`,
          )
        ) {
          return true;
        }

        throw new TelegrafException();

      default:
        throw new TelegrafException();
    }
  }
}
