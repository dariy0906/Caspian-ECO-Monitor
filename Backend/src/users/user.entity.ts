import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'fisherman' | 'inspector';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 30, default: 'fisherman' })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
