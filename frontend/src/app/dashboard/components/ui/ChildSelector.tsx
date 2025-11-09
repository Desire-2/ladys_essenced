import React from 'react';
import { Child } from '../../types';

interface ChildSelectorProps {
  children: Child[];
  selectedChild: number | null;
  setSelectedChild: (id: number | null) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  children,
  selectedChild,
  setSelectedChild
}) => {
  if (children.length === 0) {
    return null;
  }

  return (
    <div className="card mb-3 mb-md-4">
      <div className="card-body p-2 p-md-3">
        <h5 className="card-title small mb-2">Viewing Data For:</h5>
        <div className="d-flex flex-wrap gap-2" role="group">
          <button 
            type="button" 
            className={`btn btn-sm ${!selectedChild ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-md-grow-0`}
            onClick={() => setSelectedChild(null)}
          >
            Myself
          </button>
          {children.map(child => (
            <button 
              key={child.id}
              type="button" 
              className={`btn btn-sm ${selectedChild === child.user_id ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-md-grow-0`}
              onClick={() => setSelectedChild(child.user_id || null)}
            >
              {child.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};