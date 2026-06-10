import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureSeedUser('fisherman1@test.com', 'fisherman', 'fisherman123');
    await this.ensureSeedUser('fisherman2@test.com', 'fisherman', 'fisherman123');
    await this.ensureSeedUser('inspector@test.com', 'inspector', 'inspector123');
  }

  findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email: email.toLowerCase().trim() });
  }

  findById(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async register(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'fisherman',
      }),
    );

    return this.toPublicUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.toPublicUser(user);
  }

  async getMe(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.toPublicUser(user);
  }

  toPublicUser(user: User) {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private async ensureSeedUser(email: string, role: UserRole, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await this.findByEmail(email);

    if (existing) {
      existing.role = role;
      existing.passwordHash = passwordHash;
      return this.usersRepository.save(existing);
    }

    return this.usersRepository.save(
      this.usersRepository.create({ email, role, passwordHash }),
    );
  }
}
