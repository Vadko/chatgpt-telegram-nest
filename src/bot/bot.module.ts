import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { BotInstance } from './bot.instance';
import { OpenaiModule } from '../openai/openai.module';
import { BotService } from './bot.service';

@Module({
  imports: [UserModule, OpenaiModule],
  providers: [BotService, BotInstance],
  exports: [BotInstance],
})
export class BotModule {}
