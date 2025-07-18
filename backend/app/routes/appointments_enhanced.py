from app.models import (
    Appointment, HealthProvider, User, AppointmentType, 
    AppointmentReview, AppointmentSlot, WaitingList, Notification
)
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, time, date
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import joinedload
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

appointments_enhanced_bp = Blueprint('appointments_enhanced', __name__)

# ============================================================================
# APPOINTMENT BOOKING ENDPOINTS
# ============================================================================

@appointments_enhanced_bp.route('/search-providers', methods=['GET'])
@jwt_required()
def search_providers():
    """Advanced provider search with filtering, sorting, and pagination"""
    try:
        # Get search parameters
        specialization = request.args.get('specialization', '').strip()
        location = request.args.get('location', '').strip()
        availability_date = request.args.get('availability_date')  # YYYY-MM-DD
        min_rating = request.args.get('min_rating', type=float)
        max_fee = request.args.get('max_fee', type=float)
        emergency_available = request.args.get('emergency_available', type=bool)
        telemedicine = request.args.get('telemedicine', type=bool)
        accepts_insurance = request.args.get('accepts_insurance', type=bool)
        language = request.args.get('language', '').strip()
        sort_by = request.args.get('sort_by', 'rating')  # rating, experience, fee, availability
        sort_order = request.args.get('sort_order', 'desc')  # asc, desc
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        
        # Base query
        query = db.session.query(HealthProvider).join(User).filter(
            HealthProvider.is_verified == True,
            HealthProvider.is_accepting_new_patients == True,
            User.is_active == True
        )
        
        # Apply filters
        if specialization:
            query = query.filter(HealthProvider.specialization.ilike(f'%{specialization}%'))
            
        if location:
            query = query.filter(HealthProvider.clinic_address.ilike(f'%{location}%'))
            
        if min_rating is not None:
            query = query.filter(HealthProvider.rating >= min_rating)
            
        if max_fee is not None:
            query = query.filter(
                or_(
                    HealthProvider.consultation_fee <= max_fee,
                    HealthProvider.consultation_fee == None
                )
            )
            
        if emergency_available is not None:
            query = query.filter(HealthProvider.emergency_available == emergency_available)
            
        if telemedicine is not None:
            query = query.filter(HealthProvider.telemedicine_available == telemedicine)
            
        if accepts_insurance is not None:
            query = query.filter(HealthProvider.accepts_insurance == accepts_insurance)
            
        if language:
            query = query.filter(HealthProvider.languages_spoken.ilike(f'%{language}%'))
        
        # Apply sorting
        if sort_by == 'rating':
            order_col = HealthProvider.rating
        elif sort_by == 'experience':
            order_col = HealthProvider.experience_years
        elif sort_by == 'fee':
            order_col = HealthProvider.consultation_fee
        elif sort_by == 'availability':
            order_col = HealthProvider.last_active
        else:
            order_col = HealthProvider.rating
            
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Paginate
        providers_paginated = query.paginate(page=page, per_page=per_page)
        
        # Format results with availability check
        providers_list = []
        for provider in providers_paginated.items:
            provider_data = provider.to_dict()
            
            # Check real-time availability if date specified
            if availability_date:
                try:
                    check_date = datetime.strptime(availability_date, '%Y-%m-%d').date()
                    available_slots = get_provider_available_slots_count(provider.id, check_date)
                    provider_data['available_slots_on_date'] = available_slots
                    provider_data['has_availability_on_date'] = available_slots > 0
                except ValueError:
                    provider_data['available_slots_on_date'] = None
                    provider_data['has_availability_on_date'] = None
            
            # Add next available slot info
            next_slot = get_provider_next_available_slot(provider.id, days_ahead=14)
            provider_data['next_available_slot'] = next_slot
            
            providers_list.append(provider_data)
        
        return jsonify({
            'providers': providers_list,
            'pagination': {
                'current_page': page,
                'total_pages': providers_paginated.pages,
                'total_items': providers_paginated.total,
                'per_page': per_page,
                'has_next': providers_paginated.has_next,
                'has_prev': providers_paginated.has_prev
            },
            'filters_applied': {
                'specialization': specialization,
                'location': location,
                'availability_date': availability_date,
                'min_rating': min_rating,
                'max_fee': max_fee,
                'emergency_available': emergency_available,
                'telemedicine': telemedicine,
                'accepts_insurance': accepts_insurance,
                'language': language
            },
            'sorting': {
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching providers: {str(e)}")
        return jsonify({'error': 'Failed to search providers', 'message': str(e)}), 500


@appointments_enhanced_bp.route('/providers/<int:provider_id>/detailed-info', methods=['GET'])
@jwt_required()
def get_provider_detailed_info(provider_id):
    """Get comprehensive provider information including reviews, availability, etc."""
    try:
        provider = HealthProvider.query.options(joinedload(HealthProvider.user)).get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # Get provider basic info
        provider_data = provider.to_dict()
        
        # Get reviews and ratings summary
        reviews = AppointmentReview.query.filter_by(provider_id=provider_id).all()
        
        if reviews:
            total_reviews = len(reviews)
            avg_overall = sum(r.overall_rating for r in reviews) / total_reviews
            avg_communication = sum(r.communication_rating for r in reviews if r.communication_rating) / len([r for r in reviews if r.communication_rating]) if any(r.communication_rating for r in reviews) else None
            avg_punctuality = sum(r.punctuality_rating for r in reviews if r.punctuality_rating) / len([r for r in reviews if r.punctuality_rating]) if any(r.punctuality_rating for r in reviews) else None
            avg_facility = sum(r.facility_rating for r in reviews if r.facility_rating) / len([r for r in reviews if r.facility_rating]) if any(r.facility_rating for r in reviews) else None
            avg_professionalism = sum(r.professionalism_rating for r in reviews if r.professionalism_rating) / len([r for r in reviews if r.professionalism_rating]) if any(r.professionalism_rating for r in reviews) else None
            
            recommend_count = sum(1 for r in reviews if r.would_recommend)
            recommend_percentage = (recommend_count / total_reviews * 100) if total_reviews > 0 else 0
            
            # Get recent reviews (last 5)
            recent_reviews = AppointmentReview.query.filter_by(provider_id=provider_id)\
                .order_by(desc(AppointmentReview.created_at))\
                .limit(5).all()
            
            reviews_data = {
                'total_reviews': total_reviews,
                'average_ratings': {
                    'overall': round(avg_overall, 1),
                    'communication': round(avg_communication, 1) if avg_communication else None,
                    'punctuality': round(avg_punctuality, 1) if avg_punctuality else None,
                    'facility': round(avg_facility, 1) if avg_facility else None,
                    'professionalism': round(avg_professionalism, 1) if avg_professionalism else None
                },
                'recommendation_percentage': round(recommend_percentage, 1),
                'recent_reviews': [{
                    'id': review.id,
                    'overall_rating': review.overall_rating,
                    'review_text': review.review_text,
                    'pros': review.pros,
                    'cons': review.cons,
                    'would_recommend': review.would_recommend,
                    'is_verified': review.is_verified,
                    'created_at': review.created_at.isoformat(),
                    'reviewer_name': 'Anonymous' if review.is_anonymous else (review.user.name if review.user else 'Unknown')
                } for review in recent_reviews]
            }
        else:
            reviews_data = {
                'total_reviews': 0,
                'average_ratings': {
                    'overall': 0,
                    'communication': None,
                    'punctuality': None,
                    'facility': None,
                    'professionalism': None
                },
                'recommendation_percentage': 0,
                'recent_reviews': []
            }
        
        # Get availability for next 7 days
        availability_summary = get_provider_availability_summary(provider_id, days_ahead=7)
        
        # Get appointment statistics
        total_appointments = Appointment.query.filter_by(provider_id=provider_id).count()
        completed_appointments = Appointment.query.filter_by(provider_id=provider_id, status='completed').count()
        completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
        
        # Get specialization-specific appointment types
        appointment_types = AppointmentType.query.filter(
            or_(
                AppointmentType.specialization_required == provider.specialization,
                AppointmentType.specialization_required == None
            ),
            AppointmentType.is_active == True
        ).all()
        
        return jsonify({
            'provider': provider_data,
            'reviews': reviews_data,
            'availability_summary': availability_summary,
            'statistics': {
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'completion_rate': round(completion_rate, 1)
            },
            'appointment_types': [{
                'id': apt_type.id,
                'name': apt_type.name,
                'description': apt_type.description,
                'duration_minutes': apt_type.duration_minutes,
                'default_fee': apt_type.default_fee,
                'requires_preparation': apt_type.requires_preparation,
                'preparation_instructions': apt_type.preparation_instructions
            } for apt_type in appointment_types]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting provider detailed info: {str(e)}")
        return jsonify({'error': 'Failed to get provider information', 'message': str(e)}), 500


@appointments_enhanced_bp.route('/book-appointment', methods=['POST'])
@jwt_required()
def book_appointment_enhanced():
    """Enhanced appointment booking with comprehensive validation and features"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['provider_id', 'appointment_date', 'issue', 'appointment_type_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        provider_id = data['provider_id']
        appointment_date_str = data['appointment_date']
        issue = data['issue']
        appointment_type_id = data['appointment_type_id']
        
        # Parse appointment datetime
        try:
            appointment_datetime = datetime.fromisoformat(appointment_date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid appointment_date format'}), 400
        
        # Validate provider
        provider = HealthProvider.query.get(provider_id)
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        if not provider.is_verified or not provider.is_accepting_new_patients:
            return jsonify({'error': 'Provider is not available for new appointments'}), 400
        
        # Validate appointment type
        appointment_type = AppointmentType.query.get(appointment_type_id)
        if not appointment_type or not appointment_type.is_active:
            return jsonify({'error': 'Invalid appointment type'}), 400
        
        # Check if appointment time is in the future
        if appointment_datetime <= datetime.utcnow():
            return jsonify({'error': 'Appointment must be scheduled for a future date and time'}), 400
        
        # Check if the time slot is available
        slot_end_time = appointment_datetime + timedelta(minutes=appointment_type.duration_minutes)
        
        # Check for conflicts with existing appointments
        existing_appointment = Appointment.query.filter(
            Appointment.provider_id == provider_id,
            Appointment.appointment_date < slot_end_time,
            Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) > appointment_datetime,
            Appointment.status.in_(['confirmed', 'pending'])
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'This time slot is no longer available'}), 409
        
        # Check provider availability for this day/time
        if not is_provider_available(provider, appointment_datetime):
            return jsonify({'error': 'Provider is not available at this time'}), 400
        
        # Create the appointment
        appointment = Appointment(
            user_id=data.get('for_user_id', current_user_id),
            provider_id=provider_id,
            appointment_date=appointment_datetime,
            issue=issue,
            appointment_type=appointment_type.name,
            duration_minutes=appointment_type.duration_minutes,
            consultation_fee=data.get('consultation_fee', appointment_type.default_fee),
            priority=data.get('priority', 'normal'),
            status='pending',
            appointment_for=data.get('appointment_for', 'self'),
            notes=data.get('notes'),
            is_telemedicine=data.get('is_telemedicine', False),
            payment_method=data.get('payment_method'),
            location_notes=data.get('location_notes'),
            created_at=datetime.utcnow()
        )
        
        db.session.add(appointment)
        db.session.flush()  # Get the ID
        
        # Send notifications
        # Notification to provider
        provider_notification = Notification(
            user_id=provider.user_id,
            message=f"New appointment request: {appointment_datetime.strftime('%Y-%m-%d %H:%M')} - {issue[:50]}...",
            notification_type='appointment',
            is_read=False
        )
        db.session.add(provider_notification)
        
        # Confirmation notification to patient
        patient_notification = Notification(
            user_id=current_user_id,
            message=f"Appointment request submitted for {appointment_datetime.strftime('%Y-%m-%d %H:%M')} with {provider.user.name}",
            notification_type='appointment',
            is_read=False
        )
        db.session.add(patient_notification)
        
        db.session.commit()
        
        # Prepare response
        appointment_data = appointment.to_dict()
        appointment_data['provider_name'] = provider.user.name if provider.user else 'Unknown'
        appointment_data['provider_specialization'] = provider.specialization
        appointment_data['clinic_name'] = provider.clinic_name
        
        return jsonify({
            'message': 'Appointment booked successfully',
            'appointment': appointment_data,
            'next_steps': [
                'Wait for provider confirmation',
                'You will receive a notification once confirmed',
                'Arrive 15 minutes early for your appointment' if not appointment.is_telemedicine else 'Join the video call 5 minutes before the scheduled time'
            ]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error booking appointment: {str(e)}")
        return jsonify({'error': 'Failed to book appointment', 'message': str(e)}), 500


@appointments_enhanced_bp.route('/appointments/<int:appointment_id>/confirm', methods=['PUT'])
@jwt_required()
def confirm_appointment(appointment_id):
    """Confirm an appointment (for providers or patients)"""
    try:
        current_user_id = get_jwt_identity()
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check permissions (patient or provider can confirm)
        user = User.query.get(current_user_id)
        is_provider = (user.user_type == 'health_provider' and 
                      hasattr(user, 'health_provider_profile') and 
                      user.health_provider_profile.id == appointment.provider_id)
        is_patient = appointment.user_id == current_user_id
        
        if not (is_provider or is_patient):
            return jsonify({'error': 'Unauthorized to confirm this appointment'}), 403
        
        if appointment.status not in ['pending']:
            return jsonify({'error': f'Cannot confirm appointment with status: {appointment.status}'}), 400
        
        # Update appointment
        appointment.status = 'confirmed'
        appointment.confirmed_at = datetime.utcnow()
        
        # Create notifications
        if is_provider:
            # Provider confirmed - notify patient
            notification = Notification(
                user_id=appointment.user_id,
                message=f"Your appointment on {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')} has been confirmed",
                notification_type='appointment'
            )
        else:
            # Patient confirmed - notify provider
            notification = Notification(
                user_id=appointment.health_provider.user_id,
                message=f"Patient confirmed appointment on {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}",
                notification_type='appointment'
            )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment confirmed successfully',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error confirming appointment: {str(e)}")
        return jsonify({'error': 'Failed to confirm appointment', 'message': str(e)}), 500


@appointments_enhanced_bp.route('/appointments/<int:appointment_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_appointment(appointment_id):
    """Cancel an appointment with reason"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check permissions
        user = User.query.get(current_user_id)
        is_provider = (user.user_type == 'health_provider' and 
                      hasattr(user, 'health_provider_profile') and 
                      user.health_provider_profile.id == appointment.provider_id)
        is_patient = appointment.user_id == current_user_id
        
        if not (is_provider or is_patient):
            return jsonify({'error': 'Unauthorized to cancel this appointment'}), 403
        
        if appointment.status in ['cancelled', 'completed']:
            return jsonify({'error': f'Cannot cancel appointment with status: {appointment.status}'}), 400
        
        # Check cancellation timing (e.g., not within 24 hours for non-emergency)
        hours_until_appointment = (appointment.appointment_date - datetime.utcnow()).total_seconds() / 3600
        if hours_until_appointment < 24 and not appointment.is_emergency and not is_provider:
            return jsonify({
                'warning': 'Cancelling within 24 hours may incur charges',
                'confirm_required': True
            }), 200
        
        # Update appointment
        appointment.status = 'cancelled'
        appointment.cancelled_at = datetime.utcnow()
        appointment.cancellation_reason = data.get('reason', 'No reason provided')
        appointment.cancelled_by = 'provider' if is_provider else 'patient'
        
        # Create notifications
        if is_provider:
            notification_user_id = appointment.user_id
            message = f"Your appointment on {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')} has been cancelled by the provider"
        else:
            notification_user_id = appointment.health_provider.user_id
            message = f"Patient cancelled appointment on {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}"
        
        notification = Notification(
            user_id=notification_user_id,
            message=message,
            notification_type='appointment'
        )
        db.session.add(notification)
        
        # Check waiting list for this time slot
        check_waiting_list_for_cancellation(appointment)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment cancelled successfully',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error cancelling appointment: {str(e)}")
        return jsonify({'error': 'Failed to cancel appointment', 'message': str(e)}), 500


@appointments_enhanced_bp.route('/appointments/<int:appointment_id>/reschedule', methods=['PUT'])
@jwt_required()
def reschedule_appointment(appointment_id):
    """Reschedule an appointment to a new date/time"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'new_appointment_date' not in data:
            return jsonify({'error': 'Missing new_appointment_date'}), 400
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check permissions
        if appointment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized to reschedule this appointment'}), 403
        
        if appointment.status not in ['pending', 'confirmed']:
            return jsonify({'error': f'Cannot reschedule appointment with status: {appointment.status}'}), 400
        
        # Parse new datetime
        try:
            new_datetime = datetime.fromisoformat(data['new_appointment_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid new_appointment_date format'}), 400
        
        # Validate new time is in the future
        if new_datetime <= datetime.utcnow():
            return jsonify({'error': 'New appointment time must be in the future'}), 400
        
        # Check if new slot is available
        duration = appointment.duration_minutes or 30
        slot_end_time = new_datetime + timedelta(minutes=duration)
        
        existing_appointment = Appointment.query.filter(
            Appointment.provider_id == appointment.provider_id,
            Appointment.id != appointment_id,  # Exclude current appointment
            Appointment.appointment_date < slot_end_time,
            Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) > new_datetime,
            Appointment.status.in_(['confirmed', 'pending'])
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'The new time slot is not available'}), 409
        
        # Check provider availability
        provider = HealthProvider.query.get(appointment.provider_id)
        if not is_provider_available(provider, new_datetime):
            return jsonify({'error': 'Provider is not available at the new time'}), 400
        
        # Update appointment
        old_datetime = appointment.appointment_date
        appointment.appointment_date = new_datetime
        appointment.status = 'pending'  # May need re-confirmation
        appointment.confirmed_at = None
        
        # Create notification
        notification = Notification(
            user_id=appointment.health_provider.user_id,
            message=f"Appointment rescheduled from {old_datetime.strftime('%Y-%m-%d %H:%M')} to {new_datetime.strftime('%Y-%m-%d %H:%M')}",
            notification_type='appointment'
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment rescheduled successfully',
            'appointment': appointment.to_dict(),
            'old_date': old_datetime.isoformat(),
            'new_date': new_datetime.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error rescheduling appointment: {str(e)}")
        return jsonify({'error': 'Failed to reschedule appointment', 'message': str(e)}), 500


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_provider_available_slots_count(provider_id, check_date):
    """Count available slots for a provider on a specific date"""
    try:
        provider = HealthProvider.query.get(provider_id)
        if not provider or not provider.availability_hours:
            return 0
        
        availability = json.loads(provider.availability_hours)
        day_name = check_date.strftime('%A').lower()
        
        if day_name not in availability or not availability[day_name].get('is_available', False):
            return 0
        
        start_time_str = availability[day_name].get('start_time', '09:00')
        end_time_str = availability[day_name].get('end_time', '17:00')
        
        start_hour, start_min = map(int, start_time_str.split(':'))
        end_hour, end_min = map(int, end_time_str.split(':'))
        
        start_datetime = datetime.combine(check_date, time(start_hour, start_min))
        end_datetime = datetime.combine(check_date, time(end_hour, end_min))
        
        # Count 30-minute slots
        total_slots = 0
        available_slots = 0
        current_time = start_datetime
        
        while current_time < end_datetime:
            slot_end_time = current_time + timedelta(minutes=30)
            total_slots += 1
            
            # Check if slot is booked
            existing_appointment = Appointment.query.filter(
                Appointment.provider_id == provider_id,
                Appointment.appointment_date >= current_time,
                Appointment.appointment_date < slot_end_time,
                Appointment.status.in_(['confirmed', 'pending'])
            ).first()
            
            if not existing_appointment:
                available_slots += 1
            
            current_time = slot_end_time
        
        return available_slots
        
    except Exception:
        return 0


def get_provider_next_available_slot(provider_id, days_ahead=14):
    """Get the next available appointment slot for a provider"""
    try:
        provider = HealthProvider.query.get(provider_id)
        if not provider or not provider.availability_hours:
            return None
        
        availability = json.loads(provider.availability_hours)
        current_date = datetime.now().date() + timedelta(days=1)
        end_date = current_date + timedelta(days=days_ahead)
        
        while current_date <= end_date:
            day_name = current_date.strftime('%A').lower()
            
            if day_name in availability and availability[day_name].get('is_available', False):
                start_time_str = availability[day_name].get('start_time', '09:00')
                end_time_str = availability[day_name].get('end_time', '17:00')
                
                start_hour, start_min = map(int, start_time_str.split(':'))
                end_hour, end_min = map(int, end_time_str.split(':'))
                
                start_datetime = datetime.combine(current_date, time(start_hour, start_min))
                end_datetime = datetime.combine(current_date, time(end_hour, end_min))
                
                current_time = start_datetime
                while current_time < end_datetime:
                    slot_end_time = current_time + timedelta(minutes=30)
                    
                    existing_appointment = Appointment.query.filter(
                        Appointment.provider_id == provider_id,
                        Appointment.appointment_date >= current_time,
                        Appointment.appointment_date < slot_end_time,
                        Appointment.status.in_(['confirmed', 'pending'])
                    ).first()
                    
                    if not existing_appointment:
                        return {
                            'date': current_date.isoformat(),
                            'time': current_time.strftime('%H:%M'),
                            'datetime': current_time.isoformat()
                        }
                    
                    current_time = slot_end_time
            
            current_date += timedelta(days=1)
        
        return None
        
    except Exception:
        return None


def get_provider_availability_summary(provider_id, days_ahead=7):
    """Get availability summary for a provider over multiple days"""
    try:
        summary = []
        current_date = datetime.now().date()
        
        for i in range(days_ahead):
            check_date = current_date + timedelta(days=i)
            available_slots = get_provider_available_slots_count(provider_id, check_date)
            
            summary.append({
                'date': check_date.isoformat(),
                'day_name': check_date.strftime('%A'),
                'available_slots': available_slots,
                'is_available': available_slots > 0
            })
        
        return summary
        
    except Exception:
        return []


def is_provider_available(provider, appointment_datetime):
    """Check if provider is available at a specific datetime"""
    try:
        if not provider.availability_hours:
            return False
        
        availability = json.loads(provider.availability_hours)
        day_name = appointment_datetime.strftime('%A').lower()
        
        if day_name not in availability or not availability[day_name].get('is_available', False):
            return False
        
        start_time_str = availability[day_name].get('start_time', '09:00')
        end_time_str = availability[day_name].get('end_time', '17:00')
        
        start_hour, start_min = map(int, start_time_str.split(':'))
        end_hour, end_min = map(int, end_time_str.split(':'))
        
        appointment_time = appointment_datetime.time()
        start_time = time(start_hour, start_min)
        end_time = time(end_hour, end_min)
        
        return start_time <= appointment_time < end_time
        
    except Exception:
        return False


def check_waiting_list_for_cancellation(cancelled_appointment):
    """Check waiting list when an appointment is cancelled and notify waiting patients"""
    try:
        # Find waiting list entries that match this slot
        waiting_entries = WaitingList.query.filter(
            WaitingList.provider_id == cancelled_appointment.provider_id,
            WaitingList.status == 'active',
            WaitingList.preferred_date_start <= cancelled_appointment.appointment_date.date(),
            WaitingList.preferred_date_end >= cancelled_appointment.appointment_date.date()
        ).order_by(WaitingList.created_at).all()
        
        appointment_time = cancelled_appointment.appointment_date.time()
        
        for entry in waiting_entries:
            # Check if time matches preferences
            if (entry.preferred_time_start and entry.preferred_time_end and
                entry.preferred_time_start <= appointment_time <= entry.preferred_time_end):
                
                # Notify the waiting patient
                notification = Notification(
                    user_id=entry.user_id,
                    message=f"A slot opened up on {cancelled_appointment.appointment_date.strftime('%Y-%m-%d %H:%M')} with your preferred provider!",
                    notification_type='appointment'
                )
                db.session.add(notification)
                break  # Notify only the first matching entry
        
    except Exception as e:
        logger.error(f"Error checking waiting list: {str(e)}")


# ============================================================================
# WAITING LIST ENDPOINTS
# ============================================================================

@appointments_enhanced_bp.route('/waiting-list', methods=['POST'])
@jwt_required()
def join_waiting_list():
    """Join waiting list for preferred appointment slots"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['provider_id', 'preferred_date_start', 'preferred_date_end', 'issue_description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate dates
        try:
            start_date = datetime.strptime(data['preferred_date_start'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['preferred_date_end'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if start_date > end_date:
            return jsonify({'error': 'Start date must be before or equal to end date'}), 400
        
        # Validate provider
        provider = HealthProvider.query.get(data['provider_id'])
        if not provider:
            return jsonify({'error': 'Provider not found'}), 404
        
        # Create waiting list entry
        waiting_entry = WaitingList(
            user_id=current_user_id,
            provider_id=data['provider_id'],
            preferred_date_start=start_date,
            preferred_date_end=end_date,
            preferred_time_start=datetime.strptime(data.get('preferred_time_start', '09:00'), '%H:%M').time() if data.get('preferred_time_start') else None,
            preferred_time_end=datetime.strptime(data.get('preferred_time_end', '17:00'), '%H:%M').time() if data.get('preferred_time_end') else None,
            appointment_type_id=data.get('appointment_type_id'),
            issue_description=data['issue_description'],
            priority=data.get('priority', 'normal'),
            notify_by_sms=data.get('notify_by_sms', True),
            notify_by_email=data.get('notify_by_email', True),
            notify_by_app=data.get('notify_by_app', True),
            expires_at=datetime.utcnow() + timedelta(days=30)  # Expire after 30 days
        )
        
        db.session.add(waiting_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully joined waiting list',
            'waiting_list_id': waiting_entry.id,
            'position': get_waiting_list_position(waiting_entry.id),
            'estimated_wait_days': estimate_wait_time(data['provider_id'])
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error joining waiting list: {str(e)}")
        return jsonify({'error': 'Failed to join waiting list', 'message': str(e)}), 500


def get_waiting_list_position(waiting_list_id):
    """Get position in waiting list"""
    try:
        entry = WaitingList.query.get(waiting_list_id)
        if not entry:
            return None
        
        position = WaitingList.query.filter(
            WaitingList.provider_id == entry.provider_id,
            WaitingList.status == 'active',
            WaitingList.created_at < entry.created_at
        ).count() + 1
        
        return position
        
    except Exception:
        return None


def estimate_wait_time(provider_id):
    """Estimate wait time based on provider's availability and current waiting list"""
    try:
        # Simple estimation based on average appointment frequency
        provider = HealthProvider.query.get(provider_id)
        if not provider or not provider.availability_hours:
            return 14  # Default 2 weeks
        
        # Calculate weekly available slots
        availability = json.loads(provider.availability_hours)
        weekly_slots = 0
        
        for day, schedule in availability.items():
            if schedule.get('is_available', False):
                start_hour, start_min = map(int, schedule.get('start_time', '09:00').split(':'))
                end_hour, end_min = map(int, schedule.get('end_time', '17:00').split(':'))
                
                total_minutes = (end_hour * 60 + end_min) - (start_hour * 60 + start_min)
                daily_slots = total_minutes // 30  # 30-minute slots
                weekly_slots += daily_slots
        
        # Count current waiting list
        waiting_count = WaitingList.query.filter_by(
            provider_id=provider_id,
            status='active'
        ).count()
        
        # Estimate days (assuming 70% booking rate)
        if weekly_slots > 0:
            effective_slots_per_week = weekly_slots * 0.7
            weeks_to_wait = waiting_count / effective_slots_per_week
            return max(1, int(weeks_to_wait * 7))
        
        return 14  # Default 2 weeks
        
    except Exception:
        return 14


# ============================================================================
# APPOINTMENT REVIEWS AND RATINGS
# ============================================================================

@appointments_enhanced_bp.route('/appointments/<int:appointment_id>/review', methods=['POST'])
@jwt_required()
def submit_appointment_review(appointment_id):
    """Submit a review for a completed appointment"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate appointment exists and belongs to user
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            user_id=current_user_id,
            status='completed'
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found or not eligible for review'}), 404
        
        # Check if review already exists
        existing_review = AppointmentReview.query.filter_by(
            appointment_id=appointment_id,
            user_id=current_user_id
        ).first()
        
        if existing_review:
            return jsonify({'error': 'Review already submitted for this appointment'}), 400
        
        # Validate required rating
        if 'overall_rating' not in data or not isinstance(data['overall_rating'], int) or not (1 <= data['overall_rating'] <= 5):
            return jsonify({'error': 'overall_rating must be an integer between 1 and 5'}), 400
        
        # Create review
        review = AppointmentReview(
            appointment_id=appointment_id,
            provider_id=appointment.provider_id,
            user_id=current_user_id,
            overall_rating=data['overall_rating'],
            communication_rating=data.get('communication_rating'),
            punctuality_rating=data.get('punctuality_rating'),
            facility_rating=data.get('facility_rating'),
            professionalism_rating=data.get('professionalism_rating'),
            review_text=data.get('review_text'),
            pros=data.get('pros'),
            cons=data.get('cons'),
            would_recommend=data.get('would_recommend'),
            is_anonymous=data.get('is_anonymous', False)
        )
        
        db.session.add(review)
        
        # Update provider's average rating
        provider = HealthProvider.query.get(appointment.provider_id)
        if provider:
            all_reviews = AppointmentReview.query.filter_by(provider_id=provider.id).all()
            if all_reviews:
                avg_rating = sum(r.overall_rating for r in all_reviews) / len(all_reviews)
                provider.rating = round(avg_rating, 1)
                provider.total_reviews = len(all_reviews)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review_id': review.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting review: {str(e)}")
        return jsonify({'error': 'Failed to submit review', 'message': str(e)}), 500


# Register the blueprint
def register_enhanced_appointments_routes(app):
    """Register enhanced appointments routes with the Flask app"""
    app.register_blueprint(appointments_enhanced_bp, url_prefix='/api/appointments-enhanced')
