import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artifact } from './entities/artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';

@Injectable()
export class ArtifactsService {
  constructor(
    @InjectRepository(Artifact)
    private readonly artifactsRepository: Repository<Artifact>,
  ) {}

  /**
   * Find all artifacts
   */
  async findAll(): Promise<Artifact[]> {
    return this.artifactsRepository.find();
  }

  /**
   * Find an artifact by ID
   * @param id Artifact ID
   */
  async findOne(id: string): Promise<Artifact> {
    const artifact = await this.artifactsRepository.findOne({ where: { id } });

    if (!artifact) {
      throw new NotFoundException(`Artifact with ID "${id}" not found`);
    }

    return artifact;
  }

  /**
   * Create a new artifact
   * @param createArtifactDto Artifact data
   */
  async create(createArtifactDto: CreateArtifactDto): Promise<Artifact> {
    const artifact = this.artifactsRepository.create(createArtifactDto);

    // Generate hash before saving
    artifact.hash = artifact.generateHash();

    return this.artifactsRepository.save(artifact);
  }

  /**
   * Update an existing artifact
   * @param id Artifact ID
   * @param updateArtifactDto Updated artifact data
   */
  async update(id: string, updateArtifactDto: UpdateArtifactDto): Promise<Artifact> {
    // First check if artifact exists
    const artifact = await this.findOne(id);

    // Update the artifact
    Object.assign(artifact, updateArtifactDto);

    // Regenerate hash if content changed
    if (updateArtifactDto.content) {
      artifact.hash = artifact.generateHash();
    }

    return this.artifactsRepository.save(artifact);
  }

  /**
   * Remove an artifact
   * @param id Artifact ID
   */
  async remove(id: string): Promise<void> {
    // First check if artifact exists
    await this.findOne(id);

    // Delete the artifact
    await this.artifactsRepository.delete(id);
  }
}