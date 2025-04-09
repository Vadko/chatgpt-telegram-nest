import { Scenes } from 'telegraf';
import { User } from '../../user/user.entity';

export interface TelegrafContext extends Scenes.SceneContext {
  user: User | null;
}
