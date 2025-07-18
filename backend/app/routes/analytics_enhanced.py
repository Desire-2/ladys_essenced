# Enhanced Backend Routes for Frontend Integration

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, HealthProvider, Appointment, CycleLog, MealLog, Notification
from app import db
from datetime import datetime, timedelta
import json
from sqlalchemy import func, desc, and_, or_

# Create blueprint for enhanced analytics
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Get comprehensive dashboard analytics for a user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get date range for analytics (last 6 months)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)

        # Cycle Metrics
        cycle_logs = CycleLog.query.filter(
            CycleLog.user_id == user_id,
            CycleLog.start_date >= start_date
        ).order_by(desc(CycleLog.start_date)).all()

        cycle_metrics = calculate_cycle_metrics(cycle_logs)

        # Nutrition Metrics
        meal_logs = MealLog.query.filter(
            MealLog.user_id == user_id,
            MealLog.meal_time >= start_date
        ).all()

        nutrition_metrics = calculate_nutrition_metrics(meal_logs)

        # Mental Health Metrics (placeholder for future implementation)
        mental_health_metrics = {
            'averageMoodScore': 7.2,
            'stressLevel': 4.1,
            'sleepQuality': 7.8,
            'anxietyLevel': 3.2,
            'depressionRisk': 'low',
            'weeklyMoodTrend': generate_mood_trend()
        }

        # Appointment Metrics
        appointments = Appointment.query.filter(
            Appointment.user_id == user_id,
            Appointment.appointment_date >= start_date
        ).all()

        appointment_metrics = calculate_appointment_metrics(appointments)

        analytics_data = {
            'cycleMetrics': cycle_metrics,
            'nutritionMetrics': nutrition_metrics,
            'mentalHealthMetrics': mental_health_metrics,
            'appointmentMetrics': appointment_metrics
        }

        return jsonify(analytics_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/cycle-insights', methods=['GET'])
@jwt_required()
def get_cycle_insights():
    """Get AI-powered cycle insights and predictions"""
    try:
        user_id = get_jwt_identity()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Get cycle data for analysis
        query = CycleLog.query.filter(CycleLog.user_id == user_id)
        
        if start_date:
            query = query.filter(CycleLog.start_date >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(CycleLog.start_date <= datetime.fromisoformat(end_date))

        cycle_logs = query.order_by(desc(CycleLog.start_date)).all()

        insights = generate_cycle_insights(cycle_logs)

        return jsonify({'insights': insights}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/providers', methods=['GET'])
@jwt_required()
def get_provider_analytics():
    """Get health provider analytics and statistics"""
    try:
        user_id = get_jwt_identity()

        # Get provider statistics
        total_providers = HealthProvider.query.filter(HealthProvider.is_active == True).count()
        
        # Calculate average rating
        avg_rating = db.session.query(func.avg(HealthProvider.rating)).scalar() or 0

        # Get appointment success rate
        total_appointments = Appointment.query.count()
        completed_appointments = Appointment.query.filter(Appointment.status == 'completed').count()
        success_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0

        # Get specialization distribution
        specializations = db.session.query(
            HealthProvider.specialization,
            func.count(HealthProvider.id)
        ).group_by(HealthProvider.specialization).all()

        specialization_dict = {spec[0]: spec[1] for spec in specializations}

        # Get top rated providers
        top_providers = HealthProvider.query.filter(
            HealthProvider.is_active == True
        ).order_by(desc(HealthProvider.rating)).limit(5).all()

        top_providers_data = [{
            'id': provider.id,
            'name': provider.name,
            'rating': provider.rating or 0,
            'totalAppointments': len(provider.appointments)
        } for provider in top_providers]

        analytics_data = {
            'totalProviders': total_providers,
            'averageRating': round(avg_rating, 1),
            'appointmentSuccess': round(success_rate, 1),
            'responseTime': 4.2,  # Mock data for now
            'specializations': specialization_dict,
            'topRatedProviders': top_providers_data
        }

        return jsonify(analytics_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions
def calculate_cycle_metrics(cycle_logs):
    """Calculate comprehensive cycle metrics"""
    if not cycle_logs:
        return {
            'averageCycleLength': None,
            'averagePeriodLength': None,
            'cycleVariability': None,
            'nextPeriodPrediction': None,
            'fertilityWindow': None,
            'cyclePhase': 'unknown',
            'cycleDay': 0,
            'totalCycles': 0
        }

    # Calculate average cycle length
    cycle_lengths = []
    for i in range(len(cycle_logs) - 1):
        current = cycle_logs[i].start_date
        previous = cycle_logs[i + 1].start_date
        cycle_length = (current - previous).days
        if 20 <= cycle_length <= 40:  # Reasonable cycle length
            cycle_lengths.append(cycle_length)

    avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else 28

    # Calculate average period length
    period_lengths = [
        (log.end_date - log.start_date).days 
        for log in cycle_logs 
        if log.end_date and log.start_date
    ]
    avg_period_length = sum(period_lengths) / len(period_lengths) if period_lengths else 5

    # Calculate cycle variability
    if len(cycle_lengths) > 1:
        variance = sum((x - avg_cycle_length) ** 2 for x in cycle_lengths) / len(cycle_lengths)
        cycle_variability = variance ** 0.5
    else:
        cycle_variability = 0

    # Predict next period
    last_period = cycle_logs[0].start_date if cycle_logs else None
    next_period = last_period + timedelta(days=int(avg_cycle_length)) if last_period else None

    # Calculate current cycle day
    current_cycle_day = (datetime.now().date() - last_period).days if last_period else 0

    # Determine cycle phase
    cycle_phase = determine_cycle_phase(current_cycle_day, avg_cycle_length)

    # Calculate fertility window
    fertility_window = None
    if next_period:
        ovulation_date = next_period - timedelta(days=14)
        fertility_start = ovulation_date - timedelta(days=5)
        fertility_end = ovulation_date + timedelta(days=1)
        fertility_window = {
            'start': fertility_start.isoformat(),
            'end': fertility_end.isoformat()
        }

    return {
        'averageCycleLength': round(avg_cycle_length, 1),
        'averagePeriodLength': round(avg_period_length, 1),
        'cycleVariability': round(cycle_variability, 1),
        'nextPeriodPrediction': next_period.isoformat() if next_period else None,
        'fertilityWindow': fertility_window,
        'cyclePhase': cycle_phase,
        'cycleDay': current_cycle_day,
        'totalCycles': len(cycle_logs)
    }

def calculate_nutrition_metrics(meal_logs):
    """Calculate nutrition metrics from meal logs"""
    if not meal_logs:
        return {
            'dailyCalorieAverage': 0,
            'nutritionScore': 0,
            'hydrationLevel': 0,
            'macroBreakdown': {'carbs': 0, 'protein': 0, 'fat': 0},
            'weeklyMealCount': 0,
            'favoriteFood': None
        }

    # Basic calculations (would be enhanced with proper nutrition data)
    total_meals = len(meal_logs)
    weekly_meal_count = total_meals // 4  # Approximate

    # Mock calculations for now - would integrate with nutrition API
    daily_calorie_average = 1800 + (total_meals % 200)
    nutrition_score = min(85, 60 + (total_meals % 25))
    hydration_level = min(90, 70 + (total_meals % 20))

    # Mock macro breakdown
    macro_breakdown = {
        'carbs': 45,
        'protein': 25,
        'fat': 30
    }

    # Find most common meal description
    meal_descriptions = [log.description for log in meal_logs if log.description]
    favorite_food = max(set(meal_descriptions), key=meal_descriptions.count) if meal_descriptions else None

    return {
        'dailyCalorieAverage': daily_calorie_average,
        'nutritionScore': nutrition_score,
        'hydrationLevel': hydration_level,
        'macroBreakdown': macro_breakdown,
        'weeklyMealCount': weekly_meal_count,
        'favoriteFood': favorite_food
    }

def calculate_appointment_metrics(appointments):
    """Calculate appointment metrics"""
    total_appointments = len(appointments)
    completed = len([a for a in appointments if a.status == 'completed'])
    cancelled = len([a for a in appointments if a.status == 'cancelled'])

    # Find next appointment
    future_appointments = [a for a in appointments if a.appointment_date > datetime.now()]
    next_appointment = min(future_appointments, key=lambda x: x.appointment_date) if future_appointments else None

    # Mock average wait time calculation
    average_wait_time = 12.5

    # Find favorite provider (most appointments)
    provider_counts = {}
    for appointment in appointments:
        if appointment.provider:
            provider_name = appointment.provider.name
            provider_counts[provider_name] = provider_counts.get(provider_name, 0) + 1

    favorite_provider = max(provider_counts, key=provider_counts.get) if provider_counts else None

    return {
        'totalAppointments': total_appointments,
        'completedAppointments': completed,
        'cancelledAppointments': cancelled,
        'averageWaitTime': average_wait_time,
        'nextAppointment': next_appointment.appointment_date.isoformat() if next_appointment else None,
        'favoriteProvider': favorite_provider
    }

def determine_cycle_phase(cycle_day, avg_cycle_length):
    """Determine current cycle phase based on cycle day"""
    if cycle_day <= 5:
        return 'menstrual'
    elif cycle_day <= avg_cycle_length / 2:
        return 'follicular'
    elif cycle_day <= (avg_cycle_length / 2) + 2:
        return 'ovulation'
    else:
        return 'luteal'

def generate_mood_trend():
    """Generate mock mood trend data"""
    import random
    trend = []
    base_date = datetime.now() - timedelta(days=7)
    
    for i in range(7):
        date = base_date + timedelta(days=i)
        score = round(6.5 + random.uniform(-1.5, 1.5), 1)
        trend.append({
            'date': date.strftime('%Y-%m-%d'),
            'score': score
        })
    
    return trend

def generate_cycle_insights(cycle_logs):
    """Generate AI-powered cycle insights"""
    insights = []
    
    if len(cycle_logs) >= 3:
        # Regularity insight
        cycle_lengths = []
        for i in range(len(cycle_logs) - 1):
            length = (cycle_logs[i].start_date - cycle_logs[i + 1].start_date).days
            if 20 <= length <= 40:
                cycle_lengths.append(length)
        
        if cycle_lengths:
            variability = max(cycle_lengths) - min(cycle_lengths)
            if variability <= 3:
                insights.append({
                    'insight': f'Your cycle has been consistently regular with only {variability} days variation - excellent!',
                    'type': 'pattern',
                    'confidence': 0.92,
                    'date': datetime.now().isoformat(),
                    'category': 'cycle'
                })
            elif variability <= 7:
                insights.append({
                    'insight': f'Your cycle shows normal variation of {variability} days. This is within healthy range.',
                    'type': 'pattern',
                    'confidence': 0.78,
                    'date': datetime.now().isoformat(),
                    'category': 'cycle'
                })

    # Symptom pattern insights
    recent_symptoms = []
    for log in cycle_logs[:3]:  # Last 3 cycles
        if log.symptoms:
            recent_symptoms.extend(log.symptoms)
    
    if recent_symptoms:
        common_symptoms = max(set(recent_symptoms), key=recent_symptoms.count)
        insights.append({
            'insight': f'Your most common symptom is {common_symptoms}. Consider tracking severity for better management.',
            'type': 'recommendation',
            'confidence': 0.85,
            'date': datetime.now().isoformat(),
            'category': 'symptoms'
        })

    # Ovulation prediction
    if cycle_logs:
        last_period = cycle_logs[0].start_date
        next_ovulation = last_period + timedelta(days=14)
        days_to_ovulation = (next_ovulation - datetime.now().date()).days
        
        if 0 <= days_to_ovulation <= 3:
            insights.append({
                'insight': f'Based on your cycle pattern, ovulation may occur in {days_to_ovulation} days.',
                'type': 'prediction',
                'confidence': 0.78,
                'date': datetime.now().isoformat(),
                'category': 'fertility'
            })

    return insights
