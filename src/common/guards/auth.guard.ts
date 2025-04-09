import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { UserService } from '../../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx =
      TelegrafExecutionContext.create(context).getContext<TelegrafContext>();

    if (!ctx.message) {
      return false;
    }

    const user = await this.usersService.getById(
      ctx.message.chat.id.toString(),
    );

    ctx.user = user;

    return true;
  }
}
