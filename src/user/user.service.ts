import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AiModelType } from '../common/types/ai-model.enum';
import { UserStatus } from '../common/types/user-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(id: string, lang?: string, conversationId?: string) {
    const user = new User();

    user.id = id;
    user.conversationId = conversationId;
    user.createdAt = new Date().toISOString();
    user.status = UserStatus.Unverified;
    user.model = AiModelType.GPT;
    user.lang = lang ?? 'en';

    return this.usersRepository.save(user);
  }

  async getById(id: string) {
    return await this.usersRepository.findOneBy({ id });
  }

  async getByIdOrThrow(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Not found user for id ${id}`);
    }
    return user;
  }

  async updateConversationId(id: string, conversationId?: string) {
    const user = await this.getByIdOrThrow(id);

    user.conversationId = conversationId;

    return this.usersRepository.save(user);
  }

  async updateModel(id: string, model: AiModelType) {
    const user = await this.getByIdOrThrow(id);

    user.model = model;

    return this.usersRepository.save(user);
  }

  async updateVerificationStatus(id: string, status: UserStatus) {
    const user = await this.getByIdOrThrow(id);

    user.status = status;

    return this.usersRepository.save(user);
  }
}
