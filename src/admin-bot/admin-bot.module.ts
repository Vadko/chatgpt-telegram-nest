import { Module } from '@nestjs/common';
import { AdminBotService } from './admin-bot.service';
import { AdminBotUpdate } from './admin-bot.update';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [AdminBotService, AdminBotUpdate],
  exports: [AdminBotUpdate, AdminBotService],
})
export class AdminBotModule {}
