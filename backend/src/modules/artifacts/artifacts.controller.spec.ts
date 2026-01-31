import { Test, TestingModule } from '@nestjs/testing';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { Artifact, ArtifactType, ArtifactStatus } from './entities/artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';

// Mock service
const mockArtifactsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ArtifactsController', () => {
  let controller: ArtifactsController;
  let service: ArtifactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtifactsController],
      providers: [
        {
          provide: ArtifactsService,
          useValue: mockArtifactsService,
        },
      ],
    }).compile();

    controller = module.get<ArtifactsController>(ArtifactsController);
    service = module.get<ArtifactsService>(ArtifactsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of artifacts', async () => {
      const artifacts = [new Artifact(), new Artifact()];
      jest.spyOn(service, 'findAll').mockResolvedValue(artifacts);

      expect(await controller.findAll()).toBe(artifacts);
    });
  });

  describe('findOne', () => {
    it('should return a single artifact', async () => {
      const artifact = new Artifact();
      artifact.id = 'test-id';
      jest.spyOn(service, 'findOne').mockResolvedValue(artifact);

      expect(await controller.findOne('test-id')).toBe(artifact);
    });
  });

  describe('create', () => {
    it('should create a new artifact', async () => {
      const createDto: CreateArtifactDto = {
        name: 'New Artifact',
        type: ArtifactType.INTENT,
      };

      const artifact = new Artifact();
      Object.assign(artifact, createDto);
      artifact.id = 'generated-id';

      jest.spyOn(service, 'create').mockResolvedValue(artifact);

      expect(await controller.create(createDto)).toBe(artifact);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update an existing artifact', async () => {
      const id = 'test-id';
      const updateDto: UpdateArtifactDto = {
        name: 'Updated Name',
        status: ArtifactStatus.APPROVED,
      };

      const updatedArtifact = new Artifact();
      updatedArtifact.id = id;
      updatedArtifact.name = 'Updated Name';
      updatedArtifact.status = ArtifactStatus.APPROVED;

      jest.spyOn(service, 'update').mockResolvedValue(updatedArtifact);

      expect(await controller.update(id, updateDto)).toBe(updatedArtifact);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an artifact', async () => {
      const id = 'test-id';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});