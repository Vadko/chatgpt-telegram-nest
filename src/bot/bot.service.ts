import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { OpenaiService } from '../openai/openai.service';
import { from, tap, filter, scan } from 'rxjs';

@Injectable()
export class BotService {
  constructor(
    private readonly userService: UserService,
    private readonly openAiService: OpenaiService,
  ) {}

  async updateConversation(id: string, conversationId: string) {
    const exists = await this.userService.getById(id);
    if (exists) {
      return this.userService.updateConversationId(id, conversationId);
    } else {
      return this.userService.create(id, conversationId);
    }
  }

  async processMessage$(text: string, chatId: number, mediaUrls?: string[]) {
    const user = await this.userService.getById(chatId.toString());

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
