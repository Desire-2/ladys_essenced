'use client';

import type { Patient } from '../../types/health-provider';
import { formatDate, getStatusBadgeClass } from '../../utils/health-provider';

interface PatientsTabProps {
  patients: Patient[];
  onViewPatientHistory: (patientId: number) => void;
}

export default function PatientsTab({ 
  patients, 
  onViewPatientHistory 
}: PatientsTabProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h5>My Patients</h5>
      </div>
      <div className="card-body">
        {patients.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Total Appointments</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.id}>
                    <td><strong>{patient.name}</strong></td>
                    <td>
                      <div>
                        <i className="fas fa-phone me-1"></i>{patient.phone_number}
                        <br />
                        <small><i className="fas fa-envelope me-1"></i>{patient.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info">{patient.total_appointments}</span>
                    </td>
                    <td>
                      {patient.last_appointment ? 
                        formatDate(patient.last_appointment) : 
                        <span className="text-muted">No visits</span>
                      }
                    </td>
                    <td>
                      {patient.last_appointment_status && (
                        <span className={`badge ${getStatusBadgeClass(patient.last_appointment_status)}`}>
                          {patient.last_appointment_status}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => onViewPatientHistory(patient.id)}
                        >
                          <i className="fas fa-eye me-1"></i>
                          View History
                        </button>
                        {patient.phone_number && (
                          <a 
                            href={`tel:${patient.phone_number}`}
                            className="btn btn-outline-success"
                          >
                            <i className="fas fa-phone"></i>
                          </a>
                        )}
                        {patient.email && (
                          <a 
                            href={`mailto:${patient.email}`}
                            className="btn btn-outline-info"
                          >
                            <i className="fas fa-envelope"></i>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <p>No patients yet</p>
            <small className="text-muted">Patients will appear here after you complete appointments</small>
          </div>
        )}
      </div>
    </div>
  );
}
