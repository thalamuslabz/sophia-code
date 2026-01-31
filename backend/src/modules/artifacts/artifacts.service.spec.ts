import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtifactsService } from './artifacts.service';
import { Artifact, ArtifactStatus, ArtifactType } from './entities/artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { NotFoundException } from '@nestjs/common';

// Mock repository
const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('ArtifactsService', () => {
  let service: ArtifactsService;
  let repository: Repository<Artifact>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtifactsService,
        {
          provide: getRepositoryToken(Artifact),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ArtifactsService>(ArtifactsService);
    repository = module.get<Repository<Artifact>>(getRepositoryToken(Artifact));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of artifacts', async () => {
      const artifacts = [new Artifact(), new Artifact()];
      jest.spyOn(repository, 'find').mockResolvedValue(artifacts);

      expect(await service.findAll()).toBe(artifacts);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an artifact when it exists', async () => {
      const artifact = new Artifact();
      artifact.id = 'test-id';
      jest.spyOn(repository, 'findOne').mockResolvedValue(artifact);

      expect(await service.findOne('test-id')).toBe(artifact);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });

    it('should throw NotFoundException when artifact does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new artifact', async () => {
      const createDto: CreateArtifactDto = {
        name: 'New Artifact',
        type: ArtifactType.INTENT,
        description: 'Description',
        content: { data: 'value' },
      };

      const newArtifact = new Artifact();
      Object.assign(newArtifact, createDto);
      newArtifact.id = 'generated-id';
      newArtifact.hash = 'generated-hash';

      jest.spyOn(repository, 'create').mockReturnValue(newArtifact);
      jest.spyOn(repository, 'save').mockResolvedValue(newArtifact);
      jest.spyOn(newArtifact, 'generateHash').mockReturnValue('generated-hash');

      const result = await service.create(createDto);
      expect(result).toBe(newArtifact);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(newArtifact.hash).toBe('generated-hash');
    });
  });

  describe('update', () => {
    it('should update and return an artifact', async () => {
      const id = 'test-id';
      const updateDto: UpdateArtifactDto = {
        name: 'Updated Name',
        status: ArtifactStatus.APPROVED,
      };

      const existingArtifact = new Artifact();
      existingArtifact.id = id;
      existingArtifact.name = 'Original Name';
      existingArtifact.status = ArtifactStatus.DRAFT;

      const updatedArtifact = new Artifact();
      Object.assign(updatedArtifact, existingArtifact, updateDto);

      jest.spyOn(service, 'findOne').mockResolvedValue(existingArtifact);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedArtifact);

      const result = await service.update(id, updateDto);

      expect(result).toBe(updatedArtifact);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when artifact does not exist', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an artifact successfully', async () => {
      const id = 'test-id';
      const existingArtifact = new Artifact();
      existingArtifact.id = id;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingArtifact);
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(repository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when artifact does not exist', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});