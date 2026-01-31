import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ArtifactType } from '../entities/artifact.entity';

/**
 * DTO for creating a new artifact
 */
export class CreateArtifactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ArtifactType)
  @IsNotEmpty()
  type: ArtifactType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsString()
  @IsOptional()
  createdBy?: string;
}