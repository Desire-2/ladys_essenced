# app/routes/ussd.py
from flask import Blueprint, request
from app.models import User, CycleLog, MealLog, Appointment, Notification, ContentCategory, ContentItem, Parent, Adolescent, ParentChild, Feedback
from app import db, bcrypt
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token
import re
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

def check_backflow_navigation(user, input_list, current_step, service_name):
    """Check for backflow navigation commands ('0' for back, '00' for main menu) with enhanced context awareness"""
    if not input_list:
        return None
    
    current_input = input_list[-1]
    
    # Check for main menu return
    if current_input == '00':
        logger.info(f"Backflow: User requested main menu from {service_name}")
        clear_session_state(user)  # Clear service-specific state
        return main_menu(user)
    
    # Check for back navigation
    if current_input == '0':
        logger.info(f"Backflow: User requested back from {service_name}, step {current_step}")
        
        if current_step <= 1:
            # If at first step of service, go back to main menu
            clear_session_state(user)  # Clear service-specific state
            return main_menu(user)
        elif current_step == 2:
            # If at second step, going back usually means returning to main menu
            # unless we're in a deep submenu that specifically needs to go back to service menu
            if service_name in ['cycle_tracking', 'meal_logging', 'appointments', 'education', 'notifications', 'parent_dashboard', 'settings']:
                # For most services, step 2 backflow should return to main menu to allow cross-service navigation
                logger.info(f"Backflow: Returning to main menu from {service_name} step 2 for cross-service navigation")
                clear_session_state(user)
                return main_menu(user)
            else:
                # Go back to previous step within service
                previous_input_list = input_list[:-1]
                logger.info(f"Backflow: Going back within service with input_list: {previous_input_list}")
                return route_to_service_handler(service_name, user, previous_input_list)
        else:
            # Go back to previous step by removing last input and calling handler again
            previous_input_list = input_list[:-1]
            logger.info(f"Backflow: Going back with input_list: {previous_input_list}")
            return route_to_service_handler(service_name, user, previous_input_list)
    
    return None

def route_to_service_handler(service_name, user, input_list):
    """Route to appropriate service handler"""
    if service_name == 'cycle_tracking':
        return handle_cycle_tracking(user, input_list)
    elif service_name == 'meal_logging':
        return handle_meal_logging(user, input_list)
    elif service_name == 'appointments':
        return handle_appointments(user, input_list)
    elif service_name == 'notifications':
        return handle_notifications(user, input_list)
    elif service_name == 'education':
        return handle_education(user, input_list)
    elif service_name == 'parent_dashboard':
        return handle_parent_dashboard(user, input_list)
    elif service_name == 'settings':
        return handle_settings(user, input_list)
    elif service_name == 'feedback':
        return handle_feedback_submission(user, input_list)
    elif service_name == 'help':
        return handle_help_menu(user, input_list)
    else:
        clear_session_state(user)
        return main_menu(user)

def check_session_timeout(user):
    """Check if user's session has timed out"""
    if not user.last_activity:
        return False
    
    # Use default timeout of 2 minutes if not set
    timeout_minutes = user.session_timeout_minutes or 2
    timeout_threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)
    return user.last_activity < timeout_threshold

def save_session_state(user, session_data):
    """Save current session state for potential resume"""
    try:
        user.current_session_data = json.dumps(session_data)
        user.last_activity = datetime.utcnow()
        db.session.commit()
        logger.info(f"Session state saved for user {user.phone_number}")
    except Exception as e:
        logger.error(f"Error saving session state: {e}")
        db.session.rollback()

def get_session_state(user):
    """Get saved session state"""
    try:
        if user.current_session_data:
            return json.loads(user.current_session_data)
        return None
    except Exception as e:
        logger.error(f"Error retrieving session state: {e}")
        return None

def clear_session_state(user):
    """Clear saved session state"""
    try:
        user.current_session_data = None
        user.last_activity = datetime.utcnow()
        db.session.commit()
        logger.info(f"Session state cleared for user {user.phone_number}")
    except Exception as e:
        logger.error(f"Error clearing session state: {e}")
        db.session.rollback()

def update_last_activity(user):
    """Update user's last activity timestamp"""
    try:
        user.last_activity = datetime.utcnow()
        db.session.commit()
    except Exception as e:
        logger.error(f"Error updating last activity: {e}")
        db.session.rollback()

def handle_session_resume_prompt(user):
    """Handle the prompt for resuming or starting new session"""
    return ("CON Session Resume Options:\n"
            "1. Resume previous session\n"
            "2. Start new session\n"
            "0. Exit")

def handle_session_resume_choice(user, input_list):
    """Handle user's choice to resume or start new session"""
    if not input_list:
        return handle_session_resume_prompt(user)
    
    current_input = input_list[-1]
    
    if current_input == '1':
        # Resume previous session
        session_data = get_session_state(user)
        if session_data:
            logger.info(f"Resuming session for user {user.phone_number}")
            update_last_activity(user)
            
            # Reconstruct the previous state
            service = session_data.get('service', 'main_menu')
            previous_inputs = session_data.get('inputs', [])
            
            # Route to appropriate handler with previous inputs
            if service == 'cycle_tracking':
                return handle_cycle_tracking(user, previous_inputs)
            elif service == 'meal_logging':
                return handle_meal_logging(user, previous_inputs)
            elif service == 'appointments':
                return handle_appointments(user, previous_inputs)
            elif service == 'notifications':
                return handle_notifications(user, previous_inputs)
            elif service == 'education':
                return handle_education(user, previous_inputs)
            elif service == 'parent_dashboard':
                return handle_parent_dashboard(user, previous_inputs)
            elif service == 'settings':
                return handle_settings(user, previous_inputs)
            elif service == 'feedback':
                return handle_feedback_submission(user, previous_inputs)
            elif service == 'help':
                return handle_help_menu(user, previous_inputs)
            else:
                return main_menu(user)
        else:
            # No valid session data, start new
            clear_session_state(user)
            return main_menu(user)
    
    elif current_input == '2':
        # Start new session
        clear_session_state(user)
        update_last_activity(user)
        return main_menu(user)
    
    elif current_input == '0':
        return "END Thank you for using Lady's Essence!"
    
    else:
        return ("CON Invalid choice. Please select:\n"
                "1. Resume previous session\n"
                "2. Start new session\n"
                "0. Exit")

@ussd_bp.route('', methods=['POST'])
def handle_ussd():
    """Main USSD handler with session timeout and resume functionality"""
    try:
        session_id = request.form.get('sessionId')
        phone_number = request.form.get('phoneNumber', '').strip()
        text = request.form.get('text', '').strip()
        
        # Validate input
        if not phone_number:
            return "END Invalid phone number"
        
        input_list = text.split('*') if text else []
        current_step = len(input_list)
        user_input = input_list[-1] if input_list else ''
        user = User.query.filter_by(phone_number=phone_number).first()

        logger.info(f"USSD Request: Phone={phone_number}, Step={current_step}, Input={input_list}, User={'Found' if user else 'Not Found'}")

        # Check for session timeout for existing users
        if user and current_step == 0:
            # Fresh session start - check if previous session timed out
            if check_session_timeout(user) and user.current_session_data:
                logger.info(f"Session timeout detected for user {user.phone_number}")
                return handle_session_resume_prompt(user)
            else:
                # Clear any old session data for fresh start
                clear_session_state(user)
        
        # Handle session resume flow
        if user and current_step == 1 and check_session_timeout(user) and user.current_session_data:
            return handle_session_resume_choice(user, [user_input])
        
        # Update last activity for authenticated users
        if user and current_step > 0:
            update_last_activity(user)

        # Route to appropriate handler based on authentication state and step
        if current_step == 0:
            return handle_initial_menu(user)
        
        elif current_step == 1:
            return handle_first_step(user, user_input, phone_number)
        
        elif current_step >= 2:
            return handle_authenticated_flow(user, input_list, phone_number)
        
        else:
            return "END Invalid session state"

    except Exception as e:
        logger.error(f"USSD Error: {str(e)}")
        return "END Service temporarily unavailable. Please try again."

def handle_initial_menu(user):
    """Handle the initial USSD menu"""
    if user:
        return "CON Welcome back!\nEnter your 4-digit PIN:"
    else:
        return "CON Welcome to The Lady's Essence 🌸\n1. Register New Account\n2. Login to Existing Account"

def handle_first_step(user, user_input, phone_number):
    """Handle first step after initial menu"""
    if not user:  # New user flow
        if user_input == '1':
            return "CON Registration\nEnter your full name:"
        elif user_input == '2':
            return "CON Login\nEnter your 4-digit PIN:"
        else:
            return "END Invalid option. Please try again."
    
    else:  # Existing user PIN verification
        if len(user_input) == 4 and user_input.isdigit():
            if bcrypt.check_password_hash(user.password_hash, user_input):
                return main_menu(user)
            else:
                return "END Invalid PIN. Please try again."
        else:
            return "END PIN must be exactly 4 digits."

def handle_authenticated_flow(user, input_list, phone_number):
    """Handle authenticated user flows"""
    steps = len(input_list)
    
    if not user and input_list[0] == '1':  # Registration flow
        return handle_registration_flow(input_list, phone_number)
    
    elif not user and input_list[0] == '2':  # Login flow
        return handle_login_flow(input_list, phone_number)
    
    elif user:  # Authenticated user flows
        # For existing users, the flow is:
        # Step 1: PIN entry -> Verify and show main menu
        # Step 2+: Menu navigation -> Skip PIN, handle menu selections
        
        if steps == 1:
            # Just entered PIN, verify it
            if bcrypt.check_password_hash(user.password_hash, input_list[0]):
                return main_menu(user)
            else:
                return "END Invalid PIN. Please try again."
        else:
            # Menu navigation - PIN was already verified in step 1
            # input_list[0] = PIN (skip this)
            # input_list[1] = Main menu selection (1-9)  
            # input_list[2+] = Submenu selections
            menu_input_list = input_list[1:]  # Remove PIN from input
            logger.info(f"Menu navigation: Original input={input_list}, Menu input={menu_input_list}")
            return handle_menu_navigation(user, menu_input_list)
    
    else:
        return "END Session expired. Please start again."

