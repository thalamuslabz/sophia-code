import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ArtifactStatus } from '../entities/artifact.entity';

/**
 * DTO for updating an existing artifact
 */
export class UpdateArtifactDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ArtifactStatus)
  @IsOptional()
  status?: ArtifactStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}