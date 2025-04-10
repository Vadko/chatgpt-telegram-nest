import { ClientTelegrafContext } from '../../common/interfaces/telegraf-context.interface';
import { User } from '../../user/user.entity';

export type MessageProcessorParams = {
  ctx: ClientTelegrafContext;
  user: User | null;
  text: string;
  replyId: number;
  mediaUrls?: string[];
};
