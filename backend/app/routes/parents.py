from app.models import Parent, Adolescent, ParentChild, User
from app import db
from app.utils.parent_auth import get_or_create_parent_profile, authorize_parent_for_child
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

parents_bp = Blueprint('parents', __name__)


def _require_parent(current_user_id):
    """Return (user, parent) or (None, error_response)."""
    uid = int(current_user_id)
    user = User.query.get(uid)
    if not user or user.user_type != 'parent':
        return None, None, (jsonify({'message': 'Parent access required'}), 403)
    parent = get_or_create_parent_profile(uid)
    if not parent:
        return None, None, (jsonify({'message': 'Parent profile not found'}), 404)
    return user, parent, None


def _parent_for_user(current_user_id):
    """Resolve parent row for endpoints that use get_jwt_identity() directly."""
    return get_or_create_parent_profile(int(current_user_id))


def _get_parent_child_relation(parent, adolescent_id):
    return ParentChild.query.filter_by(
        parent_id=parent.id,
        adolescent_id=adolescent_id,
    ).first()


def _child_health_summary(adolescent, child_user, access_granted):
    """Cycle stats, meal stats, appointment summary for one child."""
    from app.models import CycleLog, MealLog, Appointment, HealthProvider

    summary = {
        'total_cycle_logs': 0,
        'total_meal_logs': 0,
        'total_appointments': 0,
        'completed_appointments': 0,
        'upcoming_appointments': 0,
        'last_appointment': None,
        'cycle_summary': None,
        'next_period_predicted': None,
        'has_health_anomaly': False,
        'meal_logs_this_week': 0,
    }

    uid = adolescent.user_id
    summary['total_appointments'] = Appointment.query.filter_by(for_user_id=uid).count()
    summary['completed_appointments'] = Appointment.query.filter_by(
        for_user_id=uid, status='completed'
    ).count()
    summary['upcoming_appointments'] = Appointment.query.filter(
        Appointment.for_user_id == uid,
        Appointment.appointment_date >= datetime.utcnow(),
        Appointment.status.in_(['pending', 'confirmed']),
    ).count()

    recent = Appointment.query.filter_by(for_user_id=uid, status='completed').order_by(
        Appointment.appointment_date.desc()
    ).first()
    if recent:
        provider_name = None
        if recent.provider_id:
            hp = HealthProvider.query.get(recent.provider_id)
            if hp and hp.user:
                provider_name = hp.user.name
        summary['last_appointment'] = {
            'date': recent.appointment_date.isoformat(),
            'provider': provider_name,
            'notes': recent.provider_notes,
        }

    if not access_granted:
        return summary

    summary['total_cycle_logs'] = CycleLog.query.filter_by(user_id=uid).count()
    summary['total_meal_logs'] = MealLog.query.filter_by(user_id=uid).count()

    week_ago = datetime.utcnow() - timedelta(days=7)
    summary['meal_logs_this_week'] = MealLog.query.filter(
        MealLog.user_id == uid,
        MealLog.meal_time >= week_ago,
    ).count()

    latest_cycles = (
        CycleLog.query.filter_by(user_id=uid)
        .order_by(CycleLog.start_date.desc())
        .limit(10)
        .all()
    )
    if latest_cycles:
        latest = latest_cycles[0]
        summary['cycle_summary'] = {
            'last_period_start': latest.start_date.isoformat() if latest.start_date else None,
            'flow_intensity': getattr(latest, 'flow_intensity', None),
            'total_logs': len(latest_cycles),
        }
        try:
            from app.routes.cycle_logs import CyclePredictionEngine

            cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(latest_cycles)
            if cycle_data.get('lengths'):
                preds = CyclePredictionEngine.predict_next_cycles(latest_cycles, 1)
                pred_list = CyclePredictionEngine._predictions_from_result(preds)
                if pred_list:
                    summary['next_period_predicted'] = pred_list[0].get('predicted_start')
                period_lengths = CyclePredictionEngine.compute_period_lengths(latest_cycles)
                anomalies = CyclePredictionEngine.detect_health_anomalies(
                    cycle_data, period_lengths
                )
                summary['has_health_anomaly'] = anomalies.get('risk_level') in (
                    'medium',
                    'high',
                )
        except Exception:
            pass

    return summary