def handle_registration_flow(input_list, phone_number):
    """Handle user registration flow with optional PIN setup"""
    steps = len(input_list)
    
    if steps == 2:  # Name entered
        name = input_list[1].strip()
        if len(name) < 2:
            return "END Name too short. Minimum 2 characters required."
        elif len(name) > 50:
            return "END Name too long. Maximum 50 characters allowed."
        else:
            return "CON Choose account type:\n1. Parent/Guardian\n2. Adolescent/Teen"
    
    elif steps == 3:  # User type selected
        if input_list[2] in ['1', '2']:
            return "CON Create a secure password (4-8 characters):\nExample: 2580 or secure123"
        else:
            return "END Invalid selection. Please try again."
    
    elif steps == 4:  # Password entered
        password = input_list[3]
        if len(password) < 4 or len(password) > 20:
            return "END Password must be 4-20 characters. Please try again."
        
        # Password is valid, ask about PIN setup
        return "CON Would you like to set a 4-digit PIN for faster login?\n1. Yes, set PIN\n2. Skip"
    
    elif steps == 5:  # PIN setup option
        pin_option = input_list[4]
        
        if pin_option == '1':
            # User wants to set PIN
            return "CON Enter a 4-digit PIN (numbers only):\nExample: 2580"
        elif pin_option == '2':
            # Skip PIN - create user with password only
            name = input_list[1].strip()
            password = input_list[3]
            user_type = 'parent' if input_list[2] == '1' else 'adolescent'
            
            return _create_user_from_ussd(name, phone_number, password, user_type, pin=None)
        else:
            return "END Invalid option. Please try again."
    
    elif steps == 6:  # PIN entered
        pin = input_list[5]
        
        if len(pin) != 4 or not pin.isdigit():
            return "END Invalid PIN. Must be exactly 4 digits."
        
        # PIN is valid, confirm PIN
        return "CON Confirm your PIN:\nEnter it again:"
    
    elif steps == 7:  # Confirm PIN
        pin = input_list[5]
        confirm_pin = input_list[6]
        
        if pin != confirm_pin:
            return "END PINs don't match. Please try again."
        
        # PINs match - create user with PIN
        name = input_list[1].strip()
        password = input_list[3]
        user_type = 'parent' if input_list[2] == '1' else 'adolescent'
        
        return _create_user_from_ussd(name, phone_number, password, user_type, pin=pin)
    
    return "END Invalid registration flow."

def _create_user_from_ussd(name, phone_number, password, user_type, pin=None):
    """Helper function to create user from USSD with optional PIN"""
    try:
        # Check if user already exists
        if User.query.filter_by(phone_number=phone_number).first():
            return "END Phone number already registered. Please login or contact support."
        
        # Create password hash
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create PIN hash if provided
        pin_hash = None
        enable_pin_auth = False
        if pin:
            pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
            enable_pin_auth = True
        
        # Create new user
        new_user = User(
            name=name,
            phone_number=phone_number,
            password_hash=password_hash,
            user_type=user_type,
            pin_hash=pin_hash,
            enable_pin_auth=enable_pin_auth
        )
        db.session.add(new_user)
        db.session.flush()  # Get the user ID
        
        # Create associated profile
        if new_user.user_type == 'parent':
            parent = Parent(user_id=new_user.id)
            db.session.add(parent)
        else:
            adolescent = Adolescent(user_id=new_user.id)
            db.session.add(adolescent)
        
        # Create welcome notification
        welcome_msg = f"Welcome to The Lady's Essence, {name}! Your account has been created successfully."
        if enable_pin_auth:
            welcome_msg += " PIN authentication is enabled."
        
        notification = Notification(
            user_id=new_user.id,
            message=welcome_msg,
            notification_type='welcome'
        )
        db.session.add(notification)
        
        db.session.commit()
        
        pin_msg = "\nPIN enabled for fast login!" if enable_pin_auth else ""
        return f"END ✅ Registration successful!\nWelcome {name}!{pin_msg}\nYou can now access our services."
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return "END Registration failed. Please try again."

def handle_login_flow(input_list, phone_number):
    """Handle user login flow with PIN or password support"""
    if len(input_list) == 2:
        # First input after phone number - try to authenticate with PIN
        pin_or_password = input_list[1]
        user = User.query.filter_by(phone_number=phone_number).first()
        
        if not user:
            return "END No account found with this phone number."
        
        # Try PIN authentication first if it's 4 digits
        if len(pin_or_password) == 4 and pin_or_password.isdigit():
            if user.enable_pin_auth and user.pin_hash and bcrypt.check_password_hash(user.pin_hash, pin_or_password):
                # PIN authentication successful
                return main_menu(user)
            elif user.enable_pin_auth and (not user.pin_hash or not bcrypt.check_password_hash(user.pin_hash, pin_or_password)):
                # PIN auth enabled but PIN incorrect
                return "END Invalid PIN. Please try again."
        
        # Try password authentication
        if bcrypt.check_password_hash(user.password_hash, pin_or_password):
            return main_menu(user)
        else:
            return "END Invalid password. Please try again."
    
    return "END Invalid login attempt."

def handle_menu_navigation(user, input_list):
    """Handle main menu navigation for authenticated users with enhanced backflow support"""
    # User is already authenticated at this point, no need to verify PIN again
    steps = len(input_list)
    
    logger.info(f"Menu Navigation: User={user.name}, Steps={steps}, Input={input_list}")
    
    if steps < 1:
        return main_menu(user)
    
    current_selection = input_list[0]  # First element is the menu selection
    
    # Enhanced backflow detection: Check if user is trying to navigate to main menu after backflow
    # This happens when:
    # 1. User was in a service (e.g., cycle tracking)
    # 2. Used backflow navigation ('0')
    # 3. Now wants to select a different main menu option
    if steps >= 2:
        # Check if the last input suggests user wants to return to main menu level
        last_input = input_list[-1]
        
        # If the last input is a main menu option (1-9) and we're deeper in navigation,
        # it likely means user wants to navigate to a different service
        if last_input in ['1', '2', '3', '4', '5', '6', '7', '8', '9'] and steps > 2:
            # Check if current service context doesn't match the new selection
            current_service_map = {
                '1': 'cycle_tracking',
                '2': 'meal_logging', 
                '3': 'appointments',
                '4': 'education',
                '5': 'notifications',
                '6': 'parent_dashboard',
                '7': 'settings',
                '8': 'feedback',
                '9': 'help'
            }
            
            requested_service = current_service_map.get(last_input)
            current_service = current_service_map.get(current_selection)
            
            # If user is requesting a different service, treat it as main menu navigation
            if requested_service and current_service and requested_service != current_service:
                logger.info(f"Cross-service navigation detected: {current_service} -> {requested_service}")
                # Redirect to the requested service with clean input
                new_input_list = [last_input]
                return handle_menu_navigation(user, new_input_list)
    
    try:
        logger.info(f"Processing menu selection: {current_selection}")
        
        if current_selection == '1':
            return handle_cycle_tracking(user, input_list)
        elif current_selection == '2':
            return handle_meal_logging(user, input_list)
        elif current_selection == '3':
            return handle_appointments(user, input_list)
        elif current_selection == '4':
            return handle_education(user, input_list)
        elif current_selection == '5':
            return handle_notifications(user, input_list)
        elif current_selection == '6' and user.user_type == 'parent':
            return handle_parent_dashboard(user, input_list)
        elif current_selection == '7':
            return handle_settings(user, input_list)
        elif current_selection == '8':
            return handle_feedback_submission(user, input_list)
        elif current_selection == '9':
            return handle_help_menu(user, input_list)
        elif current_selection == '0':
            return "END Thank you for using The Lady's Essence! Take care! 🌸"
        else:
            return "END Invalid menu selection."
    except Exception as e:
        logger.error(f"Menu navigation error: {str(e)}")
        return "END Error processing request. Please try again."

def handle_help_menu(user, input_list):
    """Handle help menu navigation"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'help')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        return """CON 🆘 Help & Support:
1. How to use this service
2. Health emergency contacts
3. Technical support
4. Privacy information
5. Terms of service
0. Back to main menu
00. Main Menu"""
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            return get_usage_instructions()
        elif selection == '2':
            return f"CON {get_emergency_contacts()}\n0. Back\n00. Main Menu"
        elif selection == '3':
            return get_technical_support()
        elif selection == '4':
            return get_privacy_info()
        elif selection == '5':
            return get_terms_of_service()
        elif selection == '0':
            return main_menu(user)
        else:
            return "END Invalid selection."
    
    return "END Invalid help flow."

def get_usage_instructions():
    """Return usage instructions"""
    return """CON 📖 How to Use:
• Use numbers to navigate menus
• Follow prompts for data entry
• Press 0 to go back
• Press 00 for main menu
• All personal data is encrypted
• Track cycles, meals, appointments
• Parents can monitor children
• Get health education content
0. Back
00. Main Menu"""

def get_technical_support():
    """Return technical support information"""
    return """CON 🔧 Technical Support:
• Service issues: *123*911#
• Lost access: Contact clinic
• Data problems: Report via feedback
• Emergency access: Call directly
• Hours: 24/7 support available
0. Back
00. Main Menu"""

def get_privacy_info():
    """Return privacy information"""
    return """CON 🔒 Privacy & Security:
• All data encrypted in transit
• Medical data stored securely
• Only authorized access allowed
• Parents see child summary only
• Delete account removes all data
• HIPAA compliant system
0. Back
00. Main Menu"""

def get_terms_of_service():
    """Return terms of service summary"""
    return """CON 📄 Terms of Service:
