# app/routes/ussd.py
from flask import Blueprint, request
from app.models import User, CycleLog, MealLog, Appointment, Notification, ContentCategory, ContentItem, Parent, Adolescent, ParentChild
from app import db, bcrypt
from datetime import datetime
from flask_jwt_extended import create_access_token
import re

ussd_bp = Blueprint('ussd', __name__)

def format_content(content, max_length=160):
    """Format content for USSD display with pagination"""
    pages = []
    current_page = []
    current_length = 0
    
    for word in content.split():
        if current_length + len(word) + 1 <= max_length:
            current_page.append(word)
            current_length += len(word) + 1
        else:
            pages.append(' '.join(current_page))
            current_page = [word]
            current_length = len(word)
    
    if current_page:
        pages.append(' '.join(current_page))
    
    return pages

@ussd_bp.route('', methods=['POST'])
def handle_ussd():
    session_id = request.form.get('sessionId')
    phone_number = request.form.get('phoneNumber').strip()
    text = request.form.get('text', '').strip()
    input_list = text.split('*') if text else []
    current_step = len(input_list)
    user_input = input_list[-1] if input_list else ''
    response = ""
    user = User.query.filter_by(phone_number=phone_number).first()

    # USSD State Machine
    try:
        if current_step == 0:  # Initial menu
            if user:
                response = "CON Enter your PIN:"
            else:
                response = "CON Welcome to The Lady's Essence\n1. Register\n2. Login"

        elif current_step == 1:
            if not user:  # Registration/Login flow
                if user_input == '1':
                    response = "CON Enter your full name:"
                elif user_input == '2':
                    response = "CON Enter your PIN:"
                else:
                    response = "END Invalid option"
            
            else:  # Existing user PIN verification
                if bcrypt.check_password_hash(user.password_hash, user_input):
                    response = main_menu(user)
                else:
                    response = "END Invalid PIN. Please try again."

        elif current_step == 2 and not user:  # Registration flow
            if input_list[0] == '1':  # Registration
                if len(user_input) < 3:
                    response = "END Invalid name. Minimum 3 characters."
                else:
                    response = "CON Choose user type:\n1. Parent\n2. Adolescent"

        elif current_step == 3 and not user and input_list[0] == '1':
            if user_input in ['1', '2']:
                user_type = 'parent' if user_input == '1' else 'adolescent'
                response = "CON Create a 4-digit PIN:"

        elif current_step == 4 and not user and input_list[0] == '1':
            if len(user_input) != 4 or not user_input.isdigit():
                response = "END Invalid PIN format. Must be 4 digits."
            else:
                # Create new user
                new_user = User(
                    name=input_list[2],
                    phone_number=phone_number,
                    password_hash=bcrypt.generate_password_hash(user_input).decode('utf-8'),
                    user_type='parent' if input_list[3] == '1' else 'adolescent'
                )
                db.session.add(new_user)
                db.session.commit()
                
                # Create associated profile
                if new_user.user_type == 'parent':
                    parent = Parent(user_id=new_user.id)
                else:
                    adolescent = Adolescent(user_id=new_user.id)
                
                db.session.commit()
                response = f"END Registration successful! Welcome {new_user.name}"

        elif current_step == 2 and input_list[0] == '2':  # Login flow
            user = User.query.filter_by(phone_number=phone_number).first()
            if user and bcrypt.check_password_hash(user.password_hash, user_input):
                response = main_menu(user)
            else:
                response = "END Invalid credentials"

        elif user and bcrypt.check_password_hash(user.password_hash, input_list[1] if not user else input_list[0]):
            # Authenticated menu handling
            if current_step == 1:
                response = main_menu(user)
            
            elif input_list[-1] == '1':  # Cycle Tracking
                response = handle_cycle_tracking(user, input_list)
            
            elif input_list[-1] == '2':  # Meal Logging
                response = handle_meal_logging(user, input_list)
            
            elif input_list[-1] == '3':  # Appointments
                response = handle_appointments(user, input_list)
            
            elif input_list[-1] == '4':  # Education
                response = handle_education(user, input_list)
            
            elif input_list[-1] == '5':  # Notifications
                response = handle_notifications(user, input_list)
            
            elif input_list[-1] == '6' and user.user_type == 'parent':
                response = handle_parent_dashboard(user, input_list)
            
            elif input_list[-1] == '7':  # Settings
                response = handle_settings(user, input_list)

    except Exception as e:
        response = "END An error occurred. Please try again later."
        # Log error here

    return response

def main_menu(user):
    menu = "CON Main Menu:"
    menu += "\n1. Cycle Tracking"
    menu += "\n2. Meal Logging"
    menu += "\n3. Appointments"
    menu += "\n4. Education Content"
    menu += "\n5. Notifications"
    if user.user_type == 'parent':
        menu += "\n6. Parent Dashboard"
    menu += "\n7. Settings"
    return menu

