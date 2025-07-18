import React from 'react';
import type { ProviderProfile } from '../page';

interface ProfileModalProps {
  profile: ProviderProfile;
  show: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ProviderProfile>) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, show, onClose, onSave }) => {
  const [form, setForm] = React.useState(profile);

  React.useEffect(() => {
    setForm(profile);
  }, [profile]);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Provider Profile</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Specialization</label>
                    <input type="text" className="form-control" name="specialization" value={form.specialization} onChange={handleChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Clinic Name</label>
                    <input type="text" className="form-control" name="clinic_name" value={form.clinic_name} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Clinic Address</label>
                    <textarea className="form-control" name="clinic_address" rows={2} value={form.clinic_address} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">License Number</label>
                <input type="text" className="form-control" value={form.license_number} disabled />
                <small className="text-muted">Contact administration to update license number</small>
              </div>
              <div className="mb-3">
                <div className="d-flex align-items-center">
                  <span className="me-2">Verification Status:</span>
                  {form.is_verified ? (
                    <span className="badge bg-success">
                      <i className="fas fa-check-circle me-1"></i>
                      Verified
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark">
                      <i className="fas fa-clock me-1"></i>
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default ProfileModal;
