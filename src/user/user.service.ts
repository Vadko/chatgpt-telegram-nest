import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AiModelType } from '../common/types/ai-model.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(id: string, conversationId: string) {
    const user = new User();

    user.id = id;
    user.conversationId = conversationId;
    user.createdAt = new Date().toISOString();

    return this.usersRepository.save(user);
  }

  getById(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  async updateConversationId(id: string, conversationId?: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Not found user for id ${id}`);
    }
    user.conversationId = conversationId;

    return this.usersRepository.save(user);
  }

  async updateModel(id: string, model: AiModelType) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Not found user for id ${id}`);
    }
    user.model = model;

    return this.usersRepository.save(user);
  }
}
