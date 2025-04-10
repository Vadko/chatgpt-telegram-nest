import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { BotModule } from './bot/bot.module';
import { HealthModule } from './health/health.module';
import { OpenaiModule } from './openai/openai.module';
import { I18nModule } from 'nestjs-i18n';
import { AdminBotModule } from './admin-bot/admin-bot.module';
import path from 'path';
import { ClientTelegrafContext } from './common/interfaces/telegraf-context.interface';
import { UserService } from './user/user.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, UserModule],
      inject: [ConfigService, UserService],
      botName: 'client',
      useFactory: (configService: ConfigService, userService: UserService) => {
        return {
          token: configService.getOrThrow('TELEGRAM_BOT_TOKEN'),
          include: [BotModule],
          middlewares: [
            async (ctx: ClientTelegrafContext, next) => {
              if (ctx.message) {
                ctx.user = await userService.getById(
                  ctx.message.chat.id.toString(),
                );
              }

              return await next();
            },
          ],
        };
      },
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      botName: 'admin',
      useFactory: (configService: ConfigService) => {
        return {
          token: configService.getOrThrow('TELEGRAM_ADMIN_BOT_TOKEN'),
          include: [AdminBotModule],
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      disableMiddleware: true,
      typesOutputPath: path.join(
        __dirname,
        '../src/generated/i18n.generated.ts',
      ),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('STAGE') === 'prod';

        return {
          autoLoadEntities: true,
          type: 'postgres',
          host: configService.getOrThrow('DB_HOST'),
          port: configService.getOrThrow('DB_PORT'),
          database: configService.getOrThrow('DB_NAME'),
          username: configService.getOrThrow('DB_USERNAME'),
          password: configService.getOrThrow('DB_PASSWORD'),
          ssl: isProduction,
          synchronize: !isProduction,
        };
      },
    }),
    UserModule,
    BotModule,
    HealthModule,
    OpenaiModule,
    AdminBotModule,
  ],
})
export class AppModule {}