@parents_bp.route('/children', methods=['GET'])
@jwt_required()
def get_children():
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404

    # Get all children for this parent
    parent_child_relations = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    # Format the response
    children = []
    for relation in parent_child_relations:
        adolescent = Adolescent.query.get(relation.adolescent_id)
        if adolescent:
            adolescent_user = User.query.get(adolescent.user_id)
            if adolescent_user:
                children.append({
                    'id': adolescent.id,
                    'adolescent_id': adolescent.id,
                    'user_id': adolescent_user.id,
                    'name': adolescent_user.name,
                    'phone_number': adolescent_user.phone_number,
                    'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                    'relationship': relation.relationship_type,
                    'relationship_type': relation.relationship_type,
                    'parent_access_enabled': adolescent_user.allow_parent_access,
                    'access_granted': adolescent_user.allow_parent_access,
                    'account_type': getattr(adolescent_user, 'account_type', 'family_managed'),
                    'has_own_phone': bool(adolescent_user.phone_number),
                })
    
    return jsonify(children), 200

@parents_bp.route('/children/<int:adolescent_id>', methods=['GET'])
@jwt_required()
def get_child(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404

    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404

    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id)
    
    # Check if child allows parent access
    if not adolescent_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access to their account'}), 403
    
    # Format the response
    child_data = {
        'id': adolescent.id,
        'user_id': adolescent_user.id,
        'name': adolescent_user.name,
        'phone_number': adolescent_user.phone_number,
        'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
        'relationship': relation.relationship_type
    }
    
    return jsonify(child_data), 200


@parents_bp.route('/children/<int:adolescent_id>/details', methods=['GET'])
@jwt_required()
def get_child_details(adolescent_id):
    """Child profile + health summary for parent hub (jwt_required, same as other parent routes)."""
    parent, adolescent, child_user, err = authorize_parent_for_child(adolescent_id)
    if err:
        return err

    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    access_granted = child_user.allow_parent_access
    health = _child_health_summary(adolescent, child_user, access_granted)

    return jsonify({
        'child': {
            'id': adolescent.id,
            'user_id': child_user.id,
            'name': child_user.name,
            'email': child_user.email,
            'phone_number': child_user.phone_number,
            'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
            'relationship_type': relation.relationship_type,
            'account_type': getattr(child_user, 'account_type', 'family_managed'),
            'access_granted': access_granted,
            'has_own_phone': bool(child_user.phone_number),
            'personal_cycle_length': child_user.personal_cycle_length,
            'personal_period_length': child_user.personal_period_length,
            'has_provided_cycle_info': child_user.has_provided_cycle_info,
            'created_at': child_user.created_at.isoformat() if child_user.created_at else None,
        },
        'health_summary': {
            'total_appointments': health.get('total_appointments', 0),
            'completed_appointments': health.get('completed_appointments', 0),
            'upcoming_appointments': health.get('upcoming_appointments', 0),
            'last_appointment': health.get('last_appointment'),
            'cycle_summary': health.get('cycle_summary'),
            'next_period_predicted': health.get('next_period_predicted'),
            'has_health_anomaly': health.get('has_health_anomaly', False),
        },
        'access_granted': access_granted,
    }), 200


@parents_bp.route('/children', methods=['POST'])
@parents_bp.route('/children/add', methods=['POST'])
@jwt_required()
def add_child():
    current_user_id = int(get_jwt_identity())

    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'password', 'relationship_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if phone number already exists (if provided)
    if data.get('phone_number'):
        if User.query.filter_by(phone_number=data['phone_number']).first():
            return jsonify({'message': 'Phone number already registered'}), 409
    
    # Validate relationship type
    valid_relationships = ['mother', 'father', 'guardian']
    if data['relationship_type'] not in valid_relationships:
        return jsonify({'message': 'Invalid relationship type'}), 400
    
    try:
        # Create user account for the child
        from app import bcrypt
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        child_user = User(
            name=data['name'],
            phone_number=data.get('phone_number') or None,
            email=data.get('email'),
            password_hash=password_hash,
            user_type='adolescent',
            account_type='family_managed',
            is_phone_verified=bool(data.get('phone_number')),
            allow_parent_access=True,
        )
        db.session.add(child_user)
        db.session.flush()  # Get the user_id

        if not child_user.email:
            child_user.email = f"child_{child_user.id}@family.ladysessence.local"
        
        # Create adolescent record
        adolescent = Adolescent(
            user_id=child_user.id,
            date_of_birth=datetime.fromisoformat(data['date_of_birth']) if data.get('date_of_birth') else None
        )
        db.session.add(adolescent)
        db.session.flush()  # Get the adolescent_id
        
        # Create parent-child relationship
        parent_child = ParentChild(
            parent_id=parent.id,
            adolescent_id=adolescent.id,
            relationship_type=data['relationship_type']
        )
        db.session.add(parent_child)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Child added successfully',
            'child': {
                'id': adolescent.id,
                'user_id': child_user.id,
                'name': child_user.name,
                'phone_number': child_user.phone_number,
                'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                'relationship': parent_child.relationship_type
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add child', 'error': str(e)}), 500

@parents_bp.route('/children/<int:adolescent_id>', methods=['PUT'])
@jwt_required()
def update_child(adolescent_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and user records
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id)
    
    try:
        # Update fields if provided
        if 'name' in data:
            adolescent_user.name = data['name']
        
        if 'date_of_birth' in data:
            if data['date_of_birth']:
                adolescent.date_of_birth = datetime.fromisoformat(data['date_of_birth'].replace('Z', '+00:00'))
            else:
                adolescent.date_of_birth = None
        
        if 'relationship_type' in data:
            relation.relationship_type = data['relationship_type']
        
        # Update password if provided
        if 'password' in data:
            from app import bcrypt
            adolescent_user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Child information updated successfully'
        }), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating child information: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>', methods=['DELETE'])
