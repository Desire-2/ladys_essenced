import React, { useState, useEffect } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface ChildProfileProps {
  childId: number;
  childName: string;
  childData?: any;
  onDataUpdated?: () => void;
}

export const ChildProfile: React.FC<ChildProfileProps> = ({ 
  childId, 
  childName, 
  childData,
  onDataUpdated 
}) => {
  const { childrenList, updateChild } = useParent();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: childName,
    date_of_birth: '',
    relationship_type: '',
    phone_number: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (childData) {
      setFormData({
        name: childData.name || childName,
        date_of_birth: childData.date_of_birth ? childData.date_of_birth.split('T')[0] : '',
        relationship_type: childData.relationship || '',
        phone_number: childData.phone_number || ''
      });
    }
  }, [childData, childName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Child name is required');
      return;
    }

    if (!formData.date_of_birth) {
      setError('Date of birth is required');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        relationship_type: formData.relationship_type
      };

      if (formData.phone_number.trim()) {
        Object.assign(submitData, { phone_number: formData.phone_number });
      }

      await updateChild(childId, submitData);
      setSuccess('Child information updated successfully!');
      setIsEditing(false);

      setTimeout(() => {
        setSuccess('');
        onDataUpdated?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update child information');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    // View Mode
    return (
      <div className="card h-100">
        <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">
              <i className="fas fa-user-circle me-2"></i>
              {childName}'s Profile
            </h5>
            <button
              className="btn btn-sm btn-light"
              onClick={() => setIsEditing(true)}
              title="Edit child information"
            >
              <i className="fas fa-edit me-1"></i>
              Edit
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <small className="text-muted d-block mb-1">
                <i className="fas fa-user me-2 text-primary"></i>
                Full Name
              </small>
              <h6 className="mb-0">{formData.name}</h6>
            </div>

            <div className="col-md-6 mb-3">
              <small className="text-muted d-block mb-1">
                <i className="fas fa-birthday-cake me-2 text-primary"></i>
                Age
              </small>
              <h6 className="mb-0">{calculateAge(formData.date_of_birth)} years</h6>
            </div>

            <div className="col-md-6 mb-3">
              <small className="text-muted d-block mb-1">
                <i className="fas fa-calendar me-2 text-primary"></i>
                Date of Birth
              </small>
              <h6 className="mb-0">{formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'N/A'}</h6>
            </div>

            <div className="col-md-6 mb-3">
              <small className="text-muted d-block mb-1">
                <i className="fas fa-heart me-2 text-primary"></i>
                Relationship
              </small>
              <h6 className="mb-0 text-capitalize">
                {formData.relationship_type || 'N/A'}
              </h6>
            </div>

            {formData.phone_number && (
              <div className="col-md-6 mb-3">
                <small className="text-muted d-block mb-1">
                  <i className="fas fa-phone me-2 text-primary"></i>
                  Phone Number
                </small>
                <h6 className="mb-0">{formData.phone_number}</h6>
              </div>
            )}

            <div className="col-12">
              <div className="alert alert-info small mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Tip:</strong> Click Edit to update child's information or add/update phone number.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h5 className="mb-0 text-white">
          <i className="fas fa-edit me-2"></i>
          Edit {childName}'s Information
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
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              <i className="fas fa-user me-2 text-primary"></i>
              Child's Name *
            </label>
            <input
              type="text"
              id="name"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter child's full name"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="mb-3">
            <label htmlFor="dob" className="form-label">
              <i className="fas fa-birthday-cake me-2 text-primary"></i>
              Date of Birth *
            </label>
            <input
              type="date"
              id="dob"
              className="form-control"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
            {formData.date_of_birth && (
              <small className="text-muted d-block mt-1">
                Age: {calculateAge(formData.date_of_birth)} years old
              </small>
            )}
          </div>

          {/* Relationship */}
          <div className="mb-3">
            <label htmlFor="relationship" className="form-label">
              <i className="fas fa-heart me-2 text-primary"></i>
              Relationship *
            </label>
            <select
              id="relationship"
              className="form-control"
              name="relationship_type"
              value={formData.relationship_type}
              onChange={handleChange}
              required
            >
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          {/* Phone Number */}
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              <i className="fas fa-phone me-2 text-primary"></i>
              Phone Number <span className="text-muted">(Optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              className="form-control"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g., +250780000000"
            />
          </div>

          {/* Buttons */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              <i className="fas fa-times me-2"></i>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
