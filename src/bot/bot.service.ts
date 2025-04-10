import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { OpenaiService } from '../openai/openai.service';
import { filter, from, scan, tap } from 'rxjs';
import { PromptProcessorParams } from './types/prompt-processor.type';
import { AiModelType } from '../common/types/ai-model.enum';
import { AdminBotService } from '../admin-bot/admin-bot.service';
import { UserStatus } from '../common/types/user-status.enum';
import { VerificationParams } from './types/verification-params';
import { ChatType } from '../common/types/chat-type.enum';

@Injectable()
export class BotService {
  constructor(
    private readonly userService: UserService,
    private readonly openAiService: OpenaiService,
    private readonly adminBotService: AdminBotService,
  ) {}

  async sendToVerification({
    id,
    username,
    lang,
    isGroup,
  }: VerificationParams) {
    await this.userService.create(
      id,
      isGroup ? ChatType.Group : ChatType.Private,
      lang,
    );
    await this.userService.updateVerificationStatus(id, UserStatus.Reviewing);
    await this.adminBotService.sendToReview(id, isGroup, username);
  }

  async getUserVerificationStatus(id: string) {
    const user = await this.userService.getById(id);
    return user?.status;
  }

  async updateModelSetting(id: string, model: AiModelType) {
    return await this.userService.updateModel(id, model);
  }

  async updateLanguageSetting(id: string, lang: string) {
    return await this.userService.updateLanguage(id, lang);
  }

  async updateConversation(id: string, conversationId: string) {
    return this.userService.updateConversationId(id, conversationId);
  }

  async processMediaRequest({ text, mediaUrls }: PromptProcessorParams) {
    return await this.openAiService.processMediaRequest(text, mediaUrls);
  }

  async processTextStream$({
    user,
    text,
    chatId,
    mediaUrls,
  }: PromptProcessorParams) {
    const stream = await this.openAiService.processMessage(
      text,
      user?.conversationId,
      mediaUrls,
    );

    return from(stream).pipe(
      tap((event) => {
        if (event.type === 'response.completed') {
          this.updateConversation(chatId.toString(), event.response.id);
        }
      }),
      filter((event) => event.type === 'response.output_text.delta'),
      scan((textToEdit, event) => textToEdit + event.delta, ''),
    );
  }

  async processVoice(audioUrl: string) {
    return await this.openAiService.processAudio(audioUrl);
  }
}