• Service for health tracking only
• Not a substitute for medical care
• Emergency: Call 911 immediately
• Data accuracy not guaranteed
• User responsible for data entry
• Service may be unavailable
0. Back
00. Main Menu"""

def main_menu(user):
    """Generate main menu based on user type and clear session state"""
    # Clear session state when returning to main menu
    if user:
        clear_session_state(user)
    return enhanced_main_menu(user)

def handle_cycle_tracking(user, input_list):
    """Enhanced cycle tracking with session state management"""
    steps = len(input_list)
    
    # Save session state for potential resume, preserving existing prediction context
    existing_session = get_session_state(user) or {}
    session_data = {
        'service': 'cycle_tracking',
        'inputs': input_list,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Preserve prediction navigation context if it exists
    if 'prediction_month_offset' in existing_session:
        session_data['prediction_month_offset'] = existing_session['prediction_month_offset']
    if 'viewing_predictions' in existing_session:
        session_data['viewing_predictions'] = existing_session['viewing_predictions']
    
    save_session_state(user, session_data)
    
    # Check for universal back navigation first
    if steps > 1:
        last_input = input_list[-1]
        if last_input == '00':
            clear_session_state(user)
            return main_menu(user)
        elif last_input == '0' and steps > 1:
            # Go back to previous level
            if steps == 2:
                return main_menu(user)
            elif steps >= 3:
                return handle_cycle_tracking(user, input_list[:-1])
    
    if steps == 1:
        return ("CON 🔄 Cycle Tracking:\n1. Log Period Start\n2. Log Period End\n"
                "3. Current Status\n4. Cycle History\n5. Cycle Predictions\n"
                "6. Update Cycle Info\n0. Back to Main Menu\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            # Check if user has provided cycle info
            if not user.has_provided_cycle_info:
                return ("CON First time logging? Let's get your cycle info!\n"
                       "Do you know your usual cycle length?\n1. Yes, I know it\n"
                       "2. No, I'm not sure\n0. Back\n00. Main Menu")
        
        elif selection == '2':
            # Find current active cycle
            active_cycle = CycleLog.query.filter_by(user_id=user.id, end_date=None).order_by(CycleLog.start_date.desc()).first()
            if not active_cycle:
                clear_session_state(user)
                return "END No active period to end."
            return ("CON Log Period End\nEnter date (DD-MM-YYYY)\n"
                   "or press 1 for today:\n0. Back\n00. Main Menu")
        
        elif selection == '3':
            return get_cycle_status(user)
        
        elif selection == '4':
            return get_cycle_history(user)
        
        elif selection == '5':
            # Get month offset from session state or default to 0
            session_data = get_session_state(user) or {}
            month_offset = 0
            if 'prediction_month_offset' in session_data:
                month_offset = session_data['prediction_month_offset']
            
            # Mark that user is viewing predictions for backflow context
            session_data['viewing_predictions'] = True
            session_data['prediction_month_offset'] = month_offset
            save_session_state(user, session_data)
            
            return get_cycle_predictions(user, month_offset)
        
        # Handle navigation from predictions (when user enters 'n' or 'p')
        # This includes navigation after backflow from predictions
        elif selection == 'n' or selection == 'p':
            session_data = get_session_state(user)
            
            # Check if user was previously viewing predictions or is navigating after backflow
            if session_data and (session_data.get('viewing_predictions') or 'prediction_month_offset' in session_data):
                if selection == 'n':  # Next month
                    month_offset = session_data.get('prediction_month_offset', 0) + 1
                    session_data['prediction_month_offset'] = month_offset
                    session_data['viewing_predictions'] = True
                    save_session_state(user, session_data)
                    return get_cycle_predictions(user, month_offset)
                
                elif selection == 'p':  # Previous month or current cycle info
                    current_offset = session_data.get('prediction_month_offset', 0)
                    if current_offset == 0:
                        # When at current month, 'p' shows current cycle info (same as current month)
                        session_data['viewing_predictions'] = True
                        save_session_state(user, session_data)
                        return get_cycle_predictions(user, 0)
                    else:
                        # When viewing future months, 'p' goes to previous month
                        month_offset = max(0, current_offset - 1)
                        session_data['prediction_month_offset'] = month_offset
                        session_data['viewing_predictions'] = True
                        save_session_state(user, session_data)
                        return get_cycle_predictions(user, month_offset)
            else:
                # User trying to navigate without prediction context
                return "END Invalid selection. Enter 5 to view predictions first, then use 'n' or 'p' to navigate."
        
        elif selection == '6':
            # Get user's cycle statistics for better display
            completed_cycles = CycleLog.query.filter_by(user_id=user.id).filter(
                CycleLog.end_date.isnot(None),
                CycleLog.cycle_length.isnot(None)
            ).count()
            
            avg_cycle = "Not calculated"
            avg_period = "Not calculated"
            
            if completed_cycles >= 2:
                recent_cycles = CycleLog.query.filter_by(user_id=user.id).filter(
                    CycleLog.end_date.isnot(None),
                    CycleLog.cycle_length.isnot(None)
                ).order_by(CycleLog.start_date.desc()).limit(6).all()
                
                # Calculate average cycle length
                if recent_cycles:
                    avg_cycle_value = sum(c.cycle_length for c in recent_cycles) / len(recent_cycles)
                    avg_cycle = f"{avg_cycle_value:.1f} days"
                
                # Calculate average period length (only from cycles that have period_length)
                period_cycles = [c for c in recent_cycles if c.period_length is not None]
                if period_cycles:
                    avg_period_value = sum(c.period_length for c in period_cycles) / len(period_cycles)
                    avg_period = f"{avg_period_value:.1f} days"
                else:
                    avg_period = "No period data"
            
            return (f"CON 🔧 Cycle Information Management:\n"
                   f"📊 Current Settings:\n"
                   f"Personal cycle: {user.personal_cycle_length or 'Not set'} days\n"
                   f"Personal period: {user.personal_period_length or 'Not set'} days\n"
                   f"Data provided: {'Yes' if user.has_provided_cycle_info else 'No'}\n\n"
                   f"📈 Calculated from logs:\n"
                   f"Avg cycle: {avg_cycle}\n"
                   f"Avg period: {avg_period}\n"
                   f"Completed cycles: {completed_cycles}\n\n"
                   f"1. Update cycle length\n2. Update period length\n"
                   f"3. View data sources\n4. Reset to calculated averages\n"
                   f"0. Back\n00. Main Menu")
        
        elif selection == '0':
            return main_menu(user)
        
        else:
            return "END Invalid selection. Try 0 for back or 00 for main menu."
    
    elif steps == 3:
        selection = input_list[2]
        
        if input_list[1] == '1':  # Log period start flow
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:2])
            elif selection == '00':
                return main_menu(user)
            elif not user.has_provided_cycle_info:
                # Handle cycle info collection
                if selection == '1':  # User knows cycle length
                    return ("CON Great! Enter your usual cycle length\n(in days, e.g., 28):\n"
                           "0. Back\n00. Main Menu")
                elif selection == '2':  # User not sure
                    # Skip cycle info and proceed with standard
                    return ("CON No problem! We'll use standard estimates.\n"
                           "Enter period start date (DD-MM-YYYY)\nor press 1 for today:\n"
                           "0. Back\n00. Main Menu")
                else:
                    return "END Invalid selection. Try again."
            else:
                # User already provided cycle info, so this is the date input
                return ("CON Log Period Start\nEnter date (DD-MM-YYYY)\n"
                       "or press 1 for today:\n0. Back\n00. Main Menu")
        
        elif input_list[1] == '2':  # Log period end
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:2])
            elif selection == '00':
                return main_menu(user)
            else:
                return handle_period_end(user, selection)
        
        elif input_list[1] == '6':  # Update cycle info
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:2])
            elif selection == '00':
                return main_menu(user)
            elif selection == '1':
                return ("CON Enter new cycle length (21-40 days):\n"
                       "0. Back\n00. Main Menu")
            elif selection == '2':
                return ("CON Enter new period length (3-8 days):\n"
                       "0. Back\n00. Main Menu")
            elif selection == '3':
                # View data sources - show recent cycles used for calculations
                recent_cycles = CycleLog.query.filter_by(user_id=user.id).filter(
                    CycleLog.end_date.isnot(None),
                    CycleLog.cycle_length.isnot(None)
                ).order_by(CycleLog.start_date.desc()).limit(6).all()
                
                if not recent_cycles:
                    return "END 📊 No completed cycles found. Start logging periods to see data sources."
                
                response = "CON 📊 Recent cycles used for calculations:\n\n"
                for i, cycle in enumerate(recent_cycles, 1):
                    period_info = f"{cycle.period_length}d" if cycle.period_length else "No period data"
                    response += f"{i}. {cycle.start_date.strftime('%d %b %Y')}: {cycle.cycle_length}d cycle, {period_info}\n"
                
                response += f"\n💡 Using last {len(recent_cycles)} cycles for averages\n"
                response += "0. Back\n00. Main Menu"
                return response
            elif selection == '4':
                # Reset to use calculated averages
                user.has_provided_cycle_info = False
                user.personal_cycle_length = None
                user.personal_period_length = None
                db.session.commit()
                return "END ✅ Cycle info reset! Future predictions will use your cycle history."
            else:
                return "END Invalid selection."
        
        elif input_list[1] == '5':  # Handle prediction navigation
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:2])
            elif selection == '00':
                return main_menu(user)
            elif selection == 'n':  # Next month
                session_data = get_session_state(user) or {}
                month_offset = session_data.get('prediction_month_offset', 0) + 1
                session_data['prediction_month_offset'] = month_offset
                save_session_state(user, session_data)
                return get_cycle_predictions(user, month_offset)
            elif selection == 'p':  # Previous month
                session_data = get_session_state(user) or {}
                month_offset = max(0, session_data.get('prediction_month_offset', 0) - 1)
                session_data['prediction_month_offset'] = month_offset
                save_session_state(user, session_data)
                return get_cycle_predictions(user, month_offset)
            else:
                return "END Invalid selection. Use 'n' for next month, 'p' for previous, or 0 for back."
    
    elif steps == 4:
        if input_list[1] == '1':  # Log period start flow
            selection = input_list[3]
            
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:3])
            elif selection == '00':
                return main_menu(user)
            elif not user.has_provided_cycle_info and input_list[2] == '1':  # User provided cycle length
                try:
                    cycle_length = int(selection)
                    if 21 <= cycle_length <= 40:  # Reasonable range
                        return ("CON Perfect! Now enter your usual period length\n"
                               "(in days, e.g., 5):\n0. Back\n00. Main Menu")
                    else:
                        return "END Cycle length should be between 21-40 days."
                except ValueError:
                    return "END Please enter a valid number."
            elif not user.has_provided_cycle_info and input_list[2] == '2':  # User not sure, proceeding with date
                # Mark as info not provided and handle period start
                return handle_period_start(user, selection)
            elif user.has_provided_cycle_info:  # User already has cycle info, this is date input
                return handle_period_start(user, selection)
        
        elif input_list[1] == '6':  # Update cycle info
            selection = input_list[3]
            
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:3])
            elif selection == '00':
                return main_menu(user)
            elif input_list[2] == '3':  # Data sources view navigation
                if selection == '0':
                    return handle_cycle_tracking(user, input_list[:2])  # Back to cycle info menu
                elif selection == '00':
                    return main_menu(user)
                else:
                    return "END Invalid selection."
            elif input_list[2] == '1':  # Update cycle length
                try:
                    cycle_length = int(selection)
                    if 21 <= cycle_length <= 40:
                        user.personal_cycle_length = cycle_length
                        user.has_provided_cycle_info = True
                        db.session.commit()
                        return "END ✅ Cycle length updated successfully!"
                    else:
                        return "END Cycle length should be between 21-40 days."
                except ValueError:
                    return "END Please enter a valid number."
            elif input_list[2] == '2':  # Update period length
                try:
                    period_length = int(selection)
                    if 3 <= period_length <= 8:
                        user.personal_period_length = period_length
                        user.has_provided_cycle_info = True
                        db.session.commit()
                        return "END ✅ Period length updated successfully!"
                    else:
                        return "END Period length should be between 3-8 days."
                except ValueError:
                    return "END Please enter a valid number."
    
    elif steps == 5:
        if input_list[1] == '1' and input_list[2] == '1' and not user.has_provided_cycle_info:
            selection = input_list[4]
            
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:4])
            elif selection == '00':
                return main_menu(user)
            else:
                try:
                    period_length = int(selection)
                    cycle_length = int(input_list[3])
                    
                    if 3 <= period_length <= 8:  # Reasonable range
                        # Save user's cycle info
                        user.personal_cycle_length = cycle_length
                        user.personal_period_length = period_length
                        user.has_provided_cycle_info = True
                        db.session.commit()
                        
                        return ("CON Excellent! Your cycle info saved.\n"
                               "Now enter period start date (DD-MM-YYYY)\n"
                               "or press 1 for today:\n0. Back\n00. Main Menu")
                    else:
                        return "END Period length should be between 3-8 days."
                except ValueError:
                    return "END Please enter a valid number."
    
    elif steps == 6:
        if input_list[1] == '1':
            selection = input_list[5]
            if selection == '0':
                return handle_cycle_tracking(user, input_list[:5])
            elif selection == '00':
                return main_menu(user)
            else:
                return handle_period_start(user, selection)
    
    return "END Invalid flow. Try 0 for back or 00 for main menu."

def handle_period_start(user, date_input):
    """Enhanced period start logging with robust error handling"""
    try:
        # Parse the date input
        if date_input == '1':
            start_date = datetime.now()
        else:
            try:
                start_date = datetime.strptime(date_input, '%d-%m-%Y')
            except ValueError:
                return "END ❌ Invalid date format. Please use DD-MM-YYYY (e.g., 15-03-2024) or press 1 for today."
        
        # Validate date is not in the future
        if start_date > datetime.now():
            return "END ❌ Period start date cannot be in the future. Please enter a valid date."
        
        # Validate date is not too far in the past (more than 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        if start_date < six_months_ago:
            return "END ❌ Period start date is too far in the past. Please enter a date within the last 6 months."
        
        # Check for existing active cycle
        existing_active = CycleLog.query.filter_by(user_id=user.id, end_date=None).first()
        if existing_active:
            # Convert start_date to date if it's a datetime for comparison
            start_date_for_comparison = start_date.date() if isinstance(start_date, datetime) else start_date
            existing_start_date = existing_active.start_date
            
            days_since_start = (start_date_for_comparison - existing_start_date).days
            return (f"END ❌ You have an active period that started on {existing_active.start_date.strftime('%d %b %Y')} "
                   f"({abs(days_since_start)} days ago). Please end it first before starting a new one.")
        
        # Check for duplicate cycles on the same date
        start_date_only = start_date.date() if isinstance(start_date, datetime) else start_date
        existing_same_date = CycleLog.query.filter_by(
            user_id=user.id, 
            start_date=start_date_only
        ).first()
        if existing_same_date:
            return (f"END ❌ A cycle already exists for {start_date.strftime('%d %b %Y')}. "
                   f"If you need to update it, please contact support or use a different date.")
        
        # Check for overlapping with recent cycles
        recent_cycle = CycleLog.query.filter_by(user_id=user.id).filter(
            CycleLog.start_date >= start_date_only - timedelta(days=45),
            CycleLog.start_date <= start_date_only + timedelta(days=45)
        ).filter(CycleLog.id != getattr(existing_same_date, 'id', 0)).first()
        
        if recent_cycle:
            days_diff = abs((start_date_only - recent_cycle.start_date).days)
            if days_diff < 15:  # Too close to another cycle
                return (f"END ⚠️ This date is very close to an existing cycle on {recent_cycle.start_date.strftime('%d %b %Y')} "
                       f"({days_diff} days apart). Cycles are usually 21-40 days apart. Please check your date.")
        
        # Use user's personal cycle length or calculate from history
        predicted_cycle_length = 28  # Default
        
        if user.has_provided_cycle_info and user.personal_cycle_length:
            predicted_cycle_length = user.personal_cycle_length
        else:
            # Calculate from history if available
            recent_cycles = CycleLog.query.filter_by(user_id=user.id).filter(
                CycleLog.end_date.isnot(None),
                CycleLog.cycle_length.isnot(None)
            ).order_by(CycleLog.start_date.desc()).limit(3).all()
            
            if recent_cycles:
                total_length = sum(c.cycle_length for c in recent_cycles if c.cycle_length)
                predicted_cycle_length = total_length // len(recent_cycles) if total_length else 28
        
        # Create the new cycle log
        new_cycle = CycleLog(
            user_id=user.id,
            start_date=start_date_only,
            cycle_length=predicted_cycle_length
        )
        
        try:
            db.session.add(new_cycle)
            
            # Create notification for period tracking
            notification = Notification(
                user_id=user.id,
                message=f"Period started on {start_date.strftime('%d %b %Y')}. Remember to stay hydrated and take care!",
                notification_type='cycle'
            )
            db.session.add(notification)
            
            db.session.commit()
            
            # Clear any session state related to cycle tracking
            clear_session_state(user)
            
            return (f"END ✅ Period start logged successfully for {start_date.strftime('%d %b %Y')}!\n"
                   f"💡 Remember to log when your period ends for better tracking.")
            
        except Exception as db_error:
            db.session.rollback()
            logger.error(f"Database error in period start logging: {str(db_error)}")
            return "END ❌ Database error occurred. Please try again or contact support."
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error in period start logging: {str(e)}")
        return "END ❌ An unexpected error occurred. Please try again or contact support."

def handle_period_end(user, date_input):
    """Enhanced period end logging with robust error handling"""
    try:
        # Parse the date input
        if date_input == '1':
            end_date = datetime.now()
        else:
            try:
                end_date = datetime.strptime(date_input, '%d-%m-%Y')
            except ValueError:
                return "END ❌ Invalid date format. Please use DD-MM-YYYY (e.g., 20-03-2024) or press 1 for today."
        
        # Validate date is not in the future
        if end_date > datetime.now():
            return "END ❌ Period end date cannot be in the future. Please enter a valid date."
        
        # Find active cycle
        active_cycle = CycleLog.query.filter_by(user_id=user.id, end_date=None).order_by(CycleLog.start_date.desc()).first()
        if not active_cycle:
            return "END ❌ No active period found to end. Please start a period first before ending it."
        
        # Validate end date is not before start date
        if end_date.date() < active_cycle.start_date:
            return (f"END ❌ Period end date ({end_date.strftime('%d %b %Y')}) cannot be before "
                   f"the start date ({active_cycle.start_date.strftime('%d %b %Y')}). Please enter a valid end date.")
        
        # Calculate period length and validate it's reasonable
        period_length = (end_date.date() - active_cycle.start_date).days + 1
        
        if period_length > 10:
            return (f"END ⚠️ Period duration of {period_length} days seems unusually long. "
                   f"Normal periods last 3-8 days. Please double-check your dates or consult a healthcare provider.")
        
        if period_length < 1:
            return "END ❌ Period duration must be at least 1 day. Please check your dates."
        
        # Update the active cycle
        try:
            active_cycle.end_date = end_date.date()
            active_cycle.period_length = period_length
            
            # Calculate cycle length if this isn't the first cycle
            previous_cycle = CycleLog.query.filter_by(user_id=user.id).filter(
                CycleLog.start_date < active_cycle.start_date,
                CycleLog.end_date.isnot(None)
            ).order_by(CycleLog.start_date.desc()).first()
            
            if previous_cycle:
                cycle_length = (active_cycle.start_date - previous_cycle.start_date).days
                active_cycle.cycle_length = cycle_length
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                message=f"Period ended on {end_date.strftime('%d %b %Y')}. Duration: {period_length} days.",
                notification_type='cycle'
            )
            db.session.add(notification)
            
            db.session.commit()
            
            # Clear any session state
            clear_session_state(user)
            
            # Provide helpful feedback
            response = f"✅ Period ended on {end_date.strftime('%d %b %Y')}!\nDuration: {period_length} days"
            
            if period_length <= 3:
                response += "\n💡 Your period was quite short. This can be normal but track your patterns."
            elif period_length >= 7:
                response += "\n💡 Your period was longer than average. Consider tracking symptoms."
            else:
                response += "\n💡 This is within the normal range for period duration."
            
            return f"END {response}"
            
        except Exception as db_error:
            db.session.rollback()
            logger.error(f"Database error in period end logging: {str(db_error)}")
            return "END ❌ Database error occurred. Please try again or contact support."
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error in period end logging: {str(e)}")
        return "END ❌ An unexpected error occurred. Please try again or contact support."

def get_cycle_status(user):
    """Get current cycle status"""
    active_cycle = CycleLog.query.filter_by(user_id=user.id, end_date=None).order_by(CycleLog.start_date.desc()).first()
    
    if active_cycle:
        days_since_start = (datetime.now() - active_cycle.start_date).days
        return f"END 🔄 Current Status:\nPeriod active since {active_cycle.start_date.strftime('%d %b')}\nDay {days_since_start + 1} of current period"
    
    # Check last completed cycle
    last_cycle = CycleLog.query.filter_by(user_id=user.id).filter(
        CycleLog.end_date.isnot(None)
    ).order_by(CycleLog.start_date.desc()).first()
    
    if last_cycle:
        days_since_last = (datetime.now() - last_cycle.end_date).days
        predicted_next = last_cycle.end_date + timedelta(days=last_cycle.cycle_length - last_cycle.period_length)
        
        if datetime.now().date() > predicted_next.date():
            return f"END ⚠️ Period may be late!\nLast ended: {last_cycle.end_date.strftime('%d %b')}\nExpected: {predicted_next.strftime('%d %b')}"
        else:
            return f"END 📅 Next period expected:\n{predicted_next.strftime('%d %b %Y')}\n({(predicted_next - datetime.now()).days} days)"
    
    return "END No cycle data available. Start tracking your period!"

def get_cycle_history(user):
    """Get cycle history with navigation"""
    cycles = CycleLog.query.filter_by(user_id=user.id).order_by(CycleLog.start_date.desc()).limit(5).all()
    
    if not cycles:
        return "END No cycle history available."
    
    response = "CON 📊 Last 5 Cycles:\n"
    for idx, cycle in enumerate(cycles, 1):
        status = "Active" if not cycle.end_date else f"{cycle.period_length}d"
        response += f"{idx}. {cycle.start_date.strftime('%d %b')} - {status}\n"
    
    return response + "0. Back\n00. Main Menu"

def get_cycle_predictions(user, month_offset=0):
    """Enhanced cycle predictions with all phases displayed and optimized for small screens"""
    recent_cycles = CycleLog.query.filter_by(user_id=user.id).filter(
        CycleLog.end_date.isnot(None),
        CycleLog.cycle_length.isnot(None)
    ).order_by(CycleLog.start_date.desc()).limit(6).all()
    
    completed_cycles_count = len(recent_cycles)
    use_personal_info = user.has_provided_cycle_info and user.personal_cycle_length
    
    # Determine prediction accuracy and source
    if completed_cycles_count >= 3:
        # Use actual cycle data for accurate predictions
        avg_cycle = sum(c.cycle_length for c in recent_cycles) / len(recent_cycles)
        period_cycles = [c for c in recent_cycles if c.period_length]
        avg_period = sum(c.period_length for c in period_cycles) / len(period_cycles) if period_cycles else 5
        prediction_source = "historical"
        accuracy_note = "📊 Based on your cycle data"
    elif use_personal_info:
        # Use personal cycle information
        avg_cycle = user.personal_cycle_length
        avg_period = user.personal_period_length if user.personal_period_length else 5
        prediction_source = "personal"
        accuracy_note = "📋 Based on your cycle info"
    else:
        # Use standard estimates
        avg_cycle = 28
        avg_period = 5
        prediction_source = "standard"
        accuracy_note = "⚠️ Using standard estimates"
    
    # Calculate target month boundaries
    today = datetime.now().date()
    
    # Handle current cycle view (month_offset = 0 means current month)
    if month_offset == 0:
        target_month_start = today.replace(day=1)
        month_label = "Current Month"
    else:
        target_month_start = (today.replace(day=1) + timedelta(days=32 * month_offset)).replace(day=1)
        month_label = "Predictions"
    
    # Get next month start
    if target_month_start.month == 12:
        next_month_start = target_month_start.replace(year=target_month_start.year + 1, month=1)
    else:
        next_month_start = target_month_start.replace(month=target_month_start.month + 1)

    # Determine the prediction base date
    if recent_cycles:
        # Find the most recent cycle and calculate next expected start
        last_cycle = recent_cycles[0]
        # Convert date to datetime for calculation
        last_start = datetime.combine(last_cycle.start_date, datetime.min.time())
        prediction_base = last_start + timedelta(days=int(avg_cycle))
    else:
        # If no cycles logged, start predictions from today
        prediction_base = datetime.combine(today, datetime.min.time())
    
    # Find cycles that fall within or span the target month
    cycles_in_month = []
    cycle_num = 0
    max_cycles_to_check = 12  # Check up to 12 cycles ahead
    
    while cycle_num < max_cycles_to_check:
        cycle_start_date = prediction_base + timedelta(days=int(avg_cycle) * cycle_num)
        cycle_start = cycle_start_date.date()
        
        # Calculate cycle end
        cycle_end = cycle_start + timedelta(days=int(avg_cycle) - 1)
        
        # Stop if we've gone too far past the target month
        if cycle_start >= next_month_start + timedelta(days=31):
            break
        
        # Include if cycle starts in target month OR if any part of cycle overlaps with target month
        cycle_overlaps = (cycle_start <= next_month_start - timedelta(days=1) and 
                         cycle_end >= target_month_start)
        
        if cycle_overlaps or (cycle_start >= target_month_start and cycle_start < next_month_start):
            cycles_in_month.append({
                'cycle_num': cycle_num,
                'start_date': cycle_start_date,
                'start': cycle_start,
                'end': cycle_end
            })
        
        cycle_num += 1

    month_name = target_month_start.strftime('%b %Y')
    response = f"CON 🔮 {month_label}: {month_name}\n"
    response += f"{accuracy_note}\n"
    response += f"Cycle: {avg_cycle:.0f}d | Period: {avg_period:.0f}d\n\n"
    
    if not cycles_in_month:
        response += "No cycle activity this month.\n\n"
    else:
        for i, cycle_info in enumerate(cycles_in_month):
            cycle_start_date = cycle_info['start_date']
            
            # Calculate all cycle phases
            period_start = cycle_start_date.date()
            period_end = period_start + timedelta(days=int(avg_period) - 1)
            
            # Follicular phase: after period ends until ovulation
            follicular_start = period_end + timedelta(days=1)
            
            # Ovulation typically occurs 14 days before next cycle
            ovulation_day = period_start + timedelta(days=int(avg_cycle) - 14)
            
            # Fertile window is typically 5 days before ovulation to 1 day after
            fertile_start = ovulation_day - timedelta(days=5)
            fertile_end = ovulation_day + timedelta(days=1)
            
            # Luteal phase: after ovulation until next cycle
            luteal_start = ovulation_day + timedelta(days=1)
            luteal_end = period_start + timedelta(days=int(avg_cycle) - 1)
            
            # Only show cycle number if multiple cycles
            if len(cycles_in_month) > 1:
                response += f"=== Cycle {i+1} ===\n"
            
            # Always show all phases, but mark if outside target month
            def format_date_range(start_date, end_date, phase_name):
                # Check if dates fall within target month
                start_in_month = target_month_start <= start_date < next_month_start
                end_in_month = target_month_start <= end_date < next_month_start
                
                if start_in_month and end_in_month:
                    return f"• {phase_name}: {start_date.strftime('%d')}-{end_date.strftime('%d %b')}"
                elif start_in_month:
                    return f"• {phase_name}: {start_date.strftime('%d %b')}→"
                elif end_in_month:
                    return f"• {phase_name}: →{end_date.strftime('%d %b')}"
                else:
                    # Phase spans outside month, show dates anyway
                    return f"• {phase_name}: {start_date.strftime('%d')}-{end_date.strftime('%d %b')}"
            
            def format_single_date(date, phase_name):
                if target_month_start <= date < next_month_start:
                    return f"• {phase_name}: {date.strftime('%d %b')}"
                else:
                    return f"• {phase_name}: {date.strftime('%d %b')}"
            
            # Display all phases in chronological order
            response += format_date_range(period_start, period_end, "Period") + "\n"
            
            if follicular_start <= ovulation_day - timedelta(days=1):
                response += format_date_range(follicular_start, ovulation_day - timedelta(days=1), "Follicular") + "\n"
            
            response += format_date_range(fertile_start, fertile_end, "Fertile window") + "\n"
            response += format_single_date(ovulation_day, "Ovulation") + "\n"
            response += format_date_range(luteal_start, luteal_end, "Luteal") + "\n"
            
            response += "\n"

    # Navigation options with improved labeling
    response += "n. Next month\n"
    if month_offset > 0:
        response += "p. Previous month\n"
    elif month_offset == 0:
        response += "p. Current cycle info\n"
    response += "0. Back\n00. Main Menu"
    return response

def handle_education(user, input_list):
    """Enhanced education content with better navigation"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'education')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        categories = ContentCategory.query.all()
        if not categories:
            return "END No education content available at the moment."
        
        menu = "CON 📚 Health Education:\n"
        for idx, cat in enumerate(categories, 1):
            menu += f"{idx}. {cat.name}\n"
        menu += "0. Back\n00. Main Menu"
        return menu
    
    elif steps == 2:
        try:
            category_index = int(input_list[1]) - 1
            categories = ContentCategory.query.all()
            
            if input_list[1] == '0':
                return main_menu(user)
            
            if 0 <= category_index < len(categories):
                category = categories[category_index]
                items = ContentItem.query.filter_by(category_id=category.id).all()
                
                if not items:
                    return "END No content available in this category."
                
                menu = f"CON 📖 {category.name}:\n"
                for idx, item in enumerate(items, 1):
                    # Truncate long titles
                    title = item.title[:30] + "..." if len(item.title) > 30 else item.title
                    menu += f"{idx}. {title}\n"
                menu += "0. Back\n00. Main Menu"
                return menu
            else:
                return "END Invalid category selection."
                
        except ValueError:
            return "END Invalid selection."
    
    elif steps == 3:
        try:
            if input_list[2] == '0':
                return handle_education(user, input_list[:1])
            
            category_index = int(input_list[1]) - 1
            item_index = int(input_list[2]) - 1
            
            categories = ContentCategory.query.all()
            if 0 <= category_index < len(categories):
                category = categories[category_index]
                items = ContentItem.query.filter_by(category_id=category.id).all()
                
                if 0 <= item_index < len(items):
                    item = items[item_index]
                    pages = format_content(item.content, 140)  # Leave room for navigation
                    
                    # Store reading activity
                    notification = Notification(
                        user_id=user.id,
                        message=f"Read: {item.title}",
                        notification_type='education'
                    )
                    db.session.add(notification)
                    db.session.commit()
                    
                    if len(pages) > 1:
                        return f"CON {item.title}\n\n{pages[0]}\n\n1. Next page\n0. Back\n00. Main Menu"
                    else:
                        return f"CON {item.title}\n\n{pages[0]}\n\n0. Back\n00. Main Menu"
                else:
                    return "END Invalid article selection."
            else:
                return "END Invalid category."
                
        except ValueError:
            return "END Invalid selection."
    
    elif steps == 4:
        # Handle pagination
        if input_list[3] == '1':  # Next page
            try:
                category_index = int(input_list[1]) - 1
                item_index = int(input_list[2]) - 1
                
                categories = ContentCategory.query.all()
                category = categories[category_index]
                items = ContentItem.query.filter_by(category_id=category.id).all()
                item = items[item_index]
                
                pages = format_content(item.content, 140)
                if len(pages) > 1:
                    return f"CON {item.title} (2/{len(pages)})\n\n{pages[1]}\n\n2. Next\n9. Previous\n0. Back"
                
            except (ValueError, IndexError):
                pass
        
        return "END Invalid navigation."
    
    return "END Invalid flow."

