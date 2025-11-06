import React, { useState } from 'react';
import { useChildAccess } from '@/contexts/ChildAccessContext';
import './child-switcher.css';

interface ChildSwitcherProps {
  className?: string;
  showLabel?: boolean;
  asDropdown?: boolean;
}

export const ChildSwitcher: React.FC<ChildSwitcherProps> = ({ 
  className = '', 
  showLabel = true,
  asDropdown = true 
}) => {
  const { accessedChild, parentChildren, switchToChild, clearAccessedChild } = useChildAccess();
  const [isOpen, setIsOpen] = useState(false);

  const handleChildSelect = (childId: number) => {
    switchToChild(childId);
    setIsOpen(false);
  };

  const handleClearAccess = () => {
    clearAccessedChild();
    setIsOpen(false);
  };

  if (!parentChildren || parentChildren.length === 0) {
    return null;
  }

  if (asDropdown) {
    return (
      <div className={`child-switcher-dropdown ${className}`}>
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-primary dropdown-toggle"
            type="button"
            id="childSwitcherDropdown"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <i className="fas fa-child me-2"></i>
            {accessedChild ? `View as: ${accessedChild.name}` : 'Select Child'}
            <i className="fas fa-caret-down ms-2"></i>
          </button>

          {isOpen && (
            <div className="dropdown-menu show">
              <div className="dropdown-header">
                <strong>Select a Child to Monitor</strong>
              </div>
              <div className="dropdown-divider"></div>

              {parentChildren.map((child: any) => (
                <button
                  key={child.id}
                  className={`dropdown-item ${accessedChild?.id === child.id ? 'active' : ''}`}
                  onClick={() => handleChildSelect(child.id)}
                  type="button"
                >
                  <i className="fas fa-child me-2"></i>
                  <span className="fw-500">{child.name}</span>
                  <small className="d-block text-muted ms-4">
                    Age: {calculateAge(child.date_of_birth)} • {child.relationship}
                  </small>
                </button>
              ))}

              {accessedChild && (
                <>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item text-warning"
                    onClick={handleClearAccess}
                    type="button"
                  >
                    <i className="fas fa-times-circle me-2"></i>
                    Clear Access
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pill/Button format
  return (
    <div className={`child-switcher-pills ${className}`}>
      {parentChildren.map((child: any) => (
        <button
          key={child.id}
          className={`child-pill ${accessedChild?.id === child.id ? 'active' : ''}`}
          onClick={() => handleChildSelect(child.id)}
          title={`View as ${child.name}`}
        >
          <i className="fas fa-child me-1"></i>
          {child.name}
        </button>
      ))}
      {accessedChild && (
        <button
          className="child-pill clear-pill"
          onClick={handleClearAccess}
          title="Clear access"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

// Helper function to calculate age
function calculateAge(dateOfBirth: string): string {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age}y`;
}

export default ChildSwitcher;
