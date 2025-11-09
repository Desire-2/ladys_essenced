import React from 'react';
import { Child } from '../../types';

interface MealsTabProps {
  selectedChild: number | null;
  children: Child[];
  onMealSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  mealError?: string;
}

export const MealsTab: React.FC<MealsTabProps> = ({
  selectedChild,
  children,
  onMealSubmit,
  mealError
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Meal Logging</h3>
        {selectedChild && (
          <small className="text-muted">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
        )}
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h4>Add New Meal</h4>
              </div>
              <div className="card-body">
                <form onSubmit={onMealSubmit}>
                  {mealError && <div className="alert alert-danger">{mealError}</div>}
                  <div className="form-group mb-3">
                    <label htmlFor="mealType" className="form-label">Meal Type</label>
                    <select className="form-control" id="mealType" name="mealType" required>
                      <option value="">Select meal type</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="mealDate" className="form-label">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      id="mealDate" 
                      name="mealDate"
                      required 
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="mealDetails" className="form-label">Meal Details</label>
                    <textarea 
                      className="form-control" 
                      id="mealDetails" 
                      name="mealDetails"
                      rows={3}
                      placeholder="Describe what was eaten..."
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">Save Meal</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h4>Nutrition Recommendations</h4>
              </div>
              <div className="card-body">
                <p>Based on menstrual cycle data, consider including these nutrients:</p>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6><i className="fas fa-heartbeat text-danger"></i> Iron-rich foods</h6>
                      <small>Red meat, spinach, beans, lentils</small>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6><i className="fas fa-bone text-secondary"></i> Calcium</h6>
                      <small>Dairy products, fortified plant milks</small>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6><i className="fas fa-leaf text-success"></i> Magnesium</h6>
                      <small>Nuts, seeds, whole grains</small>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6><i className="fas fa-fish text-info"></i> Omega-3</h6>
                      <small>Fatty fish, flaxseeds, walnuts</small>
                    </div>
                  </div>
                </div>
                <div className="alert alert-info mt-3">
                  <small>💧 Stay hydrated and limit caffeine and alcohol during menstruation.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};