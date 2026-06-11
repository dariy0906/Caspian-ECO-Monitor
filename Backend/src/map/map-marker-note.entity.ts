import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('map_marker_notes')
export class MapMarkerNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 160, unique: true })
  markerId: string;

  @Column({ type: 'simple-json', nullable: true })
  pluses: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  minuses: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  hiddenPluses: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  hiddenMinuses: string[] | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
