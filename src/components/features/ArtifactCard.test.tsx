import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { ArtifactCard } from './ArtifactCard';
import { createMockArtifact } from '../../test/utils';

describe('ArtifactCard', () => {
  it('renders the artifact information correctly', () => {
    // Create a mock artifact
    const artifact = createMockArtifact({
      title: 'Test Card',
      description: 'This is a test card',
      type: 'intent',
      trustScore: 85,
      author: {
        name: 'John Doe',
        avatar: '',
        verified: true,
      },
      tags: ['test', 'card'],
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render the component
    render(<ArtifactCard artifact={artifact} onCopy={onCopy} />);

    // Check that the artifact information is displayed
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('This is a test card')).toBeInTheDocument();
    expect(screen.getByText('intent')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // The verified check mark is displayed
    expect(screen.getByTitle('Verified')).toBeInTheDocument();

    // The Copy Code button is displayed
    expect(screen.getByText('Copy Code')).toBeInTheDocument();
  });

  it('renders different badge colors based on artifact type', () => {
    // Create artifacts of different types
    const intentArtifact = createMockArtifact({
      type: 'intent',
      title: 'Intent Artifact',
    });

    const gateArtifact = createMockArtifact({
      type: 'gate',
      title: 'Gate Artifact',
    });

    const contractArtifact = createMockArtifact({
      type: 'contract',
      title: 'Contract Artifact',
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render each artifact
    const { rerender } = render(<ArtifactCard artifact={intentArtifact} onCopy={onCopy} />);

    // Check intent badge color
    const intentBadge = screen.getByText('intent');
    expect(intentBadge).toHaveClass('bg-blue-500/20');
    expect(intentBadge).toHaveClass('text-blue-300');

    // Render gate artifact
    rerender(<ArtifactCard artifact={gateArtifact} onCopy={onCopy} />);

    // Check gate badge color
    const gateBadge = screen.getByText('gate');
    expect(gateBadge).toHaveClass('bg-purple-500/20');
    expect(gateBadge).toHaveClass('text-purple-300');

    // Render contract artifact
    rerender(<ArtifactCard artifact={contractArtifact} onCopy={onCopy} />);

    // Check contract badge color
    const contractBadge = screen.getByText('contract');
    expect(contractBadge).toHaveClass('bg-orange-500/20');
    expect(contractBadge).toHaveClass('text-orange-300');
  });

  it('renders different trust score colors based on score value', () => {
    // Create artifacts with different trust scores
    const highTrustArtifact = createMockArtifact({
      trustScore: 95,
      title: 'High Trust',
    });

    const mediumTrustArtifact = createMockArtifact({
      trustScore: 75,
      title: 'Medium Trust',
    });

    const lowTrustArtifact = createMockArtifact({
      trustScore: 60,
      title: 'Low Trust',
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render high trust artifact
    const { rerender } = render(<ArtifactCard artifact={highTrustArtifact} onCopy={onCopy} />);

    // Check trust score color
    const highTrustScore = screen.getByText('95%');
    expect(highTrustScore).toHaveClass('text-green-400');

    // Render medium trust artifact
    rerender(<ArtifactCard artifact={mediumTrustArtifact} onCopy={onCopy} />);

    // Check trust score color
    const mediumTrustScore = screen.getByText('75%');
    expect(mediumTrustScore).toHaveClass('text-yellow-400');

    // Render low trust artifact
    rerender(<ArtifactCard artifact={lowTrustArtifact} onCopy={onCopy} />);

    // Check trust score color
    const lowTrustScore = screen.getByText('60%');
    expect(lowTrustScore).toHaveClass('text-red-400');
  });

  it('calls onCopy when the Copy Code button is clicked', () => {
    // Create a mock artifact
    const artifact = createMockArtifact({
      title: 'Copy Test',
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render the component
    render(<ArtifactCard artifact={artifact} onCopy={onCopy} />);

    // Click the Copy Code button
    const copyButton = screen.getByText('Copy Code');
    fireEvent.click(copyButton);

    // Check that onCopy was called with the artifact
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith(artifact);
  });

  it('renders the first letter of the author name in the avatar', () => {
    // Create a mock artifact with a specific author name
    const artifact = createMockArtifact({
      author: {
        name: 'Jane Smith',
        avatar: '',
        verified: false,
      },
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render the component
    render(<ArtifactCard artifact={artifact} onCopy={onCopy} />);

    // Check that the avatar has the first letter of the author's name
    const avatarElement = screen.getByText('J');
    expect(avatarElement).toBeInTheDocument();
  });

  it('does not render the verified check mark for unverified authors', () => {
    // Create a mock artifact with an unverified author
    const artifact = createMockArtifact({
      author: {
        name: 'Unverified Author',
        avatar: '',
        verified: false,
      },
    });

    // Mock the onCopy function
    const onCopy = vi.fn();

    // Render the component
    render(<ArtifactCard artifact={artifact} onCopy={onCopy} />);

    // Check that the verified check mark is not present
    const verifiedElement = screen.queryByTitle('Verified');
    expect(verifiedElement).not.toBeInTheDocument();
  });
});