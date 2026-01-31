import { Artifact, ArtifactType, ArtifactStatus } from './artifact.entity';

describe('Artifact Entity', () => {
  let artifact: Artifact;

  beforeEach(() => {
    artifact = new Artifact();
    artifact.id = 'test-id';
    artifact.name = 'Test Artifact';
    artifact.description = 'Test Description';
    artifact.type = ArtifactType.INTENT;
    artifact.status = ArtifactStatus.DRAFT;
    artifact.metadata = { tag: 'test' };
    artifact.content = { key: 'value' };
    artifact.createdBy = 'user1';
    artifact.updatedBy = 'user1';
    artifact.createdAt = new Date();
    artifact.updatedAt = new Date();
  });

  it('should be defined', () => {
    expect(artifact).toBeDefined();
  });

  it('should have all required properties', () => {
    expect(artifact.id).toBe('test-id');
    expect(artifact.name).toBe('Test Artifact');
    expect(artifact.description).toBe('Test Description');
    expect(artifact.type).toBe(ArtifactType.INTENT);
    expect(artifact.status).toBe(ArtifactStatus.DRAFT);
    expect(artifact.metadata).toEqual({ tag: 'test' });
    expect(artifact.content).toEqual({ key: 'value' });
    expect(artifact.createdBy).toBe('user1');
    expect(artifact.updatedBy).toBe('user1');
    expect(artifact.createdAt).toBeInstanceOf(Date);
    expect(artifact.updatedAt).toBeInstanceOf(Date);
  });

  describe('generateHash', () => {
    it('should generate a hash string', () => {
      const hash = artifact.generateHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toContain('hash-');
      expect(hash).toContain(artifact.id);
    });
  });
});