def handle_notifications(user, input_list):
    """Enhanced notification management with backflow navigation"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'notifications')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        unread_count = Notification.query.filter_by(user_id=user.id, read=False).count()
        return (f"CON 🔔 Notifications ({unread_count} unread):\n"
                "1. View Unread\n2. View All\n3. Mark All Read\n4. Clear Old\n\n"
                "0. Back\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            return get_unread_notifications(user)
        elif selection == '2':
            return get_all_notifications(user)
        elif selection == '3':
            return mark_all_notifications_read(user)
        elif selection == '4':
            return clear_old_notifications(user)
        else:
            return "END Invalid selection. Try again."
    
    elif steps == 3:
        if input_list[1] in ['1', '2']:  # Viewing notifications
            return handle_notification_details(user, input_list)
    
    return "END Invalid flow. Please start again."

def get_unread_notifications(user):
    """Get unread notifications"""
    notifications = Notification.query.filter_by(
        user_id=user.id, read=False
    ).order_by(Notification.created_at.desc()).limit(10).all()
    
    if not notifications:
        return "END No unread notifications."
    
    response = "CON 📬 Unread Notifications:\n"
    for idx, notif in enumerate(notifications, 1):
        # Truncate long messages
        message = notif.message[:40] + "..." if len(notif.message) > 40 else notif.message
        type_emoji = get_notification_emoji(notif.notification_type)
        response += f"{idx}. {type_emoji} {message}\n"
    
    response += "0. Back"
    return response

def get_all_notifications(user):
    """Get all recent notifications"""
    notifications = Notification.query.filter_by(
        user_id=user.id
    ).order_by(Notification.created_at.desc()).limit(10).all()
    
    if not notifications:
        return "END No notifications found."
    
    response = "CON 📋 All Notifications:\n"
    for idx, notif in enumerate(notifications, 1):
        read_status = "✓" if notif.read else "●"
        message = notif.message[:35] + "..." if len(notif.message) > 35 else notif.message
        type_emoji = get_notification_emoji(notif.notification_type)
        response += f"{idx}. {read_status}{type_emoji} {message}\n"
    
    response += "0. Back"
    return response

def mark_all_notifications_read(user):
    """Mark all notifications as read"""
    try:
        Notification.query.filter_by(user_id=user.id, read=False).update({'read': True})
        db.session.commit()
        return "END ✅ All notifications marked as read."
    except Exception as e:
        db.session.rollback()
        logger.error(f"Mark notifications read error: {str(e)}")
        return "END Error updating notifications."

def clear_old_notifications(user):
    """Clear notifications older than 30 days"""
    try:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        old_notifications = Notification.query.filter_by(user_id=user.id).filter(
            Notification.created_at < thirty_days_ago
        )
        count = old_notifications.count()
        old_notifications.delete()
        db.session.commit()
        return f"END ✅ Cleared {count} old notifications."
    except Exception as e:
        db.session.rollback()
        logger.error(f"Clear notifications error: {str(e)}")
        return "END Error clearing notifications."

def handle_notification_details(user, input_list):
    """Show notification details"""
    try:
        notif_index = int(input_list[2]) - 1
        
        if input_list[1] == '1':  # Unread notifications
            notifications = Notification.query.filter_by(
                user_id=user.id, read=False
            ).order_by(Notification.created_at.desc()).limit(10).all()
        else:  # All notifications
            notifications = Notification.query.filter_by(
                user_id=user.id
            ).order_by(Notification.created_at.desc()).limit(10).all()
        
        if 0 <= notif_index < len(notifications):
            notification = notifications[notif_index]
            # Mark as read
            notification.read = True
            db.session.commit()
            
            date_str = notification.created_at.strftime('%d %b %H:%M')
            type_emoji = get_notification_emoji(notification.notification_type)
            
            return f"CON {type_emoji} Notification\n{date_str}\n\n{notification.message}\n\n0. Back"
        else:
            return "END Invalid notification selection."
            
    except (ValueError, IndexError):
        return "END Invalid selection."

def get_notification_emoji(notification_type):
    """Get emoji for notification type"""
    emojis = {
        'cycle': '🔄',
        'appointment': '📅',
        'nutrition': '🍽️',
        'education': '📚',
        'family': '👨‍👩‍👧',
        'welcome': '🌸',
        'reminder': '⏰',
        'health': '❤️'
    }
    return emojis.get(notification_type, '📢')

def handle_parent_dashboard(user, input_list):
    """Enhanced parent dashboard with comprehensive child management"""
    parent = Parent.query.filter_by(user_id=user.id).first()
    if not parent:
        return "END Parent profile not found"
    
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'parent_dashboard')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        children_count = ParentChild.query.filter_by(parent_id=parent.id).count()
        return (f"CON 👨‍👩‍👧 Parent Dashboard ({children_count} children):\n"
                "1. View Children\n2. Add Child\n3. Remove Child\n"
                "4. Child Health Summary\n0. Back\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            return handle_view_children(parent, input_list)
        elif selection == '2':
            return handle_add_child(parent, input_list)
        elif selection == '3':
            return handle_remove_child(parent, input_list)
        elif selection == '4':
            return handle_child_health_summary(parent)
        elif selection == '0':
            return main_menu(user)
        else:
            return "END Invalid selection."
    
    # Handle subsequent steps for each option
    elif steps >= 3:
        if input_list[1] == '1':
            return handle_view_children(parent, input_list)
        elif input_list[1] == '2':
            return handle_add_child(parent, input_list)
        elif input_list[1] == '3':
            return handle_remove_child(parent, input_list)
    
    return main_menu(user)

def handle_view_children(parent, input_list):
    """View children with detailed information"""
    children = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    if len(input_list) == 2:
        if not children:
            return "END No children linked to your account."
        
        response = "CON 👶 Your Children:\n"
        for idx, relation in enumerate(children, 1):
            try:
                adolescent = Adolescent.query.get(relation.adolescent_id)
                child_user = User.query.get(adolescent.user_id)
                response += f"{idx}. {child_user.name} ({relation.relationship_type})\n"
            except AttributeError:
                response += f"{idx}. Unknown child\n"
        
        response += "Select to view details\n0. Back\n00. Main Menu"
        return response
    
    elif len(input_list) == 3:
        try:
            child_index = int(input_list[2]) - 1
            if input_list[2] == '0':
                return handle_parent_dashboard(parent.user, input_list[:1])
            
            if 0 <= child_index < len(children):
                relation = children[child_index]
                adolescent = Adolescent.query.get(relation.adolescent_id)
                child_user = User.query.get(adolescent.user_id)
                
                # Get child's recent activity
                recent_cycles = CycleLog.query.filter_by(user_id=child_user.id).count()
                recent_meals = MealLog.query.filter_by(user_id=child_user.id).filter(
                    MealLog.meal_time >= datetime.now() - timedelta(days=7)
                ).count()
                
                response = f"CON 👤 {child_user.name}\n"
                response += f"Relationship: {relation.relationship_type}\n"
                response += f"Cycles tracked: {recent_cycles}\n"
                response += f"Meals this week: {recent_meals}\n"
                response += "0. Back\n00. Main Menu"
                
                return response
            else:
                return "END Invalid selection."
                
        except (ValueError, IndexError, AttributeError):
            return "END Invalid selection."
    
    return handle_parent_dashboard(parent.user, input_list[:1])

def handle_add_child(parent, input_list):
    """Enhanced child addition with validation"""
    steps = len(input_list)
    
    if steps == 2:
        return "CON Add Child\nEnter child's phone number\n(Must be registered adolescent):\n0. Back\n00. Main Menu"
    
    elif steps == 3:
        phone = input_list[2].strip()
        
        # Enhanced phone validation
        if not re.match(r'^\+?[\d\s\-\(\)]{10,15}$', phone):
            return "END Invalid phone format. Use international format."
        
        # Clean phone number
        cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Check if adolescent exists
        child_user = User.query.filter_by(phone_number=cleaned_phone, user_type='adolescent').first()
        if not child_user:
            return "END No adolescent account found with this number."
        
        # Check if already linked
        existing = ParentChild.query.join(Adolescent).filter(
            ParentChild.parent_id == parent.id,
            Adolescent.user_id == child_user.id
        ).first()
        
        if existing:
            return "END This child is already linked to your account."
        
        return ("CON Select your relationship:\n1. Mother\n2. Father\n"
                "3. Guardian\n4. Other Family\n0. Cancel\n00. Main Menu")
    
    elif steps == 4:
        if input_list[3] == '0':
            return handle_parent_dashboard(parent.user, input_list[:1])
        
        relationship_map = {
            '1': 'Mother',
            '2': 'Father', 
            '3': 'Guardian',
            '4': 'Other Family'
        }
        
        relationship = relationship_map.get(input_list[3])
        if not relationship:
            return "END Invalid relationship selection."
        
        # Get child user again
        phone = re.sub(r'[\s\-\(\)]', '', input_list[2])
        child_user = User.query.filter_by(phone_number=phone, user_type='adolescent').first()
        
        if not child_user:
            return "END Child user not found."
        
        try:
            adolescent = Adolescent.query.filter_by(user_id=child_user.id).first()
            
            # Create parent-child relationship
            new_relation = ParentChild(
                parent_id=parent.id,
                adolescent_id=adolescent.id,
                relationship_type=relationship
            )
            db.session.add(new_relation)
            
            # Send notification to adolescent
            notification = Notification(
                user_id=child_user.id,
                message=f"{parent.user.name} has been added as your {relationship}. They can now view your health progress.",
                notification_type='family'
            )
            db.session.add(notification)
            
            # Send confirmation to parent
            parent_notification = Notification(
                user_id=parent.user.id,
                message=f"Successfully linked {child_user.name} as your child.",
                notification_type='family'
            )
            db.session.add(parent_notification)
            
            db.session.commit()
            return f"END ✅ {child_user.name} added successfully as your child!"
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Add child error: {str(e)}")
            return "END Error adding child. Please try again."
    
    return "END Invalid flow."

def handle_remove_child(parent, input_list):
    """Enhanced child removal with confirmation"""
    children = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    if len(input_list) == 2:
        if not children:
            return "END No children to remove."
        
        response = "CON ⚠️ Remove Child:\n"
        for idx, relation in enumerate(children, 1):
            try:
                adolescent = Adolescent.query.get(relation.adolescent_id)
                child_user = User.query.get(adolescent.user_id)
                response += f"{idx}. {child_user.name}\n"
            except AttributeError:
                response += f"{idx}. Unknown child\n"
        
        response += "0. Cancel\n00. Main Menu"
        return response
    
    elif len(input_list) == 3:
        if input_list[2] == '0':
            return handle_parent_dashboard(parent.user, input_list[:1])
        
        try:
            selection = int(input_list[2]) - 1
            if 0 <= selection < len(children):
                relation = children[selection]
                adolescent = Adolescent.query.get(relation.adolescent_id)
                child_user = User.query.get(adolescent.user_id)
                
                return f"CON Confirm removal of {child_user.name}?\n1. Yes, remove\n0. Cancel\n00. Main Menu"
            else:
                return "END Invalid selection."
                
        except (ValueError, IndexError, AttributeError):
            return "END Invalid selection."
    
    elif len(input_list) == 4:
        if input_list[3] == '1':  # Confirm removal
            try:
                selection = int(input_list[2]) - 1
                relation = children[selection]
                adolescent = Adolescent.query.get(relation.adolescent_id)
                child_user = User.query.get(adolescent.user_id)
                
                # Send notification to child
                notification = Notification(
                    user_id=child_user.id,
                    message=f"{parent.user.name} is no longer linked as your {relation.relationship_type}.",
                    notification_type='family'
                )
                db.session.add(notification)
                
                # Remove relationship
                db.session.delete(relation)
                db.session.commit()
                
                return f"END ✅ {child_user.name} removed successfully."
                
            except Exception as e:
                db.session.rollback()
                logger.error(f"Remove child error: {str(e)}")
                return "END Error removing child."
        else:
            return handle_parent_dashboard(parent.user, input_list[:1])
    
    return "END Invalid flow."

def handle_child_health_summary(parent):
    """Provide health summary for all children"""
    try:
        children = ParentChild.query.filter_by(parent_id=parent.id).all()
        
        if not children:
            return "END No children linked to view health summary."
        
        response = "CON 📊 Children's Health Summary:\n"
        
        for relation in children:
            adolescent = Adolescent.query.get(relation.adolescent_id)
            child_user = User.query.get(adolescent.user_id)
            
            # Get recent health data
            recent_cycles = CycleLog.query.filter_by(user_id=child_user.id).filter(
                CycleLog.start_date >= datetime.now() - timedelta(days=90)
            ).count()
            
            recent_meals = MealLog.query.filter_by(user_id=child_user.id).filter(
                MealLog.meal_time >= datetime.now() - timedelta(days=7)
            ).count()
            
            pending_appointments = Appointment.query.filter_by(
                user_id=child_user.id, status='pending'
            ).count()
            
            response += f"\n{child_user.name}:\n"
            response += f"Cycles (3mo): {recent_cycles}\n"
            response += f"Meals (7d): {recent_meals}\n"
            response += f"Pending appointments: {pending_appointments}\n"
        
        response += "\n0. Back"
        return response
        
    except Exception as e:
        logger.error(f"Child health summary error: {str(e)}")
        return "END Error retrieving health summary."

def handle_meal_logging(user, input_list):
    """Enhanced meal logging with session state management"""
    steps = len(input_list)
    
    # Save session state for potential resume
    save_session_state(user, {
        'service': 'meal_logging',
        'inputs': input_list,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'meal_logging')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        return ("CON 🍽️ Meal Logging:\n1. Log New Meal\n2. Today's Meals\n"
                "3. Weekly Summary\n4. Nutrition Tips\n\n0. Back\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            return ("CON Select meal type:\n1. Breakfast\n2. Lunch\n"
                   "3. Dinner\n4. Snack\n\n0. Back\n00. Main Menu")
        
        elif selection == '2':
            return get_todays_meals(user)
        
        elif selection == '3':
            return get_weekly_meal_summary(user)
        
        elif selection == '4':
            return get_nutrition_tips(user)
        
        else:
            return "END Invalid selection. Try again."
    
    elif steps == 3 and input_list[1] == '1':
        meal_types = {'1': 'breakfast', '2': 'lunch', '3': 'dinner', '4': 'snack'}
        if input_list[2] in meal_types:
            return ("CON Describe your meal:\n(e.g., Rice, beans, vegetables)\n\n"
                   "0. Back\n00. Main Menu")
        else:
            return "END Invalid meal type. Try again."
    
    elif steps == 4 and input_list[1] == '1':
        return handle_meal_entry(user, input_list)
    
    return "END Invalid flow. Please start again."

def handle_meal_entry(user, input_list):
    """Handle meal entry with basic nutritional estimation"""
    try:
        meal_types = {'1': 'breakfast', '2': 'lunch', '3': 'dinner', '4': 'snack'}
        meal_type = meal_types[input_list[2]]
        description = input_list[3].strip()
        
        if len(description) < 3:
            return "END Meal description too short."
        
        # Basic calorie estimation (this could be enhanced with a nutrition API)
        estimated_calories = estimate_calories(description, meal_type)
        
        new_meal = MealLog(
            user_id=user.id,
            meal_type=meal_type,
            meal_time=datetime.now(),
            description=description,
            calories=estimated_calories
        )
        
        db.session.add(new_meal)
        
        # Create notification for meal tracking
        notification = Notification(
            user_id=user.id,
            message=f"{meal_type.title()} logged: {description} (~{estimated_calories} cal)",
            notification_type='nutrition'
        )
        db.session.add(notification)
        
        db.session.commit()
        return f"END ✅ {meal_type.title()} logged!\n{description}\nEst. {estimated_calories} calories"
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Meal logging error: {str(e)}")
        return "END Error logging meal."

def estimate_calories(description, meal_type):
    """Basic calorie estimation based on keywords"""
    # Simple keyword-based estimation
    high_cal_foods = ['rice', 'bread', 'pasta', 'oil', 'butter', 'meat', 'chicken', 'fish']
    med_cal_foods = ['beans', 'eggs', 'milk', 'cheese', 'potato']
    low_cal_foods = ['vegetables', 'fruits', 'salad', 'tomato', 'cucumber']
    
    description_lower = description.lower()
    base_calories = {'breakfast': 300, 'lunch': 500, 'dinner': 600, 'snack': 150}
    
    calorie_modifier = 0
    for food in high_cal_foods:
        if food in description_lower:
            calorie_modifier += 100
    for food in med_cal_foods:
        if food in description_lower:
            calorie_modifier += 50
    for food in low_cal_foods:
        if food in description_lower:
            calorie_modifier += 25
    
    return base_calories.get(meal_type, 400) + calorie_modifier

def get_todays_meals(user):
    """Get today's meal summary"""
    today = datetime.now().date()
    meals = MealLog.query.filter_by(user_id=user.id).filter(
        db.func.date(MealLog.meal_time) == today
    ).order_by(MealLog.meal_time).all()
    
    if not meals:
        return "END No meals logged today."
    
    response = "CON 📋 Today's Meals:\n"
    total_calories = 0
    
    for meal in meals:
        time_str = meal.meal_time.strftime('%H:%M')
        calories = meal.calories or 0
        total_calories += calories
        response += f"{meal.meal_type.title()} ({time_str}): {calories}cal\n"
    
    response += f"\nTotal: {total_calories} calories\n0. Back"
    return response

