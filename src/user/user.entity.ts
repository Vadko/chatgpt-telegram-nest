import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AiModelType } from '../common/types/ai-model.enum';
import { UserStatus } from '../common/types/user-status.enum';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  conversationId?: string;

  @Column({ type: 'date' })
  createdAt: string;

  @Column({ type: 'enum', enum: AiModelType, default: AiModelType.GPT })
  model: AiModelType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Unverified })
  status: UserStatus;

  @Column({ default: 'en' })
  lang: string;
}
