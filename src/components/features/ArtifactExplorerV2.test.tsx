import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { ArtifactExplorer } from './ArtifactExplorerV2';
import { useArtifacts } from '../../hooks/useArtifacts';
import { createMockArtifacts, createMockArtifact } from '../../test/utils';

// Mock the useArtifacts hook
vi.mock('../../hooks/useArtifacts', () => ({
  useArtifacts: vi.fn(),
}));

describe('ArtifactExplorer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Default mock implementation
    const mockArtifacts = createMockArtifacts(3);
    mockArtifacts[0].type = 'intent';
    mockArtifacts[1].type = 'gate';
    mockArtifacts[2].type = 'contract';

    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: mockArtifacts,
      loading: false,
      error: null,
      selectedArtifact: null,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    vi.clearAllMocks();
  });

  it('renders the artifact explorer with filter buttons', () => {
    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the search input is rendered
    expect(screen.getByPlaceholderText(/search artifacts/i)).toBeInTheDocument();

    // Check that filter buttons are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Intents')).toBeInTheDocument();
    expect(screen.getByText('Gates')).toBeInTheDocument();
    expect(screen.getByText('Contracts')).toBeInTheDocument();
  });

  it('displays artifacts in a grid', () => {
    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that each artifact is displayed
    expect(screen.getByText('Test Artifact 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artifact 2')).toBeInTheDocument();
    expect(screen.getByText('Test Artifact 3')).toBeInTheDocument();
  });

  it('filters artifacts by type', () => {
    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Initially all artifacts should be visible
    expect(screen.getByText('Test Artifact 1')).toBeInTheDocument(); // intent
    expect(screen.getByText('Test Artifact 2')).toBeInTheDocument(); // gate
    expect(screen.getByText('Test Artifact 3')).toBeInTheDocument(); // contract

    // Filter by intent
    fireEvent.click(screen.getByText('Intents'));

    // Only intent artifacts should be visible
    expect(screen.getByText('Test Artifact 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Artifact 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Artifact 3')).not.toBeInTheDocument();

    // Filter by gate
    fireEvent.click(screen.getByText('Gates'));

    // Only gate artifacts should be visible
    expect(screen.queryByText('Test Artifact 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Artifact 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Artifact 3')).not.toBeInTheDocument();

    // Filter by contract
    fireEvent.click(screen.getByText('Contracts'));

    // Only contract artifacts should be visible
    expect(screen.queryByText('Test Artifact 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Artifact 2')).not.toBeInTheDocument();
    expect(screen.getByText('Test Artifact 3')).toBeInTheDocument();

    // Show all again
    fireEvent.click(screen.getByText('All'));

    // All artifacts should be visible again
    expect(screen.getByText('Test Artifact 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artifact 2')).toBeInTheDocument();
    expect(screen.getByText('Test Artifact 3')).toBeInTheDocument();
  });

  it('searches artifacts by title and description', () => {
    // Create mock artifacts with specific titles and descriptions
    const mockArtifacts = [
      createMockArtifact({
        id: '1',
        title: 'Alpha Project',
        description: 'This is the alpha project',
      }),
      createMockArtifact({
        id: '2',
        title: 'Beta Project',
        description: 'This is the beta project',
      }),
      createMockArtifact({
        id: '3',
        title: 'Gamma Project',
        description: 'This contains alpha in the description',
      }),
    ];

    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: mockArtifacts,
      loading: false,
      error: null,
      selectedArtifact: null,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Initially all artifacts should be visible
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
    expect(screen.getByText('Gamma Project')).toBeInTheDocument();

    // Search for 'alpha' in title and description
    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    fireEvent.change(searchInput, { target: { value: 'alpha' } });

    // Only artifacts with 'alpha' in title or description should be visible
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
    expect(screen.getByText('Gamma Project')).toBeInTheDocument(); // Has 'alpha' in description

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // All artifacts should be visible again
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
    expect(screen.getByText('Gamma Project')).toBeInTheDocument();
  });

  it('shows artifact details when an artifact is clicked', () => {
    const setSelectedArtifact = vi.fn();
    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: createMockArtifacts(1),
      loading: false,
      error: null,
      selectedArtifact: null,
      setSelectedArtifact,
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Click on an artifact
    fireEvent.click(screen.getByText('Test Artifact 1'));

    // Check that setSelectedArtifact was called
    expect(setSelectedArtifact).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-id-0',
      title: 'Test Artifact 1',
    }));
  });

  it('shows details sidebar when an artifact is selected', () => {
    const selectedArtifact = createMockArtifact({
      id: 'selected-id',
      title: 'Selected Artifact',
      description: 'This is the selected artifact',
      type: 'intent',
      tags: ['tag1', 'tag2'],
      trustScore: 90,
      author: {
        name: 'Test Author',
        verified: true,
      },
    });

    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [selectedArtifact],
      loading: false,
      error: null,
      selectedArtifact,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the details sidebar is shown
    expect(screen.getByText('Selected Artifact')).toBeInTheDocument();
    expect(screen.getByText('This is the selected artifact')).toBeInTheDocument();
    expect(screen.getByText('#tag1')).toBeInTheDocument();
    expect(screen.getByText('#tag2')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('closes details sidebar when X is clicked', () => {
    const selectedArtifact = createMockArtifact({
      id: 'selected-id',
      title: 'Selected Artifact',
    });

    const setSelectedArtifact = vi.fn();
    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [selectedArtifact],
      loading: false,
      error: null,
      selectedArtifact,
      setSelectedArtifact,
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the details sidebar is shown
    expect(screen.getByText('Selected Artifact')).toBeInTheDocument();

    // Close the sidebar by clicking X
    // There might be multiple X buttons, so we need to find the one in the sidebar
    const closeButtons = screen.getAllByRole('button', { name: /x/i });
    const closeButton = closeButtons.find(button =>
      button.closest('div')?.textContent?.includes('Selected Artifact')
    );

    if (closeButton) {
      fireEvent.click(closeButton);
    } else {
      // If we can't find the specific button, click the first one
      fireEvent.click(closeButtons[0]);
    }

    // Check that setSelectedArtifact was called with null
    expect(setSelectedArtifact).toHaveBeenCalledWith(null);
  });

  it('shows loading state', () => {
    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [],
      loading: true,
      error: null,
      selectedArtifact: null,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the loading state is shown
    expect(screen.getByText('Loading artifacts...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [],
      loading: false,
      error: new Error('Test error'),
      selectedArtifact: null,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the error state is shown
    expect(screen.getByText('Error loading artifacts')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // There should be a retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows empty state when no artifacts match filter', () => {
    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [],
      loading: false,
      error: null,
      selectedArtifact: null,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact: vi.fn(),
    });

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the empty state is shown
    expect(screen.getByText('No artifacts found matching your search criteria.')).toBeInTheDocument();
  });

  it('calls deleteArtifact when delete button is clicked', async () => {
    const deleteArtifact = vi.fn().mockResolvedValue(true);
    const selectedArtifact = createMockArtifact({
      id: 'delete-id',
      title: 'Delete Me',
    });

    vi.mocked(useArtifacts).mockReturnValue({
      artifacts: [selectedArtifact],
      loading: false,
      error: null,
      selectedArtifact,
      setSelectedArtifact: vi.fn(),
      fetchArtifacts: vi.fn(),
      getArtifactById: vi.fn(),
      createArtifact: vi.fn(),
      updateArtifact: vi.fn(),
      deleteArtifact,
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Check that the details sidebar is shown
    expect(screen.getByText('Delete Me')).toBeInTheDocument();

    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this artifact?');

    // Check that deleteArtifact was called
    expect(deleteArtifact).toHaveBeenCalledWith('delete-id');

    // Restore original window.confirm
    window.confirm = originalConfirm;
  });

  it('calls onClose when close button is clicked', () => {
    render(<ArtifactExplorer onClose={mockOnClose} />);

    // Click the close button
    const closeButton = screen.getByTitle('Close Library');
    fireEvent.click(closeButton);

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});