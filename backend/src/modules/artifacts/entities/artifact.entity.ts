import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

/**
 * Artifact types supported in the system
 */
export enum ArtifactType {
  INTENT = 'intent',
  GATE = 'gate',
  CONTRACT = 'contract',
}

/**
 * Artifact status in the governance lifecycle
 */
export enum ArtifactStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  GATED = 'gated',
  COMPLETED = 'completed',
}

/**
 * Artifact entity - base model for all governance artifacts
 */
@Entity('artifacts')
export class Artifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ArtifactType,
    default: ArtifactType.INTENT,
  })
  type: ArtifactType;

  @Column({
    type: 'enum',
    enum: ArtifactStatus,
    default: ArtifactStatus.DRAFT,
  })
  status: ArtifactStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  hash: string;

  /**
   * Generate a hash of the artifact content for integrity verification
   * @returns SHA-256 hash of the artifact content
   */
  generateHash(): string {
    // In a real implementation, this would create a SHA-256 hash
    // For now, we'll use a placeholder implementation
    return `hash-${this.id}-${Date.now()}`;
  }
}