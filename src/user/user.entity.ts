import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  conversationId?: string;

  @Column({ type: 'date' })
  createdAt: string;
}
