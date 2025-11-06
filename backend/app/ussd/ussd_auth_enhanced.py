# Enhanced Authentication and Registration Flow for USSD

from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models import User, Parent, Adolescent
from datetime import datetime, timedelta
import json
import re
import random
import string

# Enhanced USSD Authentication Handlers
class USSDAuthHandlers:
    
    @staticmethod
    def handle_initial_contact(phone_number, session):
        """Handle initial USSD contact with enhanced welcome"""
        user = User.query.filter_by(phone_number=phone_number).first()
        
        if user:
            # Existing user - personalized welcome
            USSDSessionManager.update_session(session, 'login_password')
            
            # Get time-based greeting
            current_hour = datetime.now().hour
            if 5 <= current_hour < 12:
                greeting = "Good morning"
            elif 12 <= current_hour < 17:
                greeting = "Good afternoon"
            elif 17 <= current_hour < 21:
                greeting = "Good evening"
            else:
                greeting = "Hello"
            
            return USSDResponseBuilder.build_response(
                f"🌸 {greeting}, {user.name}! 🌸\\n"
                f"Welcome back to Lady's Essence\\n"
                f"Empowering women, enhancing lives.\\n\\n"
                f"Please enter your password to continue:"
            )
        else:
            # New user - attractive registration invitation
            USSDSessionManager.update_session(session, 'registration_welcome')
            
            return USSDResponseBuilder.build_response(
                "🌸✨ Welcome to Lady's Essence! ✨🌸\\n"
                "Your journey to better health starts here!\\n\\n"
                "🌟 Track your cycle\\n"
                "🍎 Log your meals\\n"
                "📅 Book appointments\\n"
                "📚 Learn & grow\\n\\n"
                "Ready to join our community?\\n"
                "1. Yes, let's start!\\n"
                "2. Learn more first\\n"
                "0. Exit"
            )
    
    @staticmethod
    def handle_registration_welcome(phone_number, user_input, session):
        """Handle registration welcome response"""
        if user_input == '1':
            USSDSessionManager.update_session(session, 'registration_type')
            return USSDResponseBuilder.build_response(
                "🎯 Great choice! Let's personalize your experience.\\n\\n"
                "Are you a parent or an adolescent?\\n\\n"
                "👩‍👧 1. Parent\\n"
                "   (Managing family health)\\n\\n"
                "🌸 2. Adolescent\\n"
                "   (Personal health journey)\\n\\n"
                "Choose your role:"
            )
        elif user_input == '2':
            USSDSessionManager.update_session(session, 'learn_more')
            return USSDResponseBuilder.build_response(
                "📚 Lady's Essence offers:\\n\\n"
                "🩸 Menstrual cycle tracking\\n"
                "🤱 Pregnancy guidance\\n"
                "🍽️ Nutrition logging\\n"
                "📱 SMS reminders\\n"
                "👨‍👩‍👧 Family dashboards\\n"
                "🌍 Works on any phone!\\n\\n"
                "1. Join now\\n"
                "2. Contact support\\n"
                "0. Exit"
            )
        elif user_input == '0':
            return USSDResponseBuilder.build_response(
                "Thank you for considering Lady's Essence! 🌸\\n"
                "We're here when you're ready.\\n"
                "Dial our code anytime to join!",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Please select a valid option:\\n"
                "1. Yes, let's start!\\n"
                "2. Learn more first\\n"
                "0. Exit"
            )
    
    @staticmethod
    def handle_learn_more(phone_number, user_input, session):
        """Handle learn more menu"""
        if user_input == '1':
            USSDSessionManager.update_session(session, 'registration_type')
            return USSDResponseBuilder.build_response(
                "🎯 Wonderful! Let's get you started.\\n\\n"
                "Are you a parent or an adolescent?\\n\\n"
                "👩‍👧 1. Parent\\n"
                "   (Managing family health)\\n\\n"
                "🌸 2. Adolescent\\n"
                "   (Personal health journey)\\n\\n"
                "Choose your role:"
            )
        elif user_input == '2':
            return USSDResponseBuilder.build_response(
                "📞 Contact our support team:\\n\\n"
                "📱 WhatsApp: +250-XXX-XXXX\\n"
                "📧 Email: support@ladysessence.com\\n"
                "🕒 Available: 8AM - 6PM\\n\\n"
                "We're here to help! 💝",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Please select a valid option:\\n"
                "1. Join now\\n"
                "2. Contact support\\n"
                "0. Exit"
            )
    
    @staticmethod
    def handle_registration_type_enhanced(phone_number, user_input, session):
        """Enhanced user type selection with detailed explanations"""
        if user_input == '1':
            # Parent registration
            USSDSessionManager.update_session(
                session, 
                'registration_name', 
                menu_data={'user_type': 'parent'}
            )
            
            return USSDResponseBuilder.build_response(
                "👩‍👧 Perfect! As a parent, you'll get:\\n\\n"
                "✅ Monitor your children's health\\n"
                "✅ Receive important reminders\\n"
                "✅ Access educational content\\n"
                "✅ Book family appointments\\n\\n"
                "Let's start with your name:\\n"
                "Please enter your full name:"
            )
        elif user_input == '2':
            # Adolescent registration
            USSDSessionManager.update_session(
                session, 
                'registration_name', 
                menu_data={'user_type': 'adolescent'}
            )
            
            return USSDResponseBuilder.build_response(
                "🌸 Excellent! As an adolescent, you'll get:\\n\\n"
                "✅ Track your menstrual cycle\\n"
                "✅ Log meals & nutrition\\n"
                "✅ Get health tips & education\\n"
                "✅ Private & secure tracking\\n\\n"
                "Let's start with your name:\\n"
                "Please enter your full name:"
            )
        else:
            return USSDResponseBuilder.build_response(
                "Please select a valid option:\\n\\n"
                "👩‍👧 1. Parent\\n"
                "🌸 2. Adolescent"
            )
    
    @staticmethod
    def handle_registration_name_enhanced(phone_number, user_input, session):
        """Enhanced name validation with helpful feedback"""
        name = user_input.strip()
        
        # Validate name
        if len(name) < 2:
            return USSDResponseBuilder.build_response(
                "❌ Name too short!\\n"
                "Please enter at least 2 characters.\\n\\n"
                "Example: 'Mary Jane' or 'John'\\n\\n"
                "Enter your full name:"
            )
        
        if len(name) > 50:
            return USSDResponseBuilder.build_response(
                "❌ Name too long!\\n"
                "Please keep it under 50 characters.\\n\\n"
                "Enter your full name:"
            )
        
        # Check for valid characters (letters, spaces, common punctuation)
        if not re.match(r"^[a-zA-Z\\s\\-\\'\\.\\.]+$", name):
            return USSDResponseBuilder.build_response(
                "❌ Invalid characters in name!\\n"
                "Please use only letters, spaces, and hyphens.\\n\\n"
                "Enter your full name:"
            )
        
        # Name is valid
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        menu_data['name'] = name
        
        USSDSessionManager.update_session(
            session, 
            'registration_password', 
            menu_data=menu_data
        )
        
        return USSDResponseBuilder.build_response(
            f"✅ Nice to meet you, {name}!\\n\\n"
            "🔐 Now, let's secure your account.\\n"
            "Create a password (4-8 digits recommended):\\n\\n"
            "💡 Tips:\\n"
            "• Use 4-8 digits\\n"
            "• Easy to remember\\n"
            "• Keep it private\\n\\n"
            "Enter your password:"
        )
    
    @staticmethod
    def handle_registration_password_enhanced(phone_number, user_input, session):
        """Enhanced password validation with security tips"""
        password = user_input.strip()
        
        # Validate password
        if len(password) < 4:
            return USSDResponseBuilder.build_response(
                "❌ Password too short!\\n"
                "Please use at least 4 characters.\\n\\n"
                "💡 Tip: Use 4-8 digits for easy typing\\n"
                "Example: 1234, 2580, 1357\\n\\n"
                "Enter your password:"
            )
        
        if len(password) > 20:
            return USSDResponseBuilder.build_response(
                "❌ Password too long!\\n"
                "Please keep it under 20 characters.\\n\\n"
                "Enter your password:"
            )
        
        # Check for common weak passwords
        weak_passwords = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1122', '1212']
        if password in weak_passwords:
            return USSDResponseBuilder.build_response(
                "⚠️ This password is too common!\\n"
                "Please choose a more secure one.\\n\\n"
                "💡 Try: birth year, lucky number, or mix of digits\\n\\n"
                "Enter your password:"
            )
        
        # Password is valid - move to PIN setup
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        menu_data['password'] = password
        
        USSDSessionManager.update_session(
            session, 
            'registration_pin_option', 
            menu_data=menu_data
        )
        
        return USSDResponseBuilder.build_response(
            "🔐 Great! Your password is set.\\n\\n"
            "🌟 PIN Authentication (Optional)\\n"
            "Set a 4-digit PIN for faster login\\n"
            "Useful for quick USSD access!\\n\\n"
            "Would you like to set a PIN?\\n\\n"
            "1. Yes, set a PIN\\n"
            "2. Skip for now"
        )
    
    @staticmethod
    def handle_registration_pin_option(phone_number, user_input, session):
        """Handle PIN setup option during registration"""
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        
        if user_input == '1':
            # User wants to set PIN
            USSDSessionManager.update_session(
                session, 
                'registration_pin', 
                menu_data=menu_data
            )
            
            return USSDResponseBuilder.build_response(
                "🔐 Perfect! Let's set your PIN.\\n\\n"
                "Enter a 4-digit PIN\\n"
                "(Only numbers 0-9)\\n\\n"
                "💡 Example: 2580, 1357, 9876\\n\\n"
                "Enter your 4-digit PIN:"
            )
        elif user_input == '2':
            # Skip PIN - proceed to user creation
            return USSDAuthHandlers._create_user_account(phone_number, session, menu_data, pin=None)
        else:
            return USSDResponseBuilder.build_response(
                "Please select a valid option:\\n\\n"
                "1. Yes, set a PIN\\n"
                "2. Skip for now"
            )
    
    @staticmethod
    def handle_registration_pin(phone_number, user_input, session):
        """Enhanced PIN validation during registration"""
        pin = user_input.strip()
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        
        # Validate PIN format
        if len(pin) != 4 or not pin.isdigit():
            return USSDResponseBuilder.build_response(
                "❌ Invalid PIN format!\\n"
                "PIN must be exactly 4 digits.\\n\\n"
                "💡 Examples: 2580, 1357, 9876\\n\\n"
                "Enter your 4-digit PIN:"
            )
        
        # Check for weak PINs
        weak_pins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '1122', '2211']
        if pin in weak_pins:
            return USSDResponseBuilder.build_response(
                "⚠️ This PIN is too simple!\\n"
                "Please choose a stronger PIN.\\n\\n"
                "💡 Avoid: 0000, 1111, 1234, etc.\\n\\n"
                "Enter a different 4-digit PIN:"
            )
        
        # PIN is valid - confirm PIN
        menu_data['pin'] = pin
        
        USSDSessionManager.update_session(
            session, 
            'registration_confirm_pin', 
            menu_data=menu_data
        )
        
        return USSDResponseBuilder.build_response(
            "✅ PIN entered: ****\\n\\n"
            "Please confirm your PIN:\\n"
            "Enter it again to verify:\\n\\n"
            "Enter your 4-digit PIN:"
        )
    
    @staticmethod
    def handle_registration_confirm_pin(phone_number, user_input, session):
        """Confirm PIN entry during registration"""
        confirm_pin = user_input.strip()
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        original_pin = menu_data.get('pin', '')
        
        if confirm_pin == original_pin:
            # PINs match - create user with PIN
            return USSDAuthHandlers._create_user_account(phone_number, session, menu_data, pin=confirm_pin)
        else:
            # PINs don't match
            return USSDResponseBuilder.build_response(
                "❌ PINs don't match!\\n\\n"
                "Please try again.\\n\\n"
                "1. Enter PIN again\\n"
                "2. Skip PIN setup\\n"
                "0. Cancel"
            )
    
    @staticmethod
    def _create_user_account(phone_number, session, menu_data, pin=None):
        """Create user account with or without PIN"""
        try:
            # Create password hash
            password = menu_data.get('password', '')
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            
            # Create PIN hash if provided
            pin_hash = None
            enable_pin_auth = False
            if pin:
                pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
                enable_pin_auth = True
            
            # Create new user
            new_user = User(
                name=menu_data['name'],
                phone_number=phone_number,
                password_hash=password_hash,
                user_type=menu_data['user_type'],
                pin_hash=pin_hash,
                enable_pin_auth=enable_pin_auth
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # Create parent or adolescent record
            if menu_data['user_type'] == 'parent':
                parent = Parent(user_id=new_user.id)
                db.session.add(parent)
            else:
                adolescent = Adolescent(user_id=new_user.id)
                db.session.add(adolescent)
            
            db.session.commit()
            
            # Create welcome notification
            from app.models import Notification
            welcome_notification = Notification(
                user_id=new_user.id,
                message=f"Welcome to Lady's Essence, {menu_data['name']}! Start by exploring our features.",
                notification_type='welcome'
            )
            db.session.add(welcome_notification)
            db.session.commit()
            
            # Update session with user
            USSDSessionManager.update_session(
                session, 
                'main_menu', 
                user_id=new_user.id
            )
            
            # Generate personalized welcome message
            user_type_msg = "parent dashboard" if menu_data['user_type'] == 'parent' else "cycle tracking"
            pin_msg = "\\n✅ PIN enabled - fast login!" if enable_pin_auth else ""
            
            return USSDResponseBuilder.build_response(
                f"🎉 Welcome to Lady's Essence, {menu_data['name']}!\\n\\n"
                f"✅ Account created successfully\\n"
                f"🔐 Password secured\\n"
                f"📱 Phone {phone_number} registered{pin_msg}\\n\\n"
                f"🌟 Ready to explore {user_type_msg}?\\n\\n" +
                USSDMenuHandlers.get_main_menu(new_user)
            )
            
        except Exception as e:
            db.session.rollback()
            return USSDResponseBuilder.build_response(
                "❌ Registration failed!\\n"
                "Please try again or contact support.\\n\\n"
                "1. Try again\\n"
                "2. Contact support\\n"
                "0. Exit"
            )
    
    @staticmethod
    def handle_login_enhanced(phone_number, user_input, session):
        """Enhanced login with better error handling and security"""
        user = User.query.filter_by(phone_number=phone_number).first()
        password = user_input.strip()
        
        if user and bcrypt.check_password_hash(user.password_hash, password):
            # Successful login
            USSDSessionManager.update_session(
                session, 
                'main_menu', 
                user_id=user.id
            )
            
            # Get personalized greeting
            current_hour = datetime.now().hour
            if 5 <= current_hour < 12:
                greeting = "Good morning"
            elif 12 <= current_hour < 17:
                greeting = "Good afternoon"
            elif 17 <= current_hour < 21:
                greeting = "Good evening"
            else:
                greeting = "Welcome back"
            
            # Check for pending notifications
            from app.models import Notification
            unread_count = Notification.query.filter_by(
                user_id=user.id, 
                read=False
            ).count()
            
            notification_msg = f"\\n🔔 You have {unread_count} new notifications!" if unread_count > 0 else ""
            
            return USSDResponseBuilder.build_response(
                f"✅ {greeting}, {user.name}!\\n"
                f"Login successful.{notification_msg}\\n\\n" +
                USSDMenuHandlers.get_main_menu(user)
            )
        else:
            # Failed login - track attempts
            menu_data = json.loads(session.menu_data) if session.menu_data else {}
            attempts = menu_data.get('login_attempts', 0) + 1
            menu_data['login_attempts'] = attempts
            
            USSDSessionManager.update_session(
                session, 
                'login_failed', 
                menu_data=menu_data
            )
            
            if attempts >= 3:
                # Too many failed attempts
                return USSDResponseBuilder.build_response(
                    "🔒 Too many failed attempts!\\n"
                    "For security, please try again later.\\n\\n"
                    "Need help?\\n"
                    "📞 Contact: +250-XXX-XXXX\\n"
                    "📧 Email: support@ladysessence.com",
                    continue_session=False
                )
            else:
                return USSDResponseBuilder.build_response(
                    f"❌ Incorrect password! ({attempts}/3 attempts)\\n\\n"
                    "💡 Tips:\\n"
                    "• Check your password carefully\\n"
                    "• Remember it's case-sensitive\\n\\n"
                    "1. Try again\\n"
                    "2. Forgot password?\\n"
                    "0. Exit"
                )
    
    @staticmethod
    def handle_login_failed(phone_number, user_input, session):
        """Handle failed login options"""
        if user_input == '1':
            # Try again
            USSDSessionManager.update_session(session, 'login_password')
            return USSDResponseBuilder.build_response(
                "🔐 Please enter your password:"
            )
        elif user_input == '2':
            # Forgot password
            return USSDResponseBuilder.build_response(
                "🔑 Password Reset Help:\\n\\n"
                "For security, password reset requires verification.\\n\\n"
                "📞 Call: +250-XXX-XXXX\\n"
                "📧 Email: support@ladysessence.com\\n"
                "🕒 Hours: 8AM - 6PM\\n\\n"
                "Our team will help you securely reset your password.\\n\\n"
                "Thank you for using Lady's Essence! 🌸",
                continue_session=False
            )
        elif user_input == '0':
            return USSDResponseBuilder.build_response(
                "Thank you for using Lady's Essence! 🌸",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Please select a valid option:\\n"
                "1. Try again\\n"
                "2. Forgot password?\\n"
                "0. Exit"
            )
    
    @staticmethod
    def validate_phone_number(phone_number):
        """Validate phone number format"""
        # Remove any non-digit characters
        clean_number = re.sub(r'\\D', '', phone_number)
        
        # Check if it's a valid length (assuming 10-15 digits)
        if len(clean_number) < 10 or len(clean_number) > 15:
            return False
        
        # Add more specific validation based on country codes if needed
        return True
    
    @staticmethod
    def generate_verification_code():
        """Generate a 4-digit verification code"""
        return ''.join(random.choices(string.digits, k=4))

# Enhanced Session Manager with better security
class EnhancedUSSDSessionManager(USSDSessionManager):
    
    @staticmethod
    def create_secure_session(phone_number, user_agent=None):
        """Create a secure USSD session with additional validation"""
        # Validate phone number
        if not USSDAuthHandlers.validate_phone_number(phone_number):
            raise ValueError("Invalid phone number format")
        
        # Check for existing active sessions
        existing_sessions = USSDSession.query.filter_by(
            phone_number=phone_number
        ).filter(
            USSDSession.expires_at > datetime.utcnow()
        ).all()
        
        # Clean up old sessions
        for old_session in existing_sessions:
            db.session.delete(old_session)
        
        db.session.commit()
        
        # Create new session
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=15)  # 15-minute session
        
        session = USSDSession(
            session_id=session_id,
            phone_number=phone_number,
            current_menu='welcome',
            expires_at=expires_at
        )
        
        db.session.add(session)
        db.session.commit()
        
        return session
    
    @staticmethod
    def extend_session(session, minutes=10):
        """Extend session expiration time"""
        session.expires_at = datetime.utcnow() + timedelta(minutes=minutes)
        session.updated_at = datetime.utcnow()
        db.session.commit()
    
    @staticmethod
    def is_session_valid(session):
        """Check if session is still valid"""
        if not session:
            return False
        
        if session.expires_at <= datetime.utcnow():
            # Session expired
            db.session.delete(session)
            db.session.commit()
            return False
        
        return True

