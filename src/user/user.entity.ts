import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AiModelType } from '../common/types/ai-model.enum';
import { UserStatus } from '../common/types/user-status.enum';
import { ChatType } from '../common/types/chat-type.enum';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', nullable: true })
  conversationId?: string | null;

  @Column({ type: 'date' })
  createdAt: string;

  @Column({ type: 'enum', enum: ChatType })
  type: ChatType;

  @Column({ type: 'enum', enum: AiModelType, default: AiModelType.GPT })
  model: AiModelType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Unverified })
  status: UserStatus;

  @Column({ default: 'en' })
  lang: string;
}
