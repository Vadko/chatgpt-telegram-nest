import { Scenes } from 'telegraf';
import { User } from '../../user/user.entity';

export interface ClientTelegrafContext extends Scenes.SceneContext {
  user: User | null;
}

export interface AdminTelegrafContext extends Scenes.SceneContext {}
