# Core USSD Functionalities Implementation

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, CycleLog, MealLog, Appointment, Notification, ContentItem, ContentCategory, Parent, Adolescent, ParentChild
from datetime import datetime, timedelta
import json
import re

# Core functionality handlers
class USSDCoreHandlers:
    
    # ==================== CYCLE TRACKING ====================
    
    @staticmethod
    def handle_cycle_menu(user_input, session, user):
        """Handle cycle tracking menu navigation"""
        if user_input == '1':
            # Log New Period
            USSDSessionManager.update_session(session, 'cycle_log_start_date')
            return USSDResponseBuilder.build_response(
                "🩸 Log New Period\\n\\n"
                "When did your period start?\\n"
                "Enter date (DD/MM/YYYY):\\n\\n"
                "💡 Examples:\\n"
                "• 15/12/2024\\n"
                "• 01/01/2025\\n\\n"
                "Enter start date:"
            )
        elif user_input == '2':
            # View Last Period
            return USSDCoreHandlers.get_last_period(user)
        elif user_input == '3':
            # View Cycle Stats
            return USSDCoreHandlers.get_cycle_stats(user)
        elif user_input == '4':
            # Predict Next Period
            return USSDCoreHandlers.predict_next_period(user)
        elif user_input == '9':
            # Back to main menu
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
                USSDMenuHandlers.get_submenu_response('cycle_menu', user)
            )
    
    @staticmethod
    def handle_cycle_log_start_date(user_input, session, user):
        """Handle period start date input"""
        try:
            # Parse date input
            date_str = user_input.strip()
            start_date = USSDCoreHandlers.parse_date(date_str)
            
            if not start_date:
                return USSDResponseBuilder.build_response(
                    "❌ Invalid date format!\\n\\n"
                    "Please use DD/MM/YYYY format:\\n"
                    "Example: 15/12/2024\\n\\n"
                    "Enter start date:"
                )
            
            # Check if date is reasonable (not too far in future/past)
            today = datetime.now().date()
            if start_date > today:
                return USSDResponseBuilder.build_response(
                    "❌ Future date not allowed!\\n"
                    "Please enter a past or today's date.\\n\\n"
                    "Enter start date:"
                )
            
            if start_date < today - timedelta(days=365):
                return USSDResponseBuilder.build_response(
                    "❌ Date too far in the past!\\n"
                    "Please enter a date within the last year.\\n\\n"
                    "Enter start date:"
                )
            
            # Store start date and ask for end date
            menu_data = {'start_date': start_date.isoformat()}
            USSDSessionManager.update_session(
                session, 
                'cycle_log_end_date', 
                menu_data=menu_data
            )
            
            return USSDResponseBuilder.build_response(
                f"✅ Start date: {start_date.strftime('%d/%m/%Y')}\\n\\n"
                "When did your period end?\\n"
                "Enter date (DD/MM/YYYY) or type 'ongoing' if still active:\\n\\n"
                "Enter end date or 'ongoing':"
            )
            
        except Exception as e:
            return USSDResponseBuilder.build_response(
                "❌ Error processing date!\\n"
                "Please try again with DD/MM/YYYY format.\\n\\n"
                "Enter start date:"
            )
    
    @staticmethod
    def handle_cycle_log_end_date(user_input, session, user):
        """Handle period end date input"""
        try:
            menu_data = json.loads(session.menu_data) if session.menu_data else {}
            start_date = datetime.fromisoformat(menu_data['start_date']).date()
            
            end_date = None
            if user_input.strip().lower() != 'ongoing':
                end_date = USSDCoreHandlers.parse_date(user_input.strip())
                
                if not end_date:
                    return USSDResponseBuilder.build_response(
                        "❌ Invalid date format!\\n\\n"
                        "Please use DD/MM/YYYY format or type 'ongoing':\\n"
                        "Example: 20/12/2024\\n\\n"
                        "Enter end date or 'ongoing':"
                    )
                
                if end_date < start_date:
                    return USSDResponseBuilder.build_response(
                        "❌ End date cannot be before start date!\\n\\n"
                        "Enter end date or 'ongoing':"
                    )
                
                if end_date > datetime.now().date():
                    return USSDResponseBuilder.build_response(
                        "❌ Future date not allowed!\\n\\n"
                        "Enter end date or 'ongoing':"
                    )
            
            # Store end date and ask for symptoms
            menu_data['end_date'] = end_date.isoformat() if end_date else None
            USSDSessionManager.update_session(
                session, 
                'cycle_log_symptoms', 
                menu_data=menu_data
            )
            
            end_date_str = end_date.strftime('%d/%m/%Y') if end_date else 'Ongoing'
            
            return USSDResponseBuilder.build_response(
                f"✅ Period: {start_date.strftime('%d/%m/%Y')} - {end_date_str}\\n\\n"
                "Any symptoms? (Optional)\\n\\n"
                "Common symptoms:\\n"
                "• Cramps\\n"
                "• Headache\\n"
                "• Mood swings\\n"
                "• Bloating\\n\\n"
                "Enter symptoms or press 'skip':"
            )
            
        except Exception as e:
            return USSDResponseBuilder.build_response(
                "❌ Error processing date!\\n"
                "Please try again.\\n\\n"
                "Enter end date or 'ongoing':"
            )
    
    @staticmethod
    def handle_cycle_log_symptoms(user_input, session, user):
        """Handle symptoms input"""
        menu_data = json.loads(session.menu_data) if session.menu_data else {}
        
        symptoms = None
        if user_input.strip().lower() not in ['skip', '']:
            symptoms = user_input.strip()[:500]  # Limit length
        
        menu_data['symptoms'] = symptoms
        USSDSessionManager.update_session(
            session, 
            'cycle_log_notes', 
            menu_data=menu_data
        )
        
        return USSDResponseBuilder.build_response(
            "Any additional notes? (Optional)\\n\\n"
            "Examples:\\n"
            "• Flow intensity (light/heavy)\\n"
            "• Medications taken\\n"
            "• Exercise impact\\n\\n"
            "Enter notes or press 'skip':"
        )
    
    @staticmethod
    def handle_cycle_log_notes(user_input, session, user):
        """Handle notes input and save cycle log"""
        try:
            menu_data = json.loads(session.menu_data) if session.menu_data else {}
            
            notes = None
            if user_input.strip().lower() not in ['skip', '']:
                notes = user_input.strip()[:500]  # Limit length
            
            # Create cycle log
            start_date = datetime.fromisoformat(menu_data['start_date'])
            end_date = datetime.fromisoformat(menu_data['end_date']) if menu_data.get('end_date') else None
            
            # Calculate cycle and period length
            cycle_length = None
            period_length = None
            
            if end_date:
                period_length = (end_date.date() - start_date.date()).days + 1
            
            # Try to calculate cycle length from previous period
            last_cycle = CycleLog.query.filter_by(user_id=user.id)\\
                .filter(CycleLog.start_date < start_date)\\
                .order_by(CycleLog.start_date.desc()).first()
            
            if last_cycle:
                cycle_length = (start_date.date() - last_cycle.start_date.date()).days
            
            new_log = CycleLog(
                user_id=user.id,
                start_date=start_date,
                end_date=end_date,
                cycle_length=cycle_length,
                period_length=period_length,
                symptoms=menu_data.get('symptoms'),
                notes=notes
            )
            
            db.session.add(new_log)
            db.session.commit()
            
            # Create prediction notification if possible
            if cycle_length and cycle_length > 0:
                next_period_date = start_date.date() + timedelta(days=cycle_length)
                
                notification = Notification(
                    user_id=user.id,
                    message=f"🩸 Your next period is predicted for {next_period_date.strftime('%d/%m/%Y')}",
                    notification_type='cycle'
                )
                db.session.add(notification)
                db.session.commit()
            
            # Return to cycle menu
            USSDSessionManager.update_session(session, 'cycle_menu')
            
            success_msg = "✅ Period logged successfully!\\n\\n"
            if cycle_length:
                success_msg += f"📊 Cycle length: {cycle_length} days\\n"
            if period_length:
                success_msg += f"📊 Period length: {period_length} days\\n"
            
            success_msg += "\\n" + USSDMenuHandlers.get_submenu_response('cycle_menu', user)
            
            return USSDResponseBuilder.build_response(success_msg)
            
        except Exception as e:
            db.session.rollback()
            return USSDResponseBuilder.build_response(
                "❌ Error saving period log!\\n"
                "Please try again or contact support.\\n\\n"
                "9. Back to Cycle Menu\\n"
                "0. Exit"
            )
    
    @staticmethod
    def get_last_period(user):
        """Get user's last period information"""
        last_log = CycleLog.query.filter_by(user_id=user.id)\\
            .order_by(CycleLog.start_date.desc()).first()
        
        if not last_log:
            return USSDResponseBuilder.build_response(
                "📝 No period logs found.\\n"
                "Start tracking by logging your first period!\\n\\n"
                "1. Log New Period\\n"
                "9. Back to Cycle Menu\\n"
                "0. Exit"
            )
        
        start_date = last_log.start_date.strftime('%d/%m/%Y')
        end_date = last_log.end_date.strftime('%d/%m/%Y') if last_log.end_date else 'Ongoing'
        
        response = f"🩸 Your Last Period:\\n\\n"
        response += f"📅 Started: {start_date}\\n"
        response += f"📅 Ended: {end_date}\\n"
        
        if last_log.period_length:
            response += f"⏱️ Duration: {last_log.period_length} days\\n"
        
        if last_log.symptoms:
            response += f"🤒 Symptoms: {last_log.symptoms}\\n"
        
        if last_log.notes:
            response += f"📝 Notes: {last_log.notes}\\n"
        
        response += "\\n9. Back to Cycle Menu\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    @staticmethod
    def get_cycle_stats(user):
        """Get user's cycle statistics"""
        logs = CycleLog.query.filter_by(user_id=user.id)\\
            .order_by(CycleLog.start_date).all()
        
        if len(logs) < 2:
            return USSDResponseBuilder.build_response(
                "📊 Not enough data for statistics.\\n"
                "Log at least 2 periods to see your cycle stats!\\n\\n"
                "1. Log New Period\\n"
                "9. Back to Cycle Menu\\n"
                "0. Exit"
            )
        
        # Calculate averages
        cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
        period_lengths = [log.period_length for log in logs if log.period_length]
        
        avg_cycle = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else None
        avg_period = sum(period_lengths) / len(period_lengths) if period_lengths else None
        
        response = f"📊 Your Cycle Statistics:\\n\\n"
        response += f"📈 Total periods logged: {len(logs)}\\n"
        
        if avg_cycle:
            response += f"🔄 Average cycle: {avg_cycle:.1f} days\\n"
        
        if avg_period:
            response += f"⏱️ Average period: {avg_period:.1f} days\\n"
        
        # Latest period info
        latest = logs[-1]
        days_since = (datetime.now().date() - latest.start_date.date()).days
        response += f"📅 Last period: {days_since} days ago\\n"
        
        response += "\\n9. Back to Cycle Menu\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    @staticmethod
    def predict_next_period(user):
        """Predict user's next period"""
        logs = CycleLog.query.filter_by(user_id=user.id)\\
            .order_by(CycleLog.start_date).all()
        
        if len(logs) < 2:
            return USSDResponseBuilder.build_response(
                "🔮 Cannot predict yet!\\n"
                "Log at least 2 periods for predictions.\\n\\n"
                "1. Log New Period\\n"
                "9. Back to Cycle Menu\\n"
                "0. Exit"
            )
        
        # Calculate average cycle length
        cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
        
        if not cycle_lengths:
            return USSDResponseBuilder.build_response(
                "🔮 Cannot predict yet!\\n"
                "Need complete cycle data for predictions.\\n\\n"
                "1. Log New Period\\n"
                "9. Back to Cycle Menu\\n"
                "0. Exit"
            )
        
        avg_cycle = sum(cycle_lengths) / len(cycle_lengths)
        latest_period = logs[-1].start_date.date()
        predicted_date = latest_period + timedelta(days=int(avg_cycle))
        
        days_until = (predicted_date - datetime.now().date()).days
        
        response = f"🔮 Next Period Prediction:\\n\\n"
        response += f"📅 Predicted date: {predicted_date.strftime('%d/%m/%Y')}\\n"
        
        if days_until > 0:
            response += f"⏰ In {days_until} days\\n"
        elif days_until == 0:
            response += f"⏰ Today!\\n"
        else:
            response += f"⏰ {abs(days_until)} days overdue\\n"
        
        response += f"📊 Based on {avg_cycle:.1f} day average cycle\\n"
        response += "\\n💡 This is an estimate. Cycles can vary naturally.\\n"
        response += "\\n9. Back to Cycle Menu\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    # ==================== MEAL TRACKING ====================
    
    @staticmethod
    def handle_meals_menu(user_input, session, user):
        """Handle meals menu navigation"""
        if user_input == '1':
            # Log New Meal
            USSDSessionManager.update_session(session, 'meal_log_type')
            return USSDResponseBuilder.build_response(
                "🍽️ Log New Meal\\n\\n"
                "What type of meal?\\n\\n"
                "1. 🌅 Breakfast\\n"
                "2. ☀️ Lunch\\n"
                "3. 🌙 Dinner\\n"
                "4. 🍎 Snack\\n\\n"
                "Select meal type:"
            )
        elif user_input == '2':
            # View Today's Meals
            return USSDCoreHandlers.get_todays_meals(user)
        elif user_input == '9':
            # Back to main menu
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
                USSDMenuHandlers.get_submenu_response('meals_menu', user)
            )
    
    @staticmethod
    def handle_meal_log_type(user_input, session, user):
        """Handle meal type selection"""
        meal_types = {
            '1': 'breakfast',
            '2': 'lunch', 
            '3': 'dinner',
            '4': 'snack'
        }
        
        if user_input in meal_types:
            meal_type = meal_types[user_input]
            menu_data = {'meal_type': meal_type}
            
            USSDSessionManager.update_session(
                session, 
                'meal_log_description', 
                menu_data=menu_data
            )
            
            meal_emoji = {'breakfast': '🌅', 'lunch': '☀️', 'dinner': '🌙', 'snack': '🍎'}
            
            return USSDResponseBuilder.build_response(
                f"{meal_emoji[meal_type]} {meal_type.title()} Log\\n\\n"
                "Describe your meal:\\n\\n"
                "💡 Examples:\\n"
                "• Rice with beans and vegetables\\n"
                "• Banana and milk\\n"
                "• Chicken soup with bread\\n\\n"
                "Enter meal description:"
            )
        else:
            return USSDResponseBuilder.build_response(
                "Invalid option. Please select:\\n\\n"
                "1. 🌅 Breakfast\\n"
                "2. ☀️ Lunch\\n"
                "3. 🌙 Dinner\\n"
                "4. 🍎 Snack"
            )
    
    @staticmethod
    def handle_meal_log_description(user_input, session, user):
        """Handle meal description input"""
        description = user_input.strip()
        
        if len(description) < 3:
            return USSDResponseBuilder.build_response(
                "❌ Description too short!\\n"
                "Please describe your meal in more detail.\\n\\n"
                "Enter meal description:"
            )
        
        if len(description) > 200:
            return USSDResponseBuilder.build_response(
                "❌ Description too long!\\n"
                "Please keep it under 200 characters.\\n\\n"
                "Enter meal description:"
            )
        
        try:
            menu_data = json.loads(session.menu_data) if session.menu_data else {}
            
            # Create meal log
            new_meal = MealLog(
                user_id=user.id,
                meal_type=menu_data['meal_type'],
                meal_time=datetime.now(),
                description=description
            )
            
            db.session.add(new_meal)
            db.session.commit()
            
            # Return to meals menu
            USSDSessionManager.update_session(session, 'meals_menu')
            
            meal_emoji = {'breakfast': '🌅', 'lunch': '☀️', 'dinner': '🌙', 'snack': '🍎'}
            emoji = meal_emoji.get(menu_data['meal_type'], '🍽️')
            
            success_msg = f"✅ {emoji} {menu_data['meal_type'].title()} logged successfully!\\n\\n"
            success_msg += f"📝 {description}\\n\\n"
            success_msg += "Keep tracking for better nutrition insights!\\n\\n"
            success_msg += USSDMenuHandlers.get_submenu_response('meals_menu', user)
            
            return USSDResponseBuilder.build_response(success_msg)
            
        except Exception as e:
            db.session.rollback()
            return USSDResponseBuilder.build_response(
                "❌ Error saving meal log!\\n"
                "Please try again or contact support.\\n\\n"
                "9. Back to Meals Menu\\n"
                "0. Exit"
            )
    
    @staticmethod
    def get_todays_meals(user):
        """Get user's meals for today"""
        today = datetime.now().date()
        
        meals = MealLog.query.filter_by(user_id=user.id)\\
            .filter(db.func.date(MealLog.meal_time) == today)\\
            .order_by(MealLog.meal_time).all()
        
        if not meals:
            return USSDResponseBuilder.build_response(
                "🍽️ No meals logged today.\\n"
                "Start tracking your nutrition!\\n\\n"
                "1. Log New Meal\\n"
                "9. Back to Meals Menu\\n"
                "0. Exit"
            )
        
        response = f"🍽️ Today's Meals ({today.strftime('%d/%m/%Y')}):\\n\\n"
        
        meal_emoji = {'breakfast': '🌅', 'lunch': '☀️', 'dinner': '🌙', 'snack': '🍎'}
        
        for meal in meals:
            time_str = meal.meal_time.strftime('%H:%M')
            emoji = meal_emoji.get(meal.meal_type, '🍽️')
            response += f"{emoji} {time_str} - {meal.meal_type.title()}\\n"
            response += f"   {meal.description}\\n\\n"
        
        response += "9. Back to Meals Menu\\n0. Exit"
        
        return USSDResponseBuilder.build_response(response)
    
    # ==================== APPOINTMENTS ====================
    
    @staticmethod
    def handle_appointments_menu(user_input, session, user):
        """Handle appointments menu navigation"""
        if user_input == '1':
            # Book New Appointment
            USSDSessionManager.update_session(session, 'appointment_date')
            return USSDResponseBuilder.build_response(
                "📅 Book New Appointment\\n\\n"
                "When would you like to schedule?\\n"
                "Enter date (DD/MM/YYYY):\\n\\n"
                "💡 Examples:\\n"
                "• 25/12/2024\\n"
                "• 05/01/2025\\n\\n"
                "Enter appointment date:"
            )
        elif user_input == '2':
            # View Upcoming Appointments
            return USSDCoreHandlers.get_upcoming_appointments(user)
        elif user_input == '3':
            # Cancel Appointment
            return USSDCoreHandlers.get_appointments_to_cancel(user, session)
        elif user_input == '9':
            # Back to main menu
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
                USSDMenuHandlers.get_submenu_response('appointments_menu', user)
            )
    
    # ==================== UTILITY FUNCTIONS ====================
    
    @staticmethod
    def parse_date(date_str):
        """Parse date string in DD/MM/YYYY format"""
        try:
            # Try DD/MM/YYYY format
            return datetime.strptime(date_str, '%d/%m/%Y').date()
        except ValueError:
            try:
                # Try D/M/YYYY format
                return datetime.strptime(date_str, '%d/%m/%Y').date()
            except ValueError:
                try:
                    # Try DD/M/YYYY format
                    return datetime.strptime(date_str, '%d/%m/%Y').date()
                except ValueError:
                    return None