def get_weekly_meal_summary(user):
    """Get weekly meal summary"""
    week_ago = datetime.now() - timedelta(days=7)
    meals = MealLog.query.filter_by(user_id=user.id).filter(
        MealLog.meal_time >= week_ago
    ).all()
    
    if not meals:
        return "END No meals logged this week."
    
    # Calculate daily averages
    total_calories = sum(meal.calories or 0 for meal in meals)
    daily_avg = total_calories / 7
    meal_count = len(meals)
    
    response = f"CON 📊 Weekly Summary:\nMeals logged: {meal_count}\n"
    response += f"Total calories: {total_calories}\n"
    response += f"Daily average: {daily_avg:.0f} cal\n"
    response += "0. Back"
    
    return response

def get_nutrition_tips(user):
    """Provide personalized nutrition tips"""
    tips = [
        "🥗 Include vegetables in every meal",
        "💧 Drink 8-10 glasses of water daily",
        "🥜 Add protein to maintain energy",
        "🍎 Choose whole fruits over juices",
        "🥖 Opt for whole grains when possible",
        "🐟 Include fish twice a week",
        "🥛 Don't skip dairy or alternatives"
    ]
    
    # Get a tip based on recent meal patterns
    recent_meals = MealLog.query.filter_by(user_id=user.id).filter(
        MealLog.meal_time >= datetime.now() - timedelta(days=3)
    ).all()
    
    import random
    tip = random.choice(tips)
    
    response = f"CON 💡 Nutrition Tip:\n{tip}\n\n"
    
    if len(recent_meals) < 6:
        response += "Log more meals for personalized tips!\n"
    
    response += "0. Back"
    return response

