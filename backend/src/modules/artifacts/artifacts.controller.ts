import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { Artifact } from './entities/artifact.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller('artifacts')
@UseGuards(ApiKeyGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  /**
   * Create a new artifact
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createArtifactDto: CreateArtifactDto): Promise<Artifact> {
    return this.artifactsService.create(createArtifactDto);
  }

  /**
   * Get all artifacts
   */
  @Get()
  findAll(): Promise<Artifact[]> {
    return this.artifactsService.findAll();
  }

  /**
   * Get a specific artifact by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Artifact> {
    return this.artifactsService.findOne(id);
  }

  /**
   * Update an existing artifact
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateArtifactDto: UpdateArtifactDto,
  ): Promise<Artifact> {
    return this.artifactsService.update(id, updateArtifactDto);
  }

  /**
   * Remove an artifact
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.artifactsService.remove(id);
  }
}