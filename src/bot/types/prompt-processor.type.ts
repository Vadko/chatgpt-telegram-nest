import { User } from '../../user/user.entity';

export type PromptProcessorParams = {
  user: User | null;
  text: string;
  chatId: number;
  mediaUrls?: string[];
};
