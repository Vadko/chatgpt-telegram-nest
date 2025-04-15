import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { ClientTelegrafContext } from '../interfaces/telegraf-context.interface';

export const I18nTelegraf = createParamDecorator(
  (_, context: ExecutionContext) => {
    const ctx =
      TelegrafExecutionContext.create(
        context,
      ).getContext<ClientTelegrafContext>();

    if (ctx.user) {
      return ctx.user.lang;
    }

    return (
      ctx.message?.from.language_code ??
      ctx.callbackQuery?.from.language_code ??
      'en'
    );
  },
);
