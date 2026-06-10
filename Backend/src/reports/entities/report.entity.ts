import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ReportType = 'pollution' | 'dead_fish' | 'illegal_nets' | 'trash';
export type ReportStatus = 'new' | 'verified' | 'resolved';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  type: ReportType;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 30, default: 'new' })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;
}
