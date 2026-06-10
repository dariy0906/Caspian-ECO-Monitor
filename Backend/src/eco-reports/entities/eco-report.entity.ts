import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export type EcoReportType = 'pollution' | 'trash' | 'dead_fish' | 'illegal_nets';
export type EcoReportStatus = 'pending' | 'approved' | 'rejected';

@Entity('eco_reports')
export class EcoReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 40 })
  type: EcoReportType;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 120 })
  locationName: string;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: EcoReportStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  inspectorComment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;
}