@jwt_required()
def delete_child(adolescent_id):
    current_user_id = get_jwt_identity()
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    # Get adolescent and user records
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id) if adolescent else None
    try:
        # Remove records
        db.session.delete(relation)
        if adolescent:
            db.session.delete(adolescent)
        if adolescent_user:
            db.session.delete(adolescent_user)
        db.session.commit()
        return jsonify({'message': 'Child deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting child: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>/cycle-logs', methods=['GET'])
@jwt_required()
def get_child_cycle_logs(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and check parent access permission
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    
    # Check if child allows parent access
    if not child_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access to their account'}), 403
    adolescent_user_id = adolescent.user_id
    
    # Get cycle logs for the adolescent
    from app.models import CycleLog
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query cycle logs for the adolescent, ordered by start date descending
    logs = CycleLog.query.filter_by(user_id=adolescent_user_id)\
        .order_by(CycleLog.start_date.desc())\
        .paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': log.id,
            'start_date': log.start_date.isoformat(),
            'end_date': log.end_date.isoformat() if log.end_date else None,
            'cycle_length': log.cycle_length,
            'period_length': log.period_length,
            'symptoms': log.symptoms,
            'notes': log.notes,
            'created_at': log.created_at.isoformat()
        } for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@parents_bp.route('/children/<int:adolescent_id>/cycle-logs', methods=['POST'])
@jwt_required()
def create_child_cycle_log(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    if not child_user.allow_parent_access:
        return jsonify({
            'message': 'Access denied: Child has disabled parent access to their account',
        }), 403

    adolescent_user_id = adolescent.user_id

    data = request.get_json()
    
    # Validate required fields
    if not data.get('start_date'):
        return jsonify({'message': 'Start date is required and cannot be null'}), 400
    
    try:
        from app.models import CycleLog, Notification
        
        # Parse dates with proper null checks
        start_date_str = str(data['start_date'])
        if 'Z' in start_date_str:
            start_date_str = start_date_str.replace('Z', '+00:00')
            
        start_date = datetime.fromisoformat(start_date_str)
        end_date = None
        if 'end_date' in data and data['end_date']:
            end_date_str = str(data['end_date']).replace('Z', '+00:00')
            end_date = datetime.fromisoformat(end_date_str)
        
        # Prepare symptoms: accept list or string with proper null handling
        symptoms_raw = data.get('symptoms')
        symptoms_str = None
        if symptoms_raw:
            if isinstance(symptoms_raw, list):
                # Filter out empty strings and convert to string
                symptoms_list = [str(s).strip() for s in symptoms_raw if s and str(s).strip()]
                symptoms_str = ','.join(symptoms_list) if symptoms_list else None
            elif isinstance(symptoms_raw, str) and symptoms_raw.strip():
                symptoms_str = symptoms_raw.strip()
        
        # Prepare exercise activities: accept list or string
        exercise_raw = data.get('exercise_activities')
        exercise_str = None
        if exercise_raw:
            if isinstance(exercise_raw, list):
                # Filter out empty strings and convert to string
                exercise_list = [str(e).strip() for e in exercise_raw if e and str(e).strip()]
                exercise_str = ','.join(exercise_list) if exercise_list else None
            elif isinstance(exercise_raw, str) and exercise_raw.strip():
                exercise_str = exercise_raw.strip()
        
        # Create new cycle log for the child (NOT the parent)
        new_log = CycleLog(
            user_id=adolescent_user_id,  # IMPORTANT: Associate with child, not parent
            start_date=start_date,
            end_date=end_date,
            cycle_length=data.get('cycle_length'),
            period_length=data.get('period_length'),
            symptoms=symptoms_str,
            notes=data.get('notes'),
            # Enhanced wellness tracking
            mood=data.get('mood'),
            energy_level=data.get('energy_level'),
            sleep_quality=data.get('sleep_quality'),
            stress_level=data.get('stress_level'),
            exercise_activities=exercise_str
        )
        
        db.session.add(new_log)
        db.session.commit()
        
        # Create notification for the child about next cycle prediction if applicable
        if new_log.cycle_length:
            import datetime as dt
            
            # Calculate predicted next cycle start date
            next_cycle_date = start_date + dt.timedelta(days=new_log.cycle_length)
            
            # Create notification for the child
            notification = Notification(
                user_id=adolescent_user_id,  # Notify the child
                title='Cycle Prediction',
                message=f"Your next period is predicted to start on {next_cycle_date.strftime('%Y-%m-%d')}",
                type='cycle'
            )
            
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Cycle log created successfully for child',
            'id': new_log.id
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating cycle log: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>/meal-logs', methods=['GET'])
@jwt_required()
def get_child_meal_logs(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    if not child_user.allow_parent_access:
        return jsonify({
            'message': 'Access denied: Child has disabled parent access to their account',
        }), 403

    adolescent_user_id = adolescent.user_id

    from app.models import MealLog
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query meal logs for the adolescent, ordered by meal time descending
    logs = MealLog.query.filter_by(user_id=adolescent_user_id)\
        .order_by(MealLog.meal_time.desc())\
        .paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': log.id,
            'meal_type': log.meal_type,
            'meal_time': log.meal_time.isoformat(),
            'description': log.description,
            'calories': log.calories,
            'protein': log.protein,
            'carbs': log.carbs,
            'fat': log.fat,
            'created_at': log.created_at.isoformat()
        } for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@parents_bp.route('/children/<int:adolescent_id>/appointments', methods=['GET'])
@jwt_required()
def get_child_appointments(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = _parent_for_user(current_user_id)
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and check parent access permission
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)

    # Appointments remain visible when privacy mode is on (per product spec)
    adolescent_user_id = adolescent.user_id

    from app.models import Appointment
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    from sqlalchemy import or_

    appointments = Appointment.query.filter(
        or_(
            Appointment.for_user_id == adolescent_user_id,
            Appointment.user_id == adolescent_user_id,
        )
    ).order_by(Appointment.appointment_date.desc()).paginate(page=page, per_page=per_page)

    from app.routes.appointments import _appointment_to_dict

    result = {
        'items': [_appointment_to_dict(appointment) for appointment in appointments.items],
        'total': appointments.total,
        'pages': appointments.pages,
        'current_page': page
    }

    return jsonify(result), 200


@parents_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def parent_dashboard():
    """Family hub overview — all children with health status in one call."""
    current_user_id = int(get_jwt_identity())
    _, parent, err = _require_parent(current_user_id)
    if err:
        return err

    from app.models import Appointment, Notification

    children_data = []
    relations = ParentChild.query.filter_by(parent_id=parent.id).all()

    for relation in relations:
        adolescent = Adolescent.query.get(relation.adolescent_id)
        if not adolescent:
            continue
        child_user = User.query.get(adolescent.user_id)
        if not child_user:
            continue

        access_granted = child_user.allow_parent_access
        health = _child_health_summary(adolescent, child_user, access_granted)

        from sqlalchemy import or_

        upcoming_appts = Appointment.query.filter(
            or_(
                Appointment.for_user_id == adolescent.user_id,
                Appointment.user_id == adolescent.user_id,
            ),
            Appointment.appointment_date >= datetime.utcnow(),
            Appointment.status.in_(['pending', 'confirmed']),
        ).order_by(Appointment.appointment_date.asc()).limit(2).all()

        unread_notifs = Notification.query.filter_by(
            user_id=adolescent.user_id,
            is_read=False,
        ).count()

        children_data.append({
            'adolescent_id': adolescent.id,
            'user_id': adolescent.user_id,
            'name': child_user.name,
            'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
            'relationship_type': relation.relationship_type,
            'account_type': getattr(child_user, 'account_type', 'family_managed'),
            'has_own_phone': bool(child_user.phone_number),
            'access_granted': access_granted,
            'cycle_summary': health.get('cycle_summary'),
            'next_period_predicted': health.get('next_period_predicted'),
            'has_health_anomaly': health.get('has_health_anomaly', False),
            'upcoming_appointments': [
                {
                    'id': a.id,
                    'date': a.appointment_date.isoformat(),
                    'status': a.status,
                    'type': a.appointment_for or 'appointment',
                }
                for a in upcoming_appts
            ],
            'unread_notifications': unread_notifs,
        })

    parent_unread = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False,
    ).count()

    return jsonify({
        'children': children_data,
        'total_children': len(children_data),
        'parent_unread_notifications': parent_unread,
    }), 200


@parents_bp.route('/children/<int:adolescent_id>/health-summary', methods=['GET'])
@jwt_required()
def child_health_summary(adolescent_id):
    current_user_id = int(get_jwt_identity())
    _, parent, err = _require_parent(current_user_id)
    if err:
        return err

    relation = _get_parent_child_relation(parent, adolescent_id)
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404

    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    access_granted = child_user.allow_parent_access
    health = _child_health_summary(adolescent, child_user, access_granted)

    return jsonify({
        'adolescent_id': adolescent.id,
        'access_granted': access_granted,
        'health_summary': health,
    }), 200


@parents_bp.route('/children/<int:adolescent_id>/phone', methods=['PATCH'])
@jwt_required()
def update_child_phone(adolescent_id):
    current_user_id = int(get_jwt_identity())
    _, parent, err = _require_parent(current_user_id)
    if err:
        return err

    relation = _get_parent_child_relation(parent, adolescent_id)
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404

    data = request.get_json() or {}
    phone_number = (data.get('phone_number') or '').strip()
    if not phone_number:
        return jsonify({'message': 'phone_number is required'}), 400

    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)

    existing = User.query.filter_by(phone_number=phone_number).first()
    if existing and existing.id != child_user.id:
        return jsonify({'message': 'Phone number already registered'}), 409

    child_user.phone_number = phone_number
    child_user.is_phone_verified = False

    try:
        db.session.commit()
        return jsonify({
            'message': 'Phone number updated. Verification will be sent when available.',
            'phone_number': phone_number,
            'is_phone_verified': False,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update phone: {str(e)}'}), 500


@parents_bp.route('/children/<int:adolescent_id>/grant-independence', methods=['POST'])
@jwt_required()
def grant_child_independence(adolescent_id):
    """Child gets own phone — enable self login while keeping parent access by default."""
    current_user_id = int(get_jwt_identity())
    _, parent, err = _require_parent(current_user_id)
    if err:
        return err

    relation = _get_parent_child_relation(parent, adolescent_id)
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404

    data = request.get_json() or {}
    phone_number = (data.get('phone_number') or '').strip()
    send_invite = bool(data.get('send_invite', True))

    if not phone_number:
        return jsonify({'message': 'phone_number is required'}), 400

    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)

    existing = User.query.filter_by(phone_number=phone_number).first()
    if existing and existing.id != child_user.id:
        return jsonify({'message': 'Phone number already registered'}), 409

    child_user.phone_number = phone_number
    child_user.is_phone_verified = False
    child_user.account_type = 'self_registered'
    child_user.allow_parent_access = True

    try:
        db.session.commit()

        if send_invite:
            from app.models import Notification

            notification = Notification(
                user_id=child_user.id,
                title='Your Lady\'s Essence account is ready',
                message=(
                    f'You can now log in with {phone_number}. '
                    'Manage your privacy settings anytime in the app.'
                ),
                type='info',
            )
            db.session.add(notification)
            db.session.commit()

        return jsonify({
            'message': 'Independence granted successfully',
            'child': {
                'adolescent_id': adolescent.id,
                'user_id': child_user.id,
                'name': child_user.name,
                'phone_number': phone_number,
                'account_type': child_user.account_type,
                'access_granted': child_user.allow_parent_access,
                'invite_sent': send_invite,
            },
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to grant independence: {str(e)}'}), 500
