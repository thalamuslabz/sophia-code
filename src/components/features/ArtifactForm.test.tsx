import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { ArtifactForm } from './ArtifactForm';
import { createMockArtifact } from '../../test/utils';

describe('ArtifactForm', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('renders the create form when no artifact is provided', () => {
    render(<ArtifactForm {...defaultProps} />);

    // Check that the form title is correct for creation
    expect(screen.getByText('Create New Artifact')).toBeInTheDocument();

    // Check that the form fields are empty
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/author name/i)).toHaveValue('');

    // Check that the submit button has the correct text
    expect(screen.getByRole('button', { name: /create artifact/i })).toBeInTheDocument();
  });

  it.skip('renders the edit form when an artifact is provided', () => {
    const artifact = createMockArtifact({
      title: 'Edit Test',
      description: 'Test description',
      author: {
        name: 'Test Author',
        avatar: '',
        verified: true,
      },
      tags: ['test', 'edit'],
    });

    render(<ArtifactForm {...defaultProps} artifact={artifact} />);

    // Check that the form title is correct for editing
    expect(screen.getByText('Edit Artifact')).toBeInTheDocument();

    // Check that the form fields are populated with the artifact data
    expect(screen.getByLabelText(/title/i)).toHaveValue('Edit Test');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test description');
    expect(screen.getByLabelText(/author name/i)).toHaveValue('Test Author');
    expect(screen.getByLabelText(/verified author/i)).toBeChecked();

    // Check that the tags are displayed
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('edit')).toBeInTheDocument();

    // Check that the submit button has the correct text
    expect(screen.getByRole('button', { name: /update artifact/i })).toBeInTheDocument();
  });

  it('validates the form on submission', async () => {
    render(<ArtifactForm {...defaultProps} />);

    // Submit the form without filling any fields
    const submitButton = screen.getByRole('button', { name: /create artifact/i });
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Author name is required')).toBeInTheDocument();
    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();

    // Check that onSubmit was not called
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('allows adding and removing tags', () => {
    render(<ArtifactForm {...defaultProps} />);

    // Get the tag input
    const tagInput = screen.getByPlaceholderText(/add tags/i);

    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Check that the tag was added
    expect(screen.getByText('test-tag')).toBeInTheDocument();

    // Input should be cleared
    expect(tagInput).toHaveValue('');

    // Add another tag
    fireEvent.change(tagInput, { target: { value: 'another-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Check that both tags are displayed
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByText('another-tag')).toBeInTheDocument();

    // Remove a tag
    const removeButton = screen.getAllByRole('button')[1]; // First X button for the first tag
    fireEvent.click(removeButton);

    // Check that the tag was removed
    expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
    expect(screen.getByText('another-tag')).toBeInTheDocument();
  });

  it.skip('calls onSubmit with the form values when valid', async () => {
    render(<ArtifactForm {...defaultProps} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'Test Author' } });

    // Add a tag
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Check the verified author checkbox
    fireEvent.click(screen.getByLabelText(/verified author/i));

    // Change the artifact type
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'gate' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create artifact/i });
    fireEvent.click(submitButton);

    // Wait for the async submission to complete
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    // Check that onSubmit was called with the correct values
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        description: 'Test Description',
        type: 'gate',
        author: {
          name: 'Test Author',
          avatar: '',
          verified: true,
        },
        tags: ['test-tag'],
      })
    );
  });

  it('calls onCancel when the cancel button is clicked', () => {
    render(<ArtifactForm {...defaultProps} />);

    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Check that onCancel was called
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it.skip('displays loading state during submission', async () => {
    // Create a mock onSubmit that doesn't resolve immediately
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100);
    }));

    render(<ArtifactForm onSubmit={onSubmit} onCancel={defaultProps.onCancel} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'Test Author' } });

    // Add a tag
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create artifact/i });
    fireEvent.click(submitButton);

    // Check that the button text changes to indicate loading
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Wait for the submission to complete
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it.skip('handles errors from onSubmit', async () => {
    // Create a mock onSubmit that rejects with an error
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ArtifactForm onSubmit={onSubmit} onCancel={defaultProps.onCancel} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'Test Author' } });

    // Add a tag
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create artifact/i });
    fireEvent.click(submitButton);

    // Wait for the submission to fail
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Check that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Error submitting form:', expect.any(Error));

    // The submit button should be enabled again
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Create Artifact');

    // Cleanup spies
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});