def handle_appointments(user, input_list):
    """Enhanced appointment management with backflow navigation"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'appointments')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        return ("CON 📅 Appointments:\n1. Book New Appointment\n2. View Appointments\n"
                "3. Cancel Appointment\n4. Appointment Reminders\n\n0. Back\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            if user.user_type == 'parent':
                return ("CON Book appointment for:\n1. Myself\n2. My Child\n\n"
                       "0. Back\n00. Main Menu")
            else:
                return ("CON Describe your health concern:\n\n"
                       "0. Back\n00. Main Menu")
        
        elif selection == '2':
            return get_user_appointments(user)
        
        elif selection == '3':
            return cancel_appointment_menu(user)
        
        elif selection == '4':
            return get_appointment_reminders(user)
        
        else:
            return "END Invalid selection. Try again."
    
    elif steps == 3:
        if input_list[1] == '1':  # Booking flow
            if user.user_type == 'parent' and input_list[2] in ['1', '2']:
                return ("CON Describe the health concern:\n\n"
                       "0. Back\n00. Main Menu")
            elif user.user_type == 'adolescent':
                return handle_appointment_booking(user, input_list[2], 'self')
        
        elif input_list[1] == '3':  # Cancel flow
            return handle_appointment_cancellation(user, input_list[2])
    
    elif steps == 4 and input_list[1] == '1':
        # Complete booking
        appointment_for = 'self' if input_list[2] == '1' else 'child'
        return handle_appointment_booking(user, input_list[3], appointment_for)
    
    return "END Invalid flow. Please start again."

def handle_appointment_booking(user, issue_description, appointment_for):
    """Handle appointment booking"""
    try:
        if len(issue_description.strip()) < 5:
            return "END Issue description too short. Please be more specific."
        
        # Create appointment with pending status
        new_appointment = Appointment(
            user_id=user.id,
            appointment_for=appointment_for,
            appointment_date=datetime.now() + timedelta(days=1),  # Default to tomorrow
            issue=issue_description.strip(),
            status='pending'
        )
        
        db.session.add(new_appointment)
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            message=f"Appointment request submitted for {appointment_for}. Issue: {issue_description[:50]}...",
            notification_type='appointment'
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return ("END ✅ Appointment requested!\nYou will receive a confirmation "
                "with date and time within 24 hours.")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Appointment booking error: {str(e)}")
        return "END Error booking appointment. Please try again."

def get_user_appointments(user):
    """Get user's appointments"""
    appointments = Appointment.query.filter_by(user_id=user.id).order_by(
        Appointment.appointment_date.desc()
    ).limit(5).all()
    
    if not appointments:
        return "END No appointments found."
    
    response = "CON 📋 Your Appointments:\n"
    for idx, apt in enumerate(appointments, 1):
        status_emoji = {"pending": "⏳", "confirmed": "✅", "cancelled": "❌"}
        emoji = status_emoji.get(apt.status, "❓")
        
        date_str = apt.appointment_date.strftime('%d %b')
        response += f"{idx}. {date_str} - {apt.appointment_for} {emoji}\n"
    
    response += "0. Back"
    return response

