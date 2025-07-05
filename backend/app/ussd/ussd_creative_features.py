# Creative Features and Enhancements for USSD

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Notification, ContentItem, ContentCategory
from datetime import datetime, timedelta
import json
import random

# Creative and Enhanced Features
class USSDCreativeFeatures:
    
    # ==================== DAILY TIPS & MOTIVATION ====================
    
    @staticmethod
    def get_daily_tip(user):
        """Get personalized daily tip based on user profile"""
        from ussd_models import USSDTip
        
        # Get tips relevant to user type
        target_audience = user.user_type if user.user_type in ['adolescent', 'parent'] else 'all'
        
        tips = USSDTip.query.filter(
            (USSDTip.target_audience == target_audience) | 
            (USSDTip.target_audience == 'all')
        ).filter_by(is_active=True).all()
        
        if not tips:
            # Fallback tips
            fallback_tips = [
                {
                    'title': 'Stay Hydrated! 💧',
                    'content': 'Drink 8-10 glasses of water daily. It helps with cramps and keeps your skin glowing!'
                },
                {
                    'title': 'Track Your Mood 😊',
                    'content': 'Notice how you feel during different cycle phases. This helps predict and manage symptoms.'
                },
                {
                    'title': 'Eat Iron-Rich Foods 🥬',
                    'content': 'Include spinach, beans, and lean meat in your diet to prevent anemia during periods.'
                }
            ]
            tip = random.choice(fallback_tips)
            return f"💡 {tip['title']}\\n\\n{tip['content']}"
        
        # Select random tip
        selected_tip = random.choice(tips)
        return f"💡 {selected_tip.title}\\n\\n{selected_tip.content}"
    
    @staticmethod
    def handle_content_menu(user_input, session, user):
        """Handle health content menu with enhanced features"""
        if user_input == '1':
            # Browse Categories
            return USSDCreativeFeatures.get_content_categories(session)
        elif user_input == '2':
            # Popular Articles
            return USSDCreativeFeatures.get_popular_articles()
        elif user_input == '3':
            # Daily Tip
            tip = USSDCreativeFeatures.get_daily_tip(user)
            return USSDResponseBuilder.build_response(
                f"🌟 Daily Tip for You:\\n\\n{tip}\\n\\n"
                "9. Back to Health Content\\n"
                "0. Exit"
            )
        elif user_input == '9':
            USSDSessionManager.update_session(session, 'main_menu')
            return USSDResponseBuilder.build_response(
                USSDMenuHandlers.get_main_menu(user)
            )
        elif user_input == '0':
            return USSDResponseBuilder.build_response(
                "Thank you for using Lady's Essence! 🌸",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Invalid option. Please try again.\\n\\n" +
                USSDMenuHandlers.get_submenu_response('content_menu', user)
            )
    
    @staticmethod
    def get_content_categories(session):
        """Get available content categories"""
        categories = ContentCategory.query.all()
        
        if not categories:
            return USSDResponseBuilder.build_response(
                "📚 Content categories coming soon!\\n"
                "We're preparing amazing health content for you.\\n\\n"
                "9. Back to Health Content\\n"
                "0. Exit"
            )
        
        USSDSessionManager.update_session(session, 'content_categories')
        
        response = "📚 Health Content Categories:\\n\\n"
        for i, category in enumerate(categories[:6], 1):  # Limit to 6 categories
            response += f"{i}. {category.name}\\n"
        
        response += "\\n9. Back to Health Content\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    @staticmethod
    def get_popular_articles():
        """Get popular health articles"""
        # Get recent articles (simulating popularity)
        articles = ContentItem.query.order_by(ContentItem.created_at.desc()).limit(5).all()
        
        if not articles:
            return USSDResponseBuilder.build_response(
                "📰 Popular articles coming soon!\\n"
                "We're curating the best health content for you.\\n\\n"
                "9. Back to Health Content\\n"
                "0. Exit"
            )
        
        response = "📰 Popular Articles:\\n\\n"
        for i, article in enumerate(articles, 1):
            response += f"{i}. {article.title}\\n"
        
        response += "\\n💡 For full articles, visit our mobile app!\\n"
        response += "\\n9. Back to Health Content\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    # ==================== SMART NOTIFICATIONS ====================
    
    @staticmethod
    def create_smart_notification(user, notification_type, custom_message=None):
        """Create intelligent notifications based on user behavior"""
        
        if notification_type == 'period_reminder':
            # Smart period reminder based on cycle history
            from app.models import CycleLog
            
            last_cycles = CycleLog.query.filter_by(user_id=user.id)\\
                .order_by(CycleLog.start_date.desc()).limit(3).all()
            
            if len(last_cycles) >= 2:
                # Calculate average cycle
                cycle_lengths = [
                    (last_cycles[i-1].start_date.date() - last_cycles[i].start_date.date()).days 
                    for i in range(1, len(last_cycles))
                ]
                avg_cycle = sum(cycle_lengths) / len(cycle_lengths)
                
                # Predict next period
                last_period = last_cycles[0].start_date.date()
                predicted_date = last_period + timedelta(days=int(avg_cycle))
                
                # Create reminder 2 days before
                reminder_date = predicted_date - timedelta(days=2)
                
                if reminder_date >= datetime.now().date():
                    message = f"🩸 Period reminder: Your period is expected in 2 days ({predicted_date.strftime('%d/%m/%Y')}). Prepare your supplies!"
                    
                    notification = Notification(
                        user_id=user.id,
                        message=message,
                        notification_type='cycle'
                    )
                    db.session.add(notification)
                    db.session.commit()
        
        elif notification_type == 'health_tip':
            # Daily health tip notification
            tip = USSDCreativeFeatures.get_daily_tip(user)
            
            notification = Notification(
                user_id=user.id,
                message=f"🌟 Daily Health Tip: {tip}",
                notification_type='education'
            )
            db.session.add(notification)
            db.session.commit()
        
        elif notification_type == 'custom' and custom_message:
            notification = Notification(
                user_id=user.id,
                message=custom_message,
                notification_type='general'
            )
            db.session.add(notification)
            db.session.commit()
    
    # ==================== PARENTAL DASHBOARD ENHANCEMENTS ====================
    
    @staticmethod
    def handle_parent_menu_enhanced(user_input, session, user):
        """Enhanced parental dashboard with more features"""
        if user_input == '1':
            # Manage Children
            return USSDCreativeFeatures.get_parent_children(user, session)
        elif user_input == '2':
            # View Child's Health Summary
            return USSDCreativeFeatures.get_children_for_health_summary(user, session)
        elif user_input == '3':
            # Send Encouragement Message
            return USSDCreativeFeatures.get_children_for_encouragement(user, session)
        elif user_input == '4':
            # Family Health Tips
            return USSDCreativeFeatures.get_family_health_tips()
        elif user_input == '5':
            # Emergency Contacts
            return USSDCreativeFeatures.get_emergency_contacts()
        elif user_input == '9':
            USSDSessionManager.update_session(session, 'main_menu')
            return USSDResponseBuilder.build_response(
                USSDMenuHandlers.get_main_menu(user)
            )
        elif user_input == '0':
            return USSDResponseBuilder.build_response(
                "Thank you for using Lady's Essence! 🌸",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Invalid option. Please try again.\\n\\n" +
                USSDCreativeFeatures.get_enhanced_parent_menu()
            )
    
    @staticmethod
    def get_enhanced_parent_menu():
        """Get enhanced parental dashboard menu"""
        return USSDResponseBuilder.build_menu(
            "👨‍👩‍👧 Enhanced Parental Dashboard:",
            [
                "Manage Children",
                "Child's Health Summary", 
                "Send Encouragement",
                "Family Health Tips",
                "Emergency Contacts"
            ],
            "9. Back to Main Menu\\n0. Exit"
        )
    
    @staticmethod
    def get_parent_children(user, session):
        """Get parent's children with enhanced management"""
        from app.models import Parent, ParentChild, Adolescent
        
        parent = Parent.query.filter_by(user_id=user.id).first()
        if not parent:
            return USSDResponseBuilder.build_response(
                "❌ Parent profile not found!\\n\\n"
                "9. Back to Parental Dashboard\\n"
                "0. Exit"
            )
        
        children = db.session.query(ParentChild, User)\\
            .join(Adolescent, ParentChild.adolescent_id == Adolescent.id)\\
            .join(User, Adolescent.user_id == User.id)\\
            .filter(ParentChild.parent_id == parent.id).all()
        
        if not children:
            USSDSessionManager.update_session(session, 'add_child_phone')
            return USSDResponseBuilder.build_response(
                "👨‍👩‍👧 No children registered yet.\\n\\n"
                "Let's add your first child!\\n"
                "Enter your child's phone number:"
            )
        
        response = "👨‍👩‍👧 Your Children:\\n\\n"
        for i, (parent_child, child_user) in enumerate(children, 1):
            response += f"{i}. {child_user.name}\\n"
            response += f"   📱 {child_user.phone_number}\\n\\n"
        
        response += f"{len(children) + 1}. Add New Child\\n"
        response += "\\n9. Back to Parental Dashboard\\n0. Exit"
        
        USSDSessionManager.update_session(
            session, 
            'manage_children',
            menu_data={'children': [{'id': pc.adolescent_id, 'name': cu.name} for pc, cu in children]}
        )
        
        return USSDResponseBuilder.build_response(response)
    
    @staticmethod
    def get_family_health_tips():
        """Get family-oriented health tips"""
        family_tips = [
            {
                'title': 'Family Meal Planning 🍽️',
                'content': 'Plan nutritious meals together. Include iron-rich foods like spinach and beans for menstrual health.'
            },
            {
                'title': 'Open Communication 💬',
                'content': 'Create a safe space for discussing periods and health. Normalize these conversations at home.'
            },
            {
                'title': 'Emergency Kit 🎒',
                'content': 'Keep a family health kit with pads, pain relievers, and emergency contacts easily accessible.'
            },
            {
                'title': 'Exercise Together 🏃‍♀️',
                'content': 'Light exercise like walking can help reduce menstrual cramps. Make it a family activity!'
            }
        ]
        
        tip = random.choice(family_tips)
        
        return USSDResponseBuilder.build_response(
            f"👨‍👩‍👧 Family Health Tip:\\n\\n"
            f"💡 {tip['title']}\\n\\n"
            f"{tip['content']}\\n\\n"
            "9. Back to Parental Dashboard\\n"
            "0. Exit"
        )
    
    @staticmethod
    def get_emergency_contacts():
        """Get emergency contacts and health resources"""
        return USSDResponseBuilder.build_response(
            "🚨 Emergency Health Contacts:\\n\\n"
            "🏥 Emergency: 911\\n"
            "🩺 Health Hotline: +250-XXX-XXXX\\n"
            "👩‍⚕️ Women's Health Clinic: +250-XXX-XXXX\\n"
            "🤱 Maternal Health: +250-XXX-XXXX\\n\\n"
            "📱 Lady's Essence Support:\\n"
            "   +250-XXX-XXXX\\n"
            "   support@ladysessence.com\\n\\n"
            "💡 Save these numbers in your phone!\\n\\n"
            "9. Back to Parental Dashboard\\n"
            "0. Exit"
        )
    
    # ==================== GAMIFICATION FEATURES ====================
    
    @staticmethod
    def get_user_achievements(user):
        """Get user achievements and progress"""
        from app.models import CycleLog, MealLog, Appointment
        
        # Calculate achievements
        cycle_logs_count = CycleLog.query.filter_by(user_id=user.id).count()
        meal_logs_count = MealLog.query.filter_by(user_id=user.id).count()
        appointments_count = Appointment.query.filter_by(user_id=user.id).count()
        
        achievements = []
        
        # Cycle tracking achievements
        if cycle_logs_count >= 1:
            achievements.append("🩸 First Period Logged!")
        if cycle_logs_count >= 5:
            achievements.append("📊 Cycle Tracker!")
        if cycle_logs_count >= 12:
            achievements.append("🏆 Year of Tracking!")
        
        # Meal logging achievements
        if meal_logs_count >= 1:
            achievements.append("🍽️ Nutrition Starter!")
        if meal_logs_count >= 20:
            achievements.append("🥗 Healthy Eater!")
        if meal_logs_count >= 50:
            achievements.append("🌟 Nutrition Expert!")
        
        # Appointment achievements
        if appointments_count >= 1:
            achievements.append("📅 Health Conscious!")
        
        # Consistency achievements
        recent_logs = CycleLog.query.filter_by(user_id=user.id)\\
            .filter(CycleLog.created_at >= datetime.now() - timedelta(days=30)).count()
        
        if recent_logs >= 2:
            achievements.append("⭐ Consistent Tracker!")
        
        if not achievements:
            achievements.append("🌱 Health Journey Beginner!")
        
        return achievements
    
    @staticmethod
    def handle_help_menu_enhanced(user_input, session, user):
        """Enhanced help menu with more options"""
        if user_input == '1':
            # Contact Support
            return USSDResponseBuilder.build_response(
                "📞 Contact Our Support Team:\\n\\n"
                "🌟 We're here to help you!\\n\\n"
                "📱 WhatsApp: +250-XXX-XXXX\\n"
                "📧 Email: support@ladysessence.com\\n"
                "🕒 Hours: 8AM - 6PM (Mon-Fri)\\n"
                "🌍 Website: www.ladysessence.com\\n\\n"
                "💬 Common topics:\\n"
                "• Account issues\\n"
                "• Health questions\\n"
                "• Technical support\\n\\n"
                "9. Back to Help Menu\\n"
                "0. Exit"
            )
        elif user_input == '2':
            # Send Feedback
            USSDSessionManager.update_session(session, 'feedback_type')
            return USSDResponseBuilder.build_response(
                "💝 We value your feedback!\\n\\n"
                "What type of feedback?\\n\\n"
                "1. 🌟 Compliment\\n"
                "2. 💡 Suggestion\\n"
                "3. 🐛 Report Issue\\n"
                "4. ❓ General Feedback\\n\\n"
                "Select feedback type:"
            )
        elif user_input == '3':
            # Rate Our Service
            USSDSessionManager.update_session(session, 'service_rating')
            return USSDResponseBuilder.build_response(
                "⭐ Rate Lady's Essence USSD Service:\\n\\n"
                "How satisfied are you?\\n\\n"
                "5. ⭐⭐⭐⭐⭐ Excellent\\n"
                "4. ⭐⭐⭐⭐ Good\\n"
                "3. ⭐⭐⭐ Average\\n"
                "2. ⭐⭐ Poor\\n"
                "1. ⭐ Very Poor\\n\\n"
                "Select your rating:"
            )
        elif user_input == '4':
            # View Achievements
            achievements = USSDCreativeFeatures.get_user_achievements(user)
            achievement_text = "\\n".join([f"• {achievement}" for achievement in achievements])
            
            return USSDResponseBuilder.build_response(
                f"🏆 Your Achievements:\\n\\n"
                f"{achievement_text}\\n\\n"
                "Keep using Lady's Essence to unlock more achievements!\\n\\n"
                "9. Back to Help Menu\\n"
                "0. Exit"
            )
        elif user_input == '9':
            USSDSessionManager.update_session(session, 'main_menu')
            return USSDResponseBuilder.build_response(
                USSDMenuHandlers.get_main_menu(user)
            )
        elif user_input == '0':
            return USSDResponseBuilder.build_response(
                "Thank you for using Lady's Essence! 🌸",
                continue_session=False
            )
        else:
            return USSDResponseBuilder.build_response(
                "Invalid option. Please try again.\\n\\n" +
                USSDCreativeFeatures.get_enhanced_help_menu()
            )
    
    @staticmethod
    def get_enhanced_help_menu():
        """Get enhanced help menu"""
        return USSDResponseBuilder.build_menu(
            "❓ Help & Support:",
            [
                "Contact Support",
                "Send Feedback",
                "Rate Our Service",
                "View Achievements"
            ],
            "9. Back to Main Menu\\n0. Exit"
        )
    
    # ==================== QUICK ACTIONS ====================
    
    @staticmethod
    def handle_quick_actions(user_input, session, user):
        """Handle quick action shortcuts"""
        quick_actions = {
            '*1': 'quick_log_period',
            '*2': 'quick_log_meal',
            '*3': 'quick_view_stats',
            '*4': 'quick_next_period'
        }
        
        if user_input in quick_actions:
            action = quick_actions[user_input]
            
            if action == 'quick_log_period':
                USSDSessionManager.update_session(session, 'cycle_log_start_date')
                return USSDResponseBuilder.build_response(
                    "🩸 Quick Period Log\\n\\n"
                    "Enter start date (DD/MM/YYYY):"
                )
            elif action == 'quick_log_meal':
                USSDSessionManager.update_session(session, 'meal_log_type')
                return USSDResponseBuilder.build_response(
                    "🍽️ Quick Meal Log\\n\\n"
                    "1. Breakfast\\n2. Lunch\\n3. Dinner\\n4. Snack"
                )
            elif action == 'quick_view_stats':
                return USSDCoreHandlers.get_cycle_stats(user)
            elif action == 'quick_next_period':
                return USSDCoreHandlers.predict_next_period(user)
        
        return None  # Not a quick action
    
    # ==================== PERSONALIZATION ====================
    
    @staticmethod
    def get_personalized_greeting(user):
        """Get personalized greeting based on user data and time"""
        current_hour = datetime.now().hour
        
        # Time-based greeting
        if 5 <= current_hour < 12:
            time_greeting = "Good morning"
        elif 12 <= current_hour < 17:
            time_greeting = "Good afternoon"
        elif 17 <= current_hour < 21:
            time_greeting = "Good evening"
        else:
            time_greeting = "Hello"
        
        # Personalized message based on recent activity
        from app.models import CycleLog, MealLog
        
        recent_cycle = CycleLog.query.filter_by(user_id=user.id)\\
            .order_by(CycleLog.created_at.desc()).first()
        
        recent_meal = MealLog.query.filter_by(user_id=user.id)\\
            .filter(MealLog.meal_time >= datetime.now() - timedelta(days=1)).first()
        
        personal_msg = ""
        
        if recent_cycle:
            days_since = (datetime.now().date() - recent_cycle.start_date.date()).days
            if days_since <= 7:
                personal_msg = "\\n💪 Hope you're feeling well during your cycle!"
            elif days_since >= 25:
                personal_msg = "\\n🔮 Your next period might be coming soon!"
        
        if not recent_meal and current_hour >= 8:
            personal_msg += "\\n🍽️ Don't forget to log your meals today!"
        
        return f"{time_greeting}, {user.name}! 🌸{personal_msg}"

# Enhanced notification system
class USSDNotificationEnhancer:
    
    @staticmethod
    def get_smart_notifications(user):
        """Get smart, contextual notifications"""
        notifications = []
        
        # Check for overdue period logging
        from app.models import CycleLog
        last_log = CycleLog.query.filter_by(user_id=user.id)\\
            .order_by(CycleLog.start_date.desc()).first()
        
        if last_log:
            days_since = (datetime.now().date() - last_log.start_date.date()).days
            if days_since > 35:  # Likely missed a period
                notifications.append({
                    'type': 'reminder',
                    'message': '🩸 It\'s been a while since your last period log. Don\'t forget to track!'
                })
        
        # Check for meal logging streak
        from app.models import MealLog
        today_meals = MealLog.query.filter_by(user_id=user.id)\\
            .filter(db.func.date(MealLog.meal_time) == datetime.now().date()).count()
        
        if today_meals == 0 and datetime.now().hour >= 12:
            notifications.append({
                'type': 'reminder',
                'message': '🍽️ Remember to log your meals for better nutrition tracking!'
            })
        
        return notifications

