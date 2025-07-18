'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { healthProviderService, EnhancedHealthProvider, AppointmentBookingData } from '../services/healthProvider';

interface EnhancedHealthProviderSearchProps {
  onProviderSelect?: (provider: EnhancedHealthProvider) => void;
  onBookingComplete?: (booking: AppointmentBookingData) => void;
  initialSpecialty?: string;
  showFilters?: boolean;
  compactView?: boolean;
}

export default function EnhancedHealthProviderSearch({
  onProviderSelect,
  onBookingComplete,
  initialSpecialty = '',
  showFilters = true,
  compactView = false
}: EnhancedHealthProviderSearchProps) {
  const [providers, setProviders] = useState<EnhancedHealthProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<EnhancedHealthProvider | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    specialty: initialSpecialty,
    location: '',
    availability: '',
    rating: '',
    insurance: '',
    gender: '',
    experience: '',
    languages: []
  });

  // Booking states
  const [bookingData, setBookingData] = useState<Partial<AppointmentBookingData>>({
    date: '',
    time: '',
    patient_notes: '',
    priority: 'normal',
    consultation_type: 'regular'
  });

  const healthProviderServiceInstance = healthProviderService;

  useEffect(() => {
    searchProviders();
  }, [filters, searchQuery]);

  const searchProviders = async () => {
    try {
      setLoading(true);
      const results = await healthProviderServiceInstance.searchProviders(searchQuery);
      setProviders(results);
    } catch (error) {
      console.error('Failed to search providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: EnhancedHealthProvider) => {
    setSelectedProvider(provider);
    onProviderSelect?.(provider);
  };

  const handleBookAppointment = (provider: EnhancedHealthProvider) => {
    setSelectedProvider(provider);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedProvider || !bookingData.date || !bookingData.time) return;

    try {
      const booking: AppointmentBookingData = {
        provider_id: selectedProvider.id,
        date: bookingData.date!,
        time: bookingData.time!,
        patient_notes: bookingData.patient_notes || '',
        priority: bookingData.priority || 'normal',
        consultation_type: bookingData.consultation_type || 'regular'
      };

      const result = await healthProviderServiceInstance.bookAppointment(booking);
      if (result.success) {
        setShowBookingModal(false);
        setBookingData({ date: '', time: '', patient_notes: '', priority: 'normal', consultation_type: 'regular' });
        onBookingComplete?.(booking);
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
    }
  };

  const getSpecialtyIcon = (specialty: string) => {
    const icons: { [key: string]: string } = {
      'Gynecology': 'fas fa-user-md',
      'Obstetrics': 'fas fa-baby',
      'Endocrinology': 'fas fa-microscope',
      'Dermatology': 'fas fa-hand-paper',
      'Cardiology': 'fas fa-heartbeat',
      'Mental Health': 'fas fa-brain',
      'Nutrition': 'fas fa-apple-alt',
      'General Practice': 'fas fa-stethoscope'
    };
    return icons[specialty] || 'fas fa-user-md';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'immediate': return 'success';
      case 'same-day': return 'warning';
      case 'this-week': return 'info';
      default: return 'secondary';
    }
  };

  const renderProviderCard = (provider: EnhancedHealthProvider) => (
    <motion.div
      key={provider.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card h-100 border-0 shadow-sm provider-card"
      style={{ cursor: 'pointer' }}
      onClick={() => handleProviderSelect(provider)}
    >
      <div className="card-body">
        <div className="d-flex align-items-start mb-3">
          <div className="flex-shrink-0 me-3">
            <div
              className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
              style={{ width: '60px', height: '60px' }}
            >
              <i className={getSpecialtyIcon(provider.specialization)}></i>
            </div>
          </div>
          <div className="flex-grow-1">
            <h5 className="card-title mb-1">{provider.name}</h5>
            <p className="text-muted mb-1">{provider.specialization}</p>
            <div className="d-flex align-items-center mb-2">
              <div className="stars me-2">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-star ${i < Math.floor(provider.rating) ? 'text-warning' : 'text-muted'}`}
                    style={{ fontSize: '0.8rem' }}
                  ></i>
                ))}
              </div>
              <small className="text-muted">
                {provider.rating.toFixed(1)} ({provider.patient_reviews.length} reviews)
              </small>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-map-marker-alt text-muted me-2"></i>
            <small>{provider.clinic_address}</small>
          </div>
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-clock text-muted me-2"></i>
            <small>{provider.experience_years} years experience</small>
          </div>
          {provider.languages.length > 0 && (
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-language text-muted me-2"></i>
              <small>{provider.languages.slice(0, 2).join(', ')}</small>
            </div>
          )}
        </div>

        <div className="mb-3">
          <span className={`badge bg-${getAvailabilityColor(provider.availability_summary)} me-2`}>
            {provider.availability_summary === 'immediate' ? 'Available Now' :
             provider.availability_summary === 'same-day' ? 'Same Day' :
             provider.availability_summary === 'this-week' ? 'This Week' : 'Next Available'}
          </span>
          <span className="badge bg-info">Clinic</span>
        </div>

        {provider.specialties.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">Specializations:</small>
            <div className="d-flex flex-wrap gap-1">
              {provider.specialties.slice(0, 3).map((spec: string, index: number) => (
                <span key={index} className="badge bg-light text-dark">
                  {spec}
                </span>
              ))}
              {provider.specialties.length > 3 && (
                <span className="badge bg-light text-dark">
                  +{provider.specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="d-flex gap-2 mt-auto">
          <button
            className="btn btn-outline-primary btn-sm flex-fill"
            onClick={(e) => {
              e.stopPropagation();
              handleProviderSelect(provider);
            }}
          >
            <i className="fas fa-info-circle me-1"></i>
            View Profile
          </button>
          <button
            className="btn btn-primary btn-sm flex-fill"
            onClick={(e) => {
              e.stopPropagation();
              handleBookAppointment(provider);
            }}
          >
            <i className="fas fa-calendar-plus me-1"></i>
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="enhanced-provider-search">
      {/* Search Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search providers by name, specialty, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filters.specialty}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  >
                    <option value="">All Specialties</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Obstetrics">Obstetrics</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Nutrition">Nutrition</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <i className="fas fa-th"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <i className="fas fa-list"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading providers...</span>
          </div>
        </div>
      ) : providers.length > 0 ? (
        <div className="row g-4">
          {providers.map((provider) => (
            <div key={provider.id} className="col-lg-6 col-xl-4">
              {renderProviderCard(provider)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No providers found</h5>
          <p className="text-muted">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-lg">
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="modal-content"
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    Book Appointment with {selectedProvider.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowBookingModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={bookingData.date}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Time</label>
                      <select
                        className="form-select"
                        value={bookingData.time}
                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      >
                        <option value="">Select time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Consultation Type</label>
                      <select
                        className="form-select"
                        value={bookingData.consultation_type}
                        onChange={(e) => setBookingData({ ...bookingData, consultation_type: e.target.value as any })}
                      >
                        <option value="in-person">In-person</option>
                        <option value="video">Video Call</option>
                        <option value="phone">Phone Call</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Issue/Concern</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Brief description of your concern"
                        value={bookingData.patient_notes}
                        onChange={(e) => setBookingData({ ...bookingData, patient_notes: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={bookingData.priority}
                        onChange={(e) => setBookingData({ ...bookingData, priority: e.target.value as any })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Additional Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Any additional information for the provider"
                        value={bookingData.patient_notes}
                        onChange={(e) => setBookingData({ ...bookingData, patient_notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBookingSubmit}
                    disabled={!bookingData.date || !bookingData.time}
                  >
                    <i className="fas fa-calendar-check me-1"></i>
                    Book Appointment
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