def cancel_appointment_menu(user):
    """Show cancellable appointments"""
    appointments = Appointment.query.filter_by(
        user_id=user.id, status='pending'
    ).order_by(Appointment.appointment_date).all()
    
    if not appointments:
        return "END No pending appointments to cancel."
    
    response = "CON Select appointment to cancel:\n"
    for idx, apt in enumerate(appointments, 1):
        date_str = apt.appointment_date.strftime('%d %b')
        response += f"{idx}. {date_str} - {apt.appointment_for}\n"
    
    response += "0. Back"
    return response

def handle_appointment_cancellation(user, selection):
    """Handle appointment cancellation"""
    try:
        apt_index = int(selection) - 1
        appointments = Appointment.query.filter_by(
            user_id=user.id, status='pending'
        ).order_by(Appointment.appointment_date).all()
        
        if 0 <= apt_index < len(appointments):
            appointment = appointments[apt_index]
            appointment.status = 'cancelled'
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                message=f"Appointment for {appointment.appointment_for} on {appointment.appointment_date.strftime('%d %b')} has been cancelled.",
                notification_type='appointment'
            )
            db.session.add(notification)
            
            db.session.commit()
            return "END ✅ Appointment cancelled successfully."
        else:
            return "END Invalid selection."
            
    except (ValueError, IndexError):
        return "END Invalid selection."
    except Exception as e:
        db.session.rollback()
        logger.error(f"Appointment cancellation error: {str(e)}")
        return "END Error cancelling appointment."

