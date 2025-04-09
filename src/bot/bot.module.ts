import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { BotUpdate } from './bot.update';
import { OpenaiModule } from '../openai/openai.module';
import { BotService } from './bot.service';

@Module({
  imports: [UserModule, OpenaiModule],
  providers: [BotService, BotUpdate],
  exports: [BotUpdate],
})
export class BotModule {}
