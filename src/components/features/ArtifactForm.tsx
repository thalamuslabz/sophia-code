import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Artifact } from '../../types';
import { GlassCard } from '../ui/GlassCard';

// Type for our form values
type FormValues = Omit<Artifact, 'id' | 'contentHash'> & { id?: string };

interface ArtifactFormProps {
  artifact?: Artifact;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export const ArtifactForm: React.FC<ArtifactFormProps> = ({
  artifact,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<FormValues>({
    title: '',
    description: '',
    type: 'intent',
    trustScore: 85,
    author: {
      name: '',
      avatar: '',
      verified: false,
    },
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If we're editing an existing artifact, initialize the form
  useEffect(() => {
    if (artifact) {
      setValues({
        ...artifact,
      });
    }
  }, [artifact]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'trustScore') {
      setValues({
        ...values,
        [name]: Math.max(0, Math.min(100, parseInt(value, 10) || 0)),
      });
    } else if (name === 'author.name') {
      setValues({
        ...values,
        author: {
          ...values.author,
          name: value,
        },
      });
    } else {
      setValues({
        ...values,
        [name]: value,
      });
    }
  };

  // Toggle the author verified status
  const toggleAuthorVerified = () => {
    setValues({
      ...values,
      author: {
        ...values.author,
        verified: !values.author.verified,
      },
    });
  };

  // Add a tag
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!values.tags.includes(tagInput.trim())) {
        setValues({
          ...values,
          tags: [...values.tags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    setValues({
      ...values,
      tags: values.tags.filter((t) => t !== tag),
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!values.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!values.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!values.author.name.trim()) {
      newErrors['author.name'] = 'Author name is required';
    }
    if (values.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while saving the artifact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {artifact ? 'Edit Artifact' : 'Create New Artifact'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              className={`w-full bg-black/20 border ${
                errors.title ? 'border-red-500' : 'border-white/10'
              } rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors`}
              placeholder="Artifact title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              rows={3}
              className={`w-full bg-black/20 border ${
                errors.description ? 'border-red-500' : 'border-white/10'
              } rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors`}
              placeholder="Artifact description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={values.type}
              onChange={handleChange}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="intent">Intent</option>
              <option value="gate">Gate</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          {/* Trust Score */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Trust Score: {values.trustScore}%
            </label>
            <input
              type="range"
              name="trustScore"
              value={values.trustScore}
              onChange={handleChange}
              min="0"
              max="100"
              step="1"
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-1">Author Name</label>
            <input
              type="text"
              name="author.name"
              value={values.author.name}
              onChange={handleChange}
              className={`w-full bg-black/20 border ${
                errors['author.name'] ? 'border-red-500' : 'border-white/10'
              } rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors`}
              placeholder="Author name"
            />
            {errors['author.name'] && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors['author.name']}
              </p>
            )}
          </div>

          {/* Author Verified */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="authorVerified"
              checked={values.author.verified}
              onChange={toggleAuthorVerified}
              className="form-checkbox h-4 w-4 text-primary border-white/20 rounded focus:ring-primary"
            />
            <label htmlFor="authorVerified" className="text-sm">
              Verified Author
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div
              className={`flex flex-wrap gap-2 p-2 bg-black/20 border ${
                errors.tags ? 'border-red-500' : 'border-white/10'
              } rounded-lg mb-2`}
            >
              {values.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={values.tags.length ? 'Add more tags...' : 'Add tags...'}
                className="flex-grow bg-transparent border-0 focus:outline-none text-sm min-w-[120px]"
              />
            </div>
            {errors.tags && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.tags}
              </p>
            )}
            <p className="text-xs text-gray-400">
              Press Enter to add tags
            </p>
          </div>

          {/* Submit and Cancel buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all text-sm font-medium ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting
                ? 'Saving...'
                : artifact
                ? 'Update Artifact'
                : 'Create Artifact'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};