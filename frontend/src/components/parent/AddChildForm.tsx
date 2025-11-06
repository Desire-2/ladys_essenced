import React, { useState, useEffect } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface AddChildFormProps {
  onChildAdded?: () => void;
  editingChild?: any;
  onEditComplete?: () => void;
}

export const AddChildForm: React.FC<AddChildFormProps> = ({ 
  onChildAdded, 
  editingChild, 
  onEditComplete 
}) => {
  const { addChild, updateChild } = useParent();
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    relationship_type: 'mother',
    phone_number: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editingChild) {
      setFormData({
        name: editingChild.name || '',
        date_of_birth: editingChild.date_of_birth?.split('T')[0] || '',
        relationship_type: editingChild.relationship || 'mother',
        phone_number: editingChild.phone_number || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        date_of_birth: '',
        relationship_type: 'mother',
        phone_number: '',
        password: ''
      });
    }
    setError('');
    setSuccess('');
  }, [editingChild]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Please enter child\'s name');
      return;
    }

    if (!formData.date_of_birth) {
      setError('Please enter date of birth');
      return;
    }

    if (!editingChild && !formData.password) {
      setError('Please enter a password for new child');
      return;
    }

    setIsLoading(true);

    try {
      const submitData: any = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        relationship_type: formData.relationship_type
      };

      // Add phone_number only if provided
      if (formData.phone_number.trim()) {
        submitData.phone_number = formData.phone_number;
      }

      if (!editingChild) {
        submitData.password = formData.password;
      }

      if (editingChild) {
        await updateChild(editingChild.id, submitData);
        setSuccess('Child information updated successfully');
      } else {
        await addChild(submitData);
        setSuccess('Child added successfully');
      }

      setFormData({
        name: '',
        date_of_birth: '',
        relationship_type: 'mother',
        phone_number: '',
        password: ''
      });

      setTimeout(() => {
        setSuccess('');
        onChildAdded?.();
        onEditComplete?.();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'Failed to save child';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <h5 className="mb-0 text-white">
          <i className={`fas fa-${editingChild ? 'edit' : 'plus-circle'} me-2`}></i>
          {editingChild ? 'Edit Child' : 'Add New Child'}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="form-group mb-3">
            <label htmlFor="childName" className="form-label">
              <i className="fas fa-user me-2 text-primary"></i>
              Child's Name
            </label>
            <input
              type="text"
              id="childName"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter child's full name"
              required
            />
          </div>

          {/* Date of Birth Field */}
          <div className="form-group mb-3">
            <label htmlFor="childDob" className="form-label">
              <i className="fas fa-birthday-cake me-2 text-primary"></i>
              Date of Birth
            </label>
            <input
              type="date"
              id="childDob"
              className="form-control"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
            {formData.date_of_birth && (
              <small className="text-muted d-block mt-1">
                Age: {Math.floor((Date.now() - new Date(formData.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old
              </small>
            )}
          </div>

          {/* Relationship Type Field */}
          <div className="form-group mb-3">
            <label htmlFor="relationship" className="form-label">
              <i className="fas fa-heart me-2 text-primary"></i>
              Relationship
            </label>
            <select
              id="relationship"
              className="form-control"
              name="relationship_type"
              value={formData.relationship_type}
              onChange={handleChange}
              required
            >
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          {/* Phone Number Field - Optional */}
          <div className="form-group mb-3">
            <label htmlFor="childPhone" className="form-label">
              <i className="fas fa-phone me-2 text-primary"></i>
              Phone Number <span className="text-muted">(Optional)</span>
            </label>
            <input
              type="tel"
              id="childPhone"
              className="form-control"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g., +250780000000"
            />
            <small className="text-muted d-block mt-1">
              Child can use this to login if provided, or use email/other methods.
            </small>
          </div>

          {/* Password Field - Only for new children */}
          {!editingChild && (
            <div className="form-group mb-3">
              <label htmlFor="childPassword" className="form-label">
                <i className="fas fa-lock me-2 text-primary"></i>
                Initial Password
              </label>
              <input
                type="password"
                id="childPassword"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Set a strong password"
                required={!editingChild}
              />
              <small className="text-muted d-block mt-1">
                Child will use this to login. They can change it later.
              </small>
            </div>
          )}

          {/* Form Actions */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingChild ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <i className={`fas fa-${editingChild ? 'save' : 'plus'} me-2`}></i>
                  {editingChild ? 'Update Child' : 'Add Child'}
                </>
              )}
            </button>
            {editingChild && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onEditComplete?.()}
                disabled={isLoading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="alert alert-info mt-3 mb-0 small">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> After adding a child, you'll be able to monitor their menstrual cycle, meals, and appointments from this dashboard.
        </div>
      </div>
    </div>
  );
};
