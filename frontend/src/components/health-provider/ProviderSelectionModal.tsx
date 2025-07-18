'use client';

import { useState } from 'react';
import type { HealthProvider } from '../../types/health-provider';
import { getUniqueSpecializations, getUniqueLocations } from '../../utils/health-provider';

interface ProviderSelectionModalProps {
  availableProviders: HealthProvider[];
  onProviderSelect: (provider: HealthProvider) => void;
  onClose: () => void;
  show: boolean;
}

export default function ProviderSelectionModal({ 
  availableProviders, 
  onProviderSelect, 
  onClose, 
  show 
}: ProviderSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);

  // Filter providers based on search criteria
  const filteredProviders = availableProviders.filter(provider => {
    const searchMatch = !searchTerm || 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.clinic_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const specializationMatch = !specializationFilter || provider.specialization === specializationFilter;
    const locationMatch = !locationFilter || provider.clinic_address?.includes(locationFilter);
    
    return searchMatch && specializationMatch && locationMatch;
  });

  const handleProviderClick = (provider: HealthProvider) => {
    setSelectedProvider(provider);
  };

  const handleConfirmSelection = () => {
    if (selectedProvider) {
      onProviderSelect(selectedProvider);
      onClose();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSpecializationFilter('');
    setLocationFilter('');
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-user-md me-2"></i>
              Select Healthcare Provider
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Search and Filter Section */}
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label">Search Provider</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, specialization, or clinic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Specialization</label>
                <select
                  className="form-select"
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {getUniqueSpecializations(availableProviders).map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Location</label>
                <select
                  className="form-select"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {getUniqueLocations(availableProviders).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-2">
                <label className="form-label">Actions</label>
                <div className="d-flex gap-1">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                    title="Clear all filters"
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Available Providers ({filteredProviders.length})
              </h6>
              {selectedProvider && (
                <div className="badge bg-primary">
                  <i className="fas fa-check me-1"></i>
                  Provider Selected
                </div>
              )}
            </div>

            {/* Providers Grid */}
            <div className="providers-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredProviders.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No providers found</h6>
                  <p className="text-muted">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="row g-3">
                  {filteredProviders.map((provider) => (
                    <div key={provider.id} className="col-md-6 col-lg-4">
                      <div 
                        className={`card provider-card h-100 ${selectedProvider?.id === provider.id ? 'selected' : ''}`}
                        onClick={() => handleProviderClick(provider)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body">
                          <div className="d-flex align-items-start">
                            <div className="provider-avatar me-3">
                              <i className="fas fa-user-md"></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1">
                                {provider.name}
                                {selectedProvider?.id === provider.id && (
                                  <i className="fas fa-check-circle text-primary ms-2"></i>
                                )}
                              </h6>
                              <p className="card-text text-primary mb-2">
                                <i className="fas fa-stethoscope me-1"></i>
                                {provider.specialization}
                              </p>
                              <p className="card-text text-muted mb-2">
                                <i className="fas fa-hospital me-1"></i>
                                {provider.clinic_name}
                              </p>
                              {provider.clinic_address && (
                                <p className="card-text text-muted mb-2">
                                  <i className="fas fa-map-marker-alt me-1"></i>
                                  {provider.clinic_address}
                                </p>
                              )}
                              {provider.phone && (
                                <p className="card-text text-muted mb-2">
                                  <i className="fas fa-phone me-1"></i>
                                  {provider.phone}
                                </p>
                              )}
                              {provider.email && (
                                <p className="card-text text-muted mb-0">
                                  <i className="fas fa-envelope me-1"></i>
                                  {provider.email}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Provider Status */}
                          <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge bg-success-light text-success">
                                <i className="fas fa-circle me-1" style={{ fontSize: '8px' }}></i>
                                Available
                              </span>
                              <div className="text-muted small">
                                <i className="fas fa-certificate me-1"></i>
                                Verified
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={!selectedProvider}
              onClick={handleConfirmSelection}
            >
              <i className="fas fa-calendar-check me-1"></i>
              Select Provider & View Availability
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .provider-card {
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .provider-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border-color: #007bff;
        }
        
        .provider-card.selected {
          border-color: #007bff;
          background-color: #f8f9ff;
          box-shadow: 0 4px 15px rgba(0,123,255,0.2);
        }
        
        .provider-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        }
        
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.1) !important;
        }
        
        .providers-grid::-webkit-scrollbar {
          width: 6px;
        }
        
        .providers-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .providers-grid::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .providers-grid::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}