def get_appointment_reminders(user):
    """Get upcoming appointment reminders"""
    upcoming = Appointment.query.filter_by(
        user_id=user.id, status='confirmed'
    ).filter(
        Appointment.appointment_date >= datetime.now()
    ).order_by(Appointment.appointment_date).limit(3).all()
    
    if not upcoming:
        return "END No upcoming confirmed appointments."
    
    response = "CON 🔔 Upcoming Appointments:\n"
    for apt in upcoming:
        days_until = (apt.appointment_date - datetime.now()).days
        date_str = apt.appointment_date.strftime('%d %b %Y')
        response += f"• {date_str} ({days_until}d) - {apt.appointment_for}\n"
    
    response += "0. Back"
    return response

def handle_settings(user, input_list):
    """Enhanced settings and profile management"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'settings')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        return ("CON ⚙️ Settings:\n1. Change PIN\n2. Update Profile\n"
                "3. Notification Settings\n4. Data Export\n5. Delete Account\n"
                "0. Back\n00. Main Menu")
    
    elif steps == 2:
        selection = input_list[1]
        
        if selection == '1':
            return "CON Change PIN\nEnter current PIN:\n0. Back\n00. Main Menu"
        elif selection == '2':
            return "CON Update Profile\nEnter new name:\n0. Back\n00. Main Menu"
        elif selection == '3':
            return handle_notification_settings(user)
        elif selection == '4':
            return export_user_data(user)
        elif selection == '5':
            return "CON ⚠️ Delete Account\nThis action cannot be undone!\n1. Confirm\n0. Cancel\n00. Main Menu"
        elif selection == '0':
            return main_menu(user)
        else:
            return "END Invalid selection."
    
    elif steps == 3:
        if input_list[1] == '1':  # Change PIN - verify current
            if bcrypt.check_password_hash(user.password_hash, input_list[2]):
                return "CON Enter new 4-digit PIN:\n0. Back\n00. Main Menu"
            else:
                return "END Incorrect current PIN."
        
        elif input_list[1] == '2':  # Update name
            return handle_name_update(user, input_list[2])
        
        elif input_list[1] == '5' and input_list[2] == '1':  # Confirm deletion
            return handle_account_deletion(user)
    
    elif steps == 4 and input_list[1] == '1':  # Complete PIN change
        return handle_pin_change(user, input_list[3])
    
    return "END Invalid flow."

def handle_pin_change(user, new_pin):
    """Handle PIN change"""
    try:
        if len(new_pin) != 4 or not new_pin.isdigit():
            return "END New PIN must be exactly 4 digits."
        
        user.password_hash = bcrypt.generate_password_hash(new_pin).decode('utf-8')
        user.updated_at = datetime.now()
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            message="Your PIN has been changed successfully.",
            notification_type='security'
        )
        db.session.add(notification)
        
        db.session.commit()
        return "END ✅ PIN changed successfully!"
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"PIN change error: {str(e)}")
        return "END Error changing PIN."

def handle_name_update(user, new_name):
    """Handle name update"""
    try:
        new_name = new_name.strip()
        if len(new_name) < 2:
            return "END Name too short. Minimum 2 characters."
        elif len(new_name) > 50:
            return "END Name too long. Maximum 50 characters."
        
        old_name = user.name
        user.name = new_name
        user.updated_at = datetime.now()
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            message=f"Profile updated: Name changed from {old_name} to {new_name}",
            notification_type='profile'
        )
        db.session.add(notification)
        
        db.session.commit()
        return f"END ✅ Name updated to {new_name}!"
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Name update error: {str(e)}")
        return "END Error updating name."

def handle_notification_settings(user):
    """Handle notification preferences"""
    # This could be expanded to include actual notification preferences
    return ("CON 🔔 Notification Settings:\n"
            "All notifications are currently enabled.\n"
            "Contact support to customize.\n0. Back\n00. Main Menu")

def export_user_data(user):
    """Provide data export summary"""
    try:
        # Count user data
        cycles = CycleLog.query.filter_by(user_id=user.id).count()
        meals = MealLog.query.filter_by(user_id=user.id).count()
        appointments = Appointment.query.filter_by(user_id=user.id).count()
        notifications = Notification.query.filter_by(user_id=user.id).count()
        
        response = f"CON 📊 Your Data Summary:\n"
        response += f"Cycles logged: {cycles}\n"
        response += f"Meals logged: {meals}\n"
        response += f"Appointments: {appointments}\n"
        response += f"Notifications: {notifications}\n"
        response += "Contact support for full export.\n0. Back\n00. Main Menu"
        
        return response
        
    except Exception as e:
        logger.error(f"Data export error: {str(e)}")
        return "END Error retrieving data summary."

def handle_account_deletion(user):
    """Handle account deletion (soft delete by deactivating)"""
    try:
        # Instead of actual deletion, we could mark as inactive
        # For this demo, we'll show a message
        return ("END ⚠️ Account deletion requires manual verification.\n"
                "Please contact support to proceed with account deletion.")
        
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        return "END Error processing deletion request."

# Additional USSD enhancements

def get_emergency_contacts():
    """Return emergency contact information"""
    return """🚨 Emergency Contacts:
• Emergency: 911
• Women's Health Hotline: 1-800-WOMEN
• Sexual Health Info: 1-800-SEX-INFO
• Mental Health Crisis: 988

For serious health concerns, please contact a healthcare provider immediately."""

def handle_health_emergency():
    """Handle health emergency requests"""
    return f"END {get_emergency_contacts()}"

def handle_quick_actions(user, input_list):
    """Handle quick action shortcuts"""
    if len(input_list) < 2:
        return main_menu(user)
    
    action = input_list[1].lower()
    
    # Quick shortcuts
    shortcuts = {
        '911': handle_health_emergency,
        'emergency': handle_health_emergency,
        'help': lambda: get_help_menu(user),
        'status': lambda: get_quick_status(user)
    }
    
    if action in shortcuts:
        return shortcuts[action]()
    
    return main_menu(user)

def get_help_menu(user):
    """Comprehensive help menu"""
    return """CON 🆘 Help & Support:
1. How to use this service
2. Health emergency contacts
3. Technical support
4. Privacy information
5. Terms of service
0. Back to main menu"""

def get_quick_status(user):
    """Quick status overview"""
    try:
        # Get latest cycle info
        latest_cycle = CycleLog.query.filter_by(user_id=user.id).order_by(
            CycleLog.start_date.desc()
        ).first()
        
        # Get recent notifications
        unread_count = Notification.query.filter_by(user_id=user.id, read=False).count()
        
        # Get upcoming appointments
        upcoming_appointments = Appointment.query.filter_by(
            user_id=user.id, status='confirmed'
        ).filter(
            Appointment.appointment_date >= datetime.now()
        ).count()
        
        status = f"CON 📊 Quick Status - {user.name}:\n"
        
        if latest_cycle:
            if not latest_cycle.end_date:
                days_active = (datetime.now() - latest_cycle.start_date).days + 1
                status += f"Period: Day {days_active} (active)\n"
            else:
                days_since = (datetime.now() - latest_cycle.end_date).days
                status += f"Last period: {days_since} days ago\n"
        else:
            status += "No cycle data available\n"
        
        status += f"Unread notifications: {unread_count}\n"
        status += f"Upcoming appointments: {upcoming_appointments}\n"
        status += "0. Back"
        
        return status
        
    except Exception as e:
        logger.error(f"Quick status error: {str(e)}")
        return "END Error retrieving status."

def handle_feedback_submission(user, input_list):
    """Handle user feedback submission"""
    steps = len(input_list)
    
    # Check for backflow navigation
    backflow_result = check_backflow_navigation(user, input_list, steps, 'feedback')
    if backflow_result:
        return backflow_result
    
    if steps == 1:
        return ("CON 💬 Send Feedback:\n1. Report a Bug\n2. Suggest Feature\n"
                "3. General Feedback\n4. Rate Service\n0. Back\n00. Main Menu")
    
    elif steps == 2:
        feedback_types = {
            '1': 'bug',
            '2': 'feature',
            '3': 'general',
            '4': 'rating'
        }
        
        if input_list[1] in feedback_types:
            if input_list[1] == '4':
                return "CON Rate our service (1-5):\n1. Poor\n2. Fair\n3. Good\n4. Very Good\n5. Excellent\n0. Back\n00. Main Menu"
            else:
                return "CON Please describe your feedback\n(Keep it brief for USSD):\n0. Back\n00. Main Menu"
        elif input_list[1] == '0':
            return main_menu(user)
        else:
            return "END Invalid selection."
    
    elif steps == 3:
        try:
            if input_list[1] == '4':  # Rating
                rating = int(input_list[2])
                if 1 <= rating <= 5:
                    feedback_text = f"Service rating: {rating}/5"
                else:
                    return "END Invalid rating. Use 1-5."
            else:
                feedback_text = input_list[2].strip()
                if len(feedback_text) < 5:
                    return "END Feedback too short. Please be more specific."
            
            feedback_types = {'1': 'bug', '2': 'feature', '3': 'general', '4': 'rating'}
            feedback_type = feedback_types[input_list[1]]
            
            # Create feedback record
            feedback = Feedback(
                user_id=user.id,
                feedback_type=feedback_type,
                message=feedback_text,
                status='pending'
            )
            db.session.add(feedback)
            
            # Create notification for user
            notification = Notification(
                user_id=user.id,
                message=f"Thank you for your {feedback_type} feedback. We'll review it soon!",
                notification_type='feedback'
            )
            db.session.add(notification)
            
            db.session.commit()
            return "END ✅ Thank you for your feedback! We appreciate your input."
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Feedback submission error: {str(e)}")
            return "END Error submitting feedback. Please try again."
    
    return "END Invalid feedback flow."

# Enhanced main menu with additional options
def enhanced_main_menu(user):
    """Enhanced main menu with quick actions and better organization"""
    unread_notifications = Notification.query.filter_by(user_id=user.id, read=False).count()
    notification_indicator = f" ({unread_notifications})" if unread_notifications > 0 else ""
    
    menu = f"CON 🌸 The Lady's Essence - {user.name}\n"
    menu += "━━━━━━━━━━━━━━━━━━━━\n"
    menu += "1. 🔄 Cycle Tracking\n"
    menu += "2. 🍽️ Meal Logging\n"
    menu += "3. 📅 Appointments\n"
    menu += "4. 📚 Health Education\n"
    menu += f"5. 🔔 Notifications{notification_indicator}\n"
    
    if user.user_type == 'parent':
        children_count = ParentChild.query.join(Parent).filter(Parent.user_id == user.id).count()
        menu += f"6. 👨‍👩‍👧 Parent Dashboard ({children_count})\n"
    
    menu += "7. ⚙️ Settings\n"
    menu += "8. 💬 Send Feedback\n"
    menu += "9. 🆘 Help\n"
    menu += "0. Exit"
    
    return menu