# Security utilities
class USSDSecurityUtils:
    
    @staticmethod
    def sanitize_input(user_input):
        """Sanitize user input to prevent injection attacks"""
        if not user_input:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>\"\'\\\\]', '', str(user_input))
        
        # Limit length
        sanitized = sanitized[:255]
        
        return sanitized.strip()
    
    @staticmethod
    def is_rate_limited(phone_number, action='general', limit=10, window_minutes=60):
        """Check if user is rate limited for specific actions"""
        from ussd_models import USSDTransaction
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        
        recent_transactions = USSDTransaction.query.filter(
            USSDTransaction.phone_number == phone_number,
            USSDTransaction.created_at >= cutoff_time,
            USSDTransaction.transaction_type == action
        ).count()
        
        return recent_transactions >= limit
    
    @staticmethod
    def log_security_event(phone_number, event_type, details=None):
        """Log security-related events"""
        from ussd_models import USSDTransaction
        
        try:
            security_log = USSDTransaction(
                session_id='security',
                phone_number=phone_number,
                request_text=details,
                response_text=f"Security event: {event_type}",
                menu_state='security',
                transaction_type='security_event',
                success=True
            )
            
            db.session.add(security_log)
            db.session.commit()
        except Exception:
            # Don't let logging errors break the main flow
            pass

