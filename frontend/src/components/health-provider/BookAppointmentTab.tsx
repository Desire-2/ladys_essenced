'use client';

import { useState } from 'react';
import type { HealthProvider } from '../../types/health-provider';
import { getUniqueSpecializations, getUniqueLocations } from '../../utils/health-provider';

interface BookAppointmentTabProps {
  availableProviders: HealthProvider[];
  onProviderSelect: (provider: HealthProvider) => void;
}

export default function BookAppointmentTab({ 
  availableProviders, 
  onProviderSelect 
}: BookAppointmentTabProps) {
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Filter providers based on search criteria
  const filteredProviders = availableProviders.filter(provider => {
    const searchMatch = !providerSearchTerm || 
      provider.name.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      provider.specialization.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      provider.clinic_name.toLowerCase().includes(providerSearchTerm.toLowerCase());
    
    const specializationMatch = !specializationFilter || provider.specialization === specializationFilter;
    const locationMatch = !locationFilter || provider.clinic_address?.includes(locationFilter);
    
    return searchMatch && specializationMatch && locationMatch;
  });

  const handleProviderSelection = (provider: HealthProvider) => {
    setSelectedProvider(provider);
    setShowProviderDropdown(false);
    onProviderSelect(provider);
  };

  return (
    <div className="row">
      <div className="col-md-12">
        <div className="card">
          <div className="card-header">
            <h5>
              <i className="fas fa-plus-circle me-2"></i>
              Book Appointment with Health Provider
            </h5>
          </div>
          <div className="card-body">
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
                    value={providerSearchTerm}
                    onChange={(e) => setProviderSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Filter by Specialization</label>
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
              <div className="col-md-4">
                <label className="form-label">Filter by Location</label>
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
            </div>

            {/* Provider Selection */}
            <div className="row mb-4">
              <div className="col-md-8">
                <label className="form-label">Select Health Provider</label>
                <div className="dropdown provider-dropdown">
                  <button
                    className="btn btn-outline-primary dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                    type="button"
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    style={{ textAlign: 'left' }}
                  >
                    {selectedProvider ? (
                      <span>
                        <i className="fas fa-user-md me-2"></i>
                        {selectedProvider.name} - {selectedProvider.specialization}
                      </span>
                    ) : (
                      <span>
                        <i className="fas fa-user-md me-2"></i>
                        Choose a provider...
                      </span>
                    )}
                    <i className={`fas fa-chevron-${showProviderDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  {showProviderDropdown && (
                    <div className="dropdown-menu show w-100" style={{ maxHeight: '300px', overflowY: 'auto', position: 'absolute', zIndex: 1000 }}>
                      {filteredProviders.length === 0 ? (
                        <div className="dropdown-item-text text-muted">
                          <i className="fas fa-info-circle me-2"></i>
                          No providers found matching your criteria
                        </div>
                      ) : (
                        filteredProviders.map((provider) => (
                          <button
                            key={provider.id}
                            className="dropdown-item"
                            onClick={() => handleProviderSelection(provider)}
                          >
                            <div className="d-flex flex-column">
                              <strong>{provider.name}</strong>
                              <small className="text-muted">{provider.specialization} - {provider.clinic_name}</small>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Search Results</label>
                <div className="alert alert-info mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Found {filteredProviders.length} of {availableProviders.length} providers
                  {filteredProviders.length !== availableProviders.length && (
                    <div className="small mt-1">
                      <button 
                        className="btn btn-link btn-sm p-0"
                        onClick={() => {
                          setProviderSearchTerm('');
                          setSpecializationFilter('');
                          setLocationFilter('');
                        }}
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* No Selection State */}
            {!selectedProvider && availableProviders.length > 0 && (
              <div className="text-center py-5">
                <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Select a Health Provider</h5>
                <p className="text-muted">Use the dropdown above to choose a provider and view their available appointment slots.</p>
              </div>
            )}

            {/* Loading State */}
            {availableProviders.length === 0 && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading providers...</span>
                </div>
                <p className="mt-2 text-muted">Loading available providers...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
