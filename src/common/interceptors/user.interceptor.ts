import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { ClientTelegrafContext } from '../interfaces/telegraf-context.interface';
import { UserService } from '../../user/user.service';

@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UserService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const ctx =
      TelegrafExecutionContext.create(
        context,
      ).getContext<ClientTelegrafContext>();

    if (ctx.message) {
      ctx.user = await this.usersService.getById(
        ctx.message.chat.id.toString(),
      );
    }

    return next.handle();
  }
}
