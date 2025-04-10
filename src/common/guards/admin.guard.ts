import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telegraf';
import { ClientTelegrafContext } from '../interfaces/telegraf-context.interface';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const ctx =
      TelegrafExecutionContext.create(
        context,
      ).getContext<ClientTelegrafContext>();

    if (
      ctx.message?.from.id.toString() !==
      this.configService.getOrThrow('TELEGRAM_ADMIN_ID')
    ) {
      throw new TelegrafException('You are not a admin');
    }

    return true;
  }
}