def handle_cycle_tracking(user, input_list):
    steps = len(input_list)
    
    if steps == 2:
        return ("CON Cycle Tracking:\n1. Log Period Start\n2. Current Cycle Status\n"
                "3. Cycle History\n0. Back")
    
    elif steps == 3:
        if input_list[2] == '1':
            return "CON Enter start date (DD-MM-YYYY):"
        elif input_list[2] == '2':
            cycle = CycleLog.query.filter_by(user_id=user.id).order_by(CycleLog.start_date.desc()).first()
            if cycle:
                return f"END Current Cycle: Started {cycle.start_date.strftime('%d-%b')}, {cycle.cycle_length} days"
            return "END No active cycle found"
        elif input_list[2] == '3':
            cycles = CycleLog.query.filter_by(user_id=user.id).order_by(CycleLog.start_date.desc()).limit(3).all()
            res = "CON Last 3 cycles:\n"
            for idx, cycle in enumerate(cycles, 1):
                res += f"{idx}. {cycle.start_date.strftime('%d-%b')} ({cycle.cycle_length}d)\n"
            return res + "0. Back"
        else:
            return main_menu(user)
    
    elif steps == 4 and input_list[2] == '1':
        try:
            start_date = datetime.strptime(input_list[3], '%d-%m-%Y')
            new_cycle = CycleLog(
                user_id=user.id,
                start_date=start_date,
                cycle_length=28  # Default value, can be improved
            )
            db.session.add(new_cycle)
            db.session.commit()
            return "END Period start logged successfully!"
        except:
            return "END Invalid date format. Use DD-MM-YYYY"

def handle_education(user, input_list):
    steps = len(input_list)
    
    if steps == 2:
        categories = ContentCategory.query.all()
        menu = "CON Education Categories:\n"
        for idx, cat in enumerate(categories, 1):
            menu += f"{idx}. {cat.name}\n"
        menu += "0. Back"
        return menu
    
    elif steps == 3:
        category_id = int(input_list[2])
        category = ContentCategory.query.get(category_id)
        if not category:
            return "END Invalid selection"
        
        items = ContentItem.query.filter_by(category_id=category.id).all()
        menu = f"CON {category.name}:\n"
        for idx, item in enumerate(items, 1):
            menu += f"{idx}. {item.title}\n"
        menu += "0. Back"
        return menu
    
    elif steps == 4:
        item_id = int(input_list[3])
        item = ContentItem.query.get(item_id)
        if not item:
            return "END Invalid selection"
        
        pages = format_content(item.content)
        return f"CON {pages[0]}\n1. Next\n0. Back"

# Add similar handlers for other menu items (meal logging, appointments, etc.)

def handle_parent_dashboard(user, input_list):
    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found"
    
    children = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    if len(input_list) == 2:
        menu = "CON Parent Dashboard:\n1. View Children\n2. Add Child\n0. Back"
        return menu
    
def handle_parent_dashboard(user, input_list):
    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found"
    
    steps = len(input_list)
    current_selection = input_list[-1] if steps > 0 else ''
    
    # Main parent dashboard menu
    if steps == 2:
        return ("CON Parent Dashboard:\n1. View Children\n2. Add Child\n3. Remove Child\n0. Back")
    
    # View Children
    if current_selection == '1':
        return handle_view_children(parent, input_list)
    
    # Add Child flow
    elif current_selection == '2':
        return handle_add_child(parent, input_list)
    
    # Remove Child flow
    elif current_selection == '3':
        return handle_remove_child(parent, input_list)
    
    return main_menu(user)

def handle_view_children(parent, input_list):
    children = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    if len(input_list) == 3:
        response = "CON Your Children:\n"
        for idx, relation in enumerate(children, 1):
            adolescent = Adolescent.query.get(relation.adolescent_id)
            user = User.query.get(adolescent.user_id)
            response += f"{idx}. {user.name} ({relation.relationship_type})\n"
        return response + "0. Back"
    
    return main_menu(parent.user)

def handle_add_child(parent, input_list):
    steps = len(input_list)
    
    if steps == 3:
        return "CON Enter child's phone number:"
    
    if steps == 4:
        # Validate phone number format
        phone = input_list[3]
        if not re.match(r'^\+?\d{10,15}$', phone):
            return "END Invalid phone format"
        
        # Check if adolescent exists
        child_user = User.query.filter_by(phone_number=phone, user_type='adolescent').first()
        if not child_user:
            return "END No adolescent found with this number"
        
        # Check if already linked
        existing = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=child_user.adolescent.id
        ).first()
        if existing:
            return "END Child already linked"
        
        # Store temporary data in session
        return "CON Select relationship:\n1. Mother\n2. Father\n3. Guardian\n4. Other"
    
    if steps == 5:
        # Map selection to relationship type
        relationship_map = {
            '1': 'Mother',
            '2': 'Father',
            '3': 'Guardian',
            '4': 'Other'
        }
        relationship = relationship_map.get(input_list[4], 'Other')
        
        # Get stored child user from previous step
        phone = input_list[3]
        child_user = User.query.filter_by(phone_number=phone).first()
        
        # Create parent-child relationship
        new_relation = ParentChild(
            parent_id=parent.id,
            adolescent_id=child_user.adolescent.id,
            relationship_type=relationship
        )
        db.session.add(new_relation)
        
        try:
            db.session.commit()
            # Send notification to adolescent
            notification = Notification(
                user_id=child_user.id,
                message=f"{parent.user.name} added you as their {relationship}",
                notification_type='family'
            )
            db.session.add(notification)
            db.session.commit()
            return "END Child added successfully!"
        except Exception as e:
            db.session.rollback()
            return "END Error saving relationship"

def handle_remove_child(parent, input_list):
    children = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    if len(input_list) == 3:
        response = "CON Select child to remove:\n"
        for idx, relation in enumerate(children, 1):
            adolescent = Adolescent.query.get(relation.adolescent_id)
            user = User.query.get(adolescent.user_id)
            response += f"{idx}. {user.name}\n"
        return response + "0. Back"
    
    if len(input_list) == 4:
        try:
            selection = int(input_list[3]) - 1
            if 0 <= selection < len(children):
                relation = children[selection]
                db.session.delete(relation)
                db.session.commit()
                return "END Child removed successfully"
        except:
            db.session.rollback()
        return "END Invalid selection"
    
    return main_menu(parent.user)