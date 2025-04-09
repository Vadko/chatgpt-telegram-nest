import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';

export const I18nTelegraf = createParamDecorator(
  (_, ctx: ExecutionContext) =>
    TelegrafExecutionContext.create(ctx).getContext<TelegrafContext>().message
      ?.from.language_code ?? 'en',
);
