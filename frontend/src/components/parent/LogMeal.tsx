import React, { useState } from 'react';

interface LogMealProps {
  childId: number;
  childName: string;
  onSuccess?: () => void;
}

export const LogMeal: React.FC<LogMealProps> = ({ childId, childName, onSuccess }) => {
  const [formData, setFormData] = useState({
    meal_type: 'lunch',
    meal_time: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.meal_time) {
      setError('Please enter meal time');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter meal description');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const submitData = {
        meal_type: formData.meal_type,
        meal_time: formData.meal_time,
        description: formData.description,
        calories: formData.calories ? parseInt(formData.calories) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        carbs: formData.carbs ? parseFloat(formData.carbs) : null,
        fat: formData.fat ? parseFloat(formData.fat) : null
      };

      const response = await fetch('http://localhost:5001/api/meal-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log meal');
      }

      setSuccess(`Meal logged successfully for ${childName}!`);
      setFormData({
        meal_type: 'lunch',
        meal_time: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      });

      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to log meal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <h5 className="mb-0 text-white">
          <i className="fas fa-utensils me-2"></i>
          Log Meal for {childName}
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
          <div className="row">
            {/* Meal Type */}
            <div className="col-md-6 mb-3">
              <label htmlFor="mealType" className="form-label">
                <i className="fas fa-list me-2 text-primary"></i>
                Meal Type *
              </label>
              <select
                id="mealType"
                className="form-control"
                name="meal_type"
                value={formData.meal_type}
                onChange={handleChange}
                required
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Meal Time */}
            <div className="col-md-6 mb-3">
              <label htmlFor="mealTime" className="form-label">
                <i className="fas fa-clock me-2 text-primary"></i>
                Time *
              </label>
              <input
                type="time"
                id="mealTime"
                className="form-control"
                name="meal_time"
                value={formData.meal_time}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="col-12 mb-3">
              <label htmlFor="description" className="form-label">
                <i className="fas fa-file-alt me-2 text-primary"></i>
                Meal Description *
              </label>
              <textarea
                id="description"
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Rice with vegetables and chicken"
                required
              />
            </div>

            {/* Calories */}
            <div className="col-md-6 mb-3">
              <label htmlFor="calories" className="form-label">
                <i className="fas fa-fire me-2 text-primary"></i>
                Calories (kcal)
              </label>
              <input
                type="number"
                id="calories"
                className="form-control"
                name="calories"
                value={formData.calories}
                onChange={handleChange}
                placeholder="e.g., 500"
                min="0"
              />
            </div>

            {/* Protein */}
            <div className="col-md-6 mb-3">
              <label htmlFor="protein" className="form-label">
                <i className="fas fa-dumbbell me-2 text-primary"></i>
                Protein (g)
              </label>
              <input
                type="number"
                id="protein"
                className="form-control"
                name="protein"
                value={formData.protein}
                onChange={handleChange}
                placeholder="e.g., 25"
                min="0"
                step="0.1"
              />
            </div>

            {/* Carbs */}
            <div className="col-md-6 mb-3">
              <label htmlFor="carbs" className="form-label">
                <i className="fas fa-breadSlice me-2 text-primary"></i>
                Carbs (g)
              </label>
              <input
                type="number"
                id="carbs"
                className="form-control"
                name="carbs"
                value={formData.carbs}
                onChange={handleChange}
                placeholder="e.g., 60"
                min="0"
                step="0.1"
              />
            </div>

            {/* Fat */}
            <div className="col-md-6 mb-3">
              <label htmlFor="fat" className="form-label">
                <i className="fas fa-droplet me-2 text-primary"></i>
                Fat (g)
              </label>
              <input
                type="number"
                id="fat"
                className="form-control"
                name="fat"
                value={formData.fat}
                onChange={handleChange}
                placeholder="e.g., 15"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Log Meal
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="alert alert-info mt-3 mb-0 small">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> Tracking meals helps monitor nutrition and identify eating patterns.
        </div>
      </div>
    </div>
  );
};
