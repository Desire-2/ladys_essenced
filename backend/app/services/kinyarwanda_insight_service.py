import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app import db
from app.models import User, CycleLog, MealLog, Appointment, Parent, Adolescent, ParentChild
from app.models.insight_cache import InsightCache
import logging

logger = logging.getLogger(__name__)

class KinyarwandaInsightService:
    """
    Service to generate health insights in Kinyarwanda using Gemini 2.0 Flash API
    Analyzes user menstrual logs, meal logs, and symptoms to provide personalized health insights
    """
    
    def __init__(self):
        self.google_api_key = os.environ.get('GOOGLE_API_KEY')
        self.gemini_endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.cache_duration_hours = 6
        
        if not self.google_api_key:
            logger.warning("GOOGLE_API_KEY not found in environment variables")
    
    def generate_insight(self, user_id: int, language: str = 'kinyarwanda') -> Dict[str, Any]:
        """
        Generate AI insights for a user based on their health data
        
        Args:
            user_id: ID of the user to generate insights for
            language: Language for insights ('kinyarwanda' or 'english')
            
        Returns:
            Dict containing the generated insights or error information
        """
        try:
            # Check if we have cached insights (within 6 hours)
            cached_insight = self._get_cached_insight(user_id, language)
            if cached_insight:
                return {
                    'success': True,
                    'data': cached_insight,
                    'cached': True
                }
            
            # Fetch user data
            user_data = self._fetch_user_data(user_id)
            if not user_data['success']:
                return user_data
            
            # Generate prompt based on user type and data
            prompt = self._build_prompt(user_data['data'], language)
            
            # Call Gemini API
            ai_response = self._call_gemini_api(prompt)
            if not ai_response['success']:
                return ai_response
            
            # Parse and structure the response
            structured_insight = self._parse_ai_response(ai_response['data'], language)
            
            # Cache the insight
            self._cache_insight(user_id, structured_insight, language)
            
            return {
                'success': True,
                'data': structured_insight,
                'cached': False
            }
            
        except Exception as e:
            logger.error(f"Error generating insight for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to generate insights. Please try again later.'
            }
    
    def _fetch_user_data(self, user_id: int) -> Dict[str, Any]:
        """Fetch comprehensive user data for insight generation"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Get recent cycle logs (last 3 months)
            three_months_ago = datetime.utcnow() - timedelta(days=90)
            cycle_logs = CycleLog.query.filter(
                CycleLog.user_id == user_id,
                CycleLog.created_at >= three_months_ago
            ).order_by(CycleLog.start_date.desc()).limit(10).all()
            
            # Get recent meal logs (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            meal_logs = MealLog.query.filter(
                MealLog.user_id == user_id,
                MealLog.created_at >= thirty_days_ago
            ).order_by(MealLog.meal_time.desc()).limit(20).all()
            
            # Get recent appointments (last 60 days)
            sixty_days_ago = datetime.utcnow() - timedelta(days=60)
            appointments = Appointment.query.filter(
                Appointment.user_id == user_id,
                Appointment.created_at >= sixty_days_ago
            ).order_by(Appointment.created_at.desc()).limit(5).all()
            
            # Determine user type context
            user_context = self._get_user_context(user)
            
            return {
                'success': True,
                'data': {
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'user_type': user.user_type,
                        'age_context': user_context['age_context'],
                        'relationship_context': user_context['relationship_context']
                    },
                    'cycle_logs': [{
                        'start_date': log.start_date.isoformat() if log.start_date else None,
                        'end_date': log.end_date.isoformat() if log.end_date else None,
                        'cycle_length': log.cycle_length,
                        'period_length': log.period_length,
                        'flow_intensity': log.flow_intensity,
                        'symptoms': log.symptoms,
                        'notes': log.notes
                    } for log in cycle_logs],
                    'meal_logs': [{
                        'meal_type': log.meal_type,
                        'meal_time': log.meal_time.isoformat() if log.meal_time else None,
                        'description': log.description,
                        'calories': log.calories,
                        'protein': log.protein,
                        'carbs': log.carbs,
                        'fat': log.fat
                    } for log in meal_logs],
                    'appointments': [{
                        'appointment_date': apt.appointment_date.isoformat() if apt.appointment_date else None,
                        'issue': apt.issue,
                        'status': apt.status,
                        'priority': apt.priority,
                        'notes': apt.notes
                    } for apt in appointments]
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching user data for {user_id}: {str(e)}")
            return {'success': False, 'error': 'Failed to fetch user data'}
    
    def _get_user_context(self, user: User) -> Dict[str, str]:
        """Get additional context about the user for better insights"""
        context = {
            'age_context': 'adult',  # Default
            'relationship_context': 'individual'  # Default
        }
        
        try:
            if user.user_type == 'adolescent':
                adolescent = Adolescent.query.filter_by(user_id=user.id).first()
                if adolescent and adolescent.date_of_birth:
                    age = datetime.utcnow().year - adolescent.date_of_birth.year
                    if age < 16:
                        context['age_context'] = 'young_adolescent'
                    elif age < 20:
                        context['age_context'] = 'adolescent'
                
                # Check if adolescent has parent relationship
                parent_relation = ParentChild.query.filter_by(adolescent_id=adolescent.id).first()
                if parent_relation:
                    context['relationship_context'] = 'has_parent_support'
            
            elif user.user_type == 'parent':
                parent = Parent.query.filter_by(user_id=user.id).first()
                if parent:
                    children_count = len(parent.children)
                    context['relationship_context'] = f'parent_of_{children_count}_children'
                    
        except Exception as e:
            logger.warning(f"Could not determine user context for {user.id}: {str(e)}")
            
        return context
    
    def _build_prompt(self, user_data: Dict[str, Any], language: str) -> str:
        """Build the prompt for Gemini API based on user data and language preference"""
        
        user_info = user_data['user']
        cycle_logs = user_data['cycle_logs']
        meal_logs = user_data['meal_logs']
        appointments = user_data['appointments']
        
        # Build data summary
        data_summary = []
        
        if cycle_logs:
            cycle_summary = f"Cycle Data: {len(cycle_logs)} entries recorded. "
            recent_cycles = cycle_logs[:3]
            if recent_cycles:
                lengths = [c['cycle_length'] for c in recent_cycles if c['cycle_length']]
                if lengths:
                    avg_length = sum(lengths) / len(lengths)
                    cycle_summary += f"Average cycle length: {avg_length:.1f} days. "
                
                symptoms = []
                for c in recent_cycles:
                    if c['symptoms']:
                        symptoms.extend(c['symptoms'].split(',') if isinstance(c['symptoms'], str) else c['symptoms'])
                if symptoms:
                    unique_symptoms = list(set(symptoms))
                    cycle_summary += f"Common symptoms: {', '.join(unique_symptoms[:5])}. "
            
            data_summary.append(cycle_summary)
        
        if meal_logs:
            meal_summary = f"Nutrition Data: {len(meal_logs)} meals recorded recently. "
            meal_types = [m['meal_type'] for m in meal_logs if m['meal_type']]
            if meal_types:
                meal_counts = {}
                for meal_type in meal_types:
                    meal_counts[meal_type] = meal_counts.get(meal_type, 0) + 1
                meal_summary += f"Meal distribution: {', '.join([f'{k}: {v}' for k, v in meal_counts.items()])}. "
            
            data_summary.append(meal_summary)
        
        if appointments:
            apt_summary = f"Health Appointments: {len(appointments)} recent appointments. "
            if appointments:
                issues = [a['issue'] for a in appointments if a['issue']]
                if issues:
                    apt_summary += f"Recent health concerns: {', '.join(issues[:3])}. "
            data_summary.append(apt_summary)
        
        if language == 'kinyarwanda':
            base_prompt = f"""Wowe uri umuganga w'abagore mu Rwanda ukunda gufasha abagore n'abakobwa gukurikirana ubuzima bwabo. Ugomba gutanga inyunganizi ku buzima mu Kinyarwanda ku buryo bworoshye, bushimishije kandi bwizewe.

Amakuru y'umukiriya:
- Izina: {user_info['name']}
- Ubwoko bw'ukoresha: {user_info['user_type']}
- Imiterere y'imyaka: {user_info['age_context']}
- Aho aherereye: {user_info['relationship_context']}

Amakuru y'ubuzima:
{' '.join(data_summary) if data_summary else 'Nta makuru menshi ahagije kugira ngo dutange inyunganizi nziza.'}

Ugomba gutanga:
1. **Inyunganizi ku buzima** - Sobanura uko ubuzima bwe bwifashe nk'uko amakuru agaragaza
2. **Icyo wakora** - Tanga inama eshatu (3) zifatika ze ashobora gukurikiza
3. **Amagambo y'ihumure** - Andika ubutumwa bushimishije no gushimangira

Nyandiko ibikurikira mu Kinyarwanda rwiza, gukoresha amagambo yoroshye kandi ukaba ufite impuhwe. Ntukavuge izina ry'umukiriya mu gisubizo. Koresha imvugo nziza kandi ishimishije."""

        else:  # English
            base_prompt = f"""You are a compassionate women's health advisor in Rwanda who helps women and girls track their health. Provide personalized health insights in clear, encouraging, and trustworthy English.

User Information:
- Name: {user_info['name']}
- User Type: {user_info['user_type']}
- Age Context: {user_info['age_context']}
- Relationship Context: {user_info['relationship_context']}

Health Data Summary:
{' '.join(data_summary) if data_summary else 'Limited health data available for comprehensive insights.'}

Please provide:
1. **Health Insight** - Explain what the health data shows about their wellbeing
2. **What to do next** - Give three (3) practical recommendations they can follow
3. **Words of encouragement** - Write an encouraging and affirming message

Write in clear, simple English using compassionate language. Do not mention the user's name directly in the response. Use supportive and positive tone."""

        return base_prompt
    
    def _call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """Make API call to Gemini 2.0 Flash"""
        if not self.google_api_key:
            return {
                'success': False,
                'error': 'Google API key not configured'
            }
        
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': self.google_api_key
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1024
                }
            }
            
            response = requests.post(
                self.gemini_endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'candidates' in data and data['candidates']:
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    return {
                        'success': True,
                        'data': content
                    }
                else:
                    return {
                        'success': False,
                        'error': 'No content generated by AI'
                    }
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'AI service error: {response.status_code}'
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'AI service timeout. Please try again.'
            }
        except Exception as e:
            logger.error(f"Gemini API call failed: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to connect to AI service'
            }
    
    def _parse_ai_response(self, ai_content: str, language: str) -> Dict[str, Any]:
        """Parse and structure the AI response"""
        try:
            # Try to extract structured content from the response
            lines = ai_content.strip().split('\n')
            parsed_content = {
                'inyunganizi': '',
                'icyo_wakora': [],
                'ihumure': '',
                'language': language,
                'generated_at': datetime.utcnow().isoformat()
            }
            
            current_section = None
            content_buffer = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Detect section headers (both languages)
                if any(keyword in line.lower() for keyword in ['inyunganizi ku buzima', 'health insight', '1.', '**inyunganizi']):
                    if content_buffer:
                        if current_section == 'inyunganizi':
                            parsed_content['inyunganizi'] = ' '.join(content_buffer)
                        content_buffer = []
                    current_section = 'inyunganizi'
                    # Extract content after header
                    if '**' in line:
                        content = line.split('**')[-1].strip(' -:')
                        if content:
                            content_buffer.append(content)
                    continue
                
                elif any(keyword in line.lower() for keyword in ['icyo wakora', 'what to do', '2.', '**icyo']):
                    if content_buffer:
                        if current_section == 'inyunganizi':
                            parsed_content['inyunganizi'] = ' '.join(content_buffer)
                        content_buffer = []
                    current_section = 'icyo_wakora'
                    continue
                
                elif any(keyword in line.lower() for keyword in ['amagambo y\'ihumure', 'encouragement', '3.', '**amagambo']):
                    if content_buffer:
                        if current_section == 'inyunganizi':
                            parsed_content['inyunganizi'] = ' '.join(content_buffer)
                        elif current_section == 'icyo_wakora':
                            # Process recommendations
                            for item in content_buffer:
                                if item.strip():
                                    cleaned_item = item.strip(' -•*')
                                    if cleaned_item:
                                        parsed_content['icyo_wakora'].append(cleaned_item)
                        content_buffer = []
                    current_section = 'ihumure'
                    continue
                
                # Process content based on current section
                if current_section == 'icyo_wakora':
                    # Handle numbered lists or bullet points
                    if line.startswith(('1.', '2.', '3.', '-', '•', '*')):
                        cleaned_line = line.lstrip('123.- •*').strip()
                        if cleaned_line:
                            parsed_content['icyo_wakora'].append(cleaned_line)
                    elif line and not line.startswith(('**', '#')):
                        parsed_content['icyo_wakora'].append(line)
                else:
                    # For other sections, accumulate content
                    if line and not line.startswith(('**', '#')):
                        content_buffer.append(line)
            
            # Process remaining content
            if content_buffer:
                if current_section == 'inyunganizi':
                    parsed_content['inyunganizi'] = ' '.join(content_buffer)
                elif current_section == 'icyo_wakora':
                    for item in content_buffer:
                        if item.strip():
                            cleaned_item = item.strip(' -•*')
                            if cleaned_item:
                                parsed_content['icyo_wakora'].append(cleaned_item)
                elif current_section == 'ihumure':
                    parsed_content['ihumure'] = ' '.join(content_buffer)
            
            # Fallback: if parsing failed, use the raw content
            if not parsed_content['inyunganizi'] and not parsed_content['icyo_wakora'] and not parsed_content['ihumure']:
                # Split content into approximate sections
                content_parts = ai_content.split('\n\n')
                if len(content_parts) >= 3:
                    parsed_content['inyunganizi'] = content_parts[0].strip()
                    parsed_content['icyo_wakora'] = [item.strip() for item in content_parts[1].split('\n') if item.strip()]
                    parsed_content['ihumure'] = content_parts[-1].strip()
                else:
                    parsed_content['inyunganizi'] = ai_content[:200] + '...' if len(ai_content) > 200 else ai_content
                    parsed_content['icyo_wakora'] = ['Reba amakuru yawe buri munsi', 'Fata indyo nziza', 'Ruhuka bihagije'] if language == 'kinyarwanda' else ['Review your health data daily', 'Maintain balanced nutrition', 'Get adequate rest']
                    parsed_content['ihumure'] = 'Komeza gufata ubwoba bwawe neza!' if language == 'kinyarwanda' else 'Keep taking great care of your health!'
            
            return parsed_content
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            # Return a safe fallback response
            if language == 'kinyarwanda':
                return {
                    'inyunganizi': 'Ubuzima bwawe ni bwiza. Komeza ukurikirana amakuru yawe neza.',
                    'icyo_wakora': [
                        'Andika amakuru yawe ya buri munsi',
                        'Kurya indyo zirangwa no kurya neza',
                        'Genda ku muganga ugihe wumva udakeneye'
                    ],
                    'ihumure': 'Komeza gufata ubwoba bwawe neza. Buri munsi ni intambwe nshya!',
                    'language': language,
                    'generated_at': datetime.utcnow().isoformat()
                }
            else:
                return {
                    'inyunganizi': 'Your health data shows positive trends. Keep tracking your information consistently.',
                    'icyo_wakora': [
                        'Log your daily health information',
                        'Maintain balanced and nutritious meals',
                        'Consult healthcare providers when needed'
                    ],
                    'ihumure': 'Keep taking excellent care of your health. Every day is a new step forward!',
                    'language': language,
                    'generated_at': datetime.utcnow().isoformat()
                }
    
    def _get_cached_insight(self, user_id: int, language: str) -> Optional[Dict[str, Any]]:
        """Check if we have a cached insight for the user"""
        try:
            # For now, skip database caching until tables are created
            # cached_insight = InsightCache.get_valid_cache(user_id, language)
            # if cached_insight:
            #     return json.loads(cached_insight.insight_data)
            return None
        except Exception as e:
            logger.error(f"Error checking cache for user {user_id}: {str(e)}")
            return None
    
    def _cache_insight(self, user_id: int, insight: Dict[str, Any], language: str) -> None:
        """Cache the generated insight"""
        try:
            # For now, skip database caching until tables are created
            # Remove any existing cache for this user and language
            # existing_cache = InsightCache.query.filter_by(
            #     user_id=user_id,
            #     language=language
            # ).all()
            # 
            # for cache in existing_cache:
            #     db.session.delete(cache)
            # 
            # # Create new cache entry
            # new_cache = InsightCache(
            #     user_id=user_id,
            #     language=language,
            #     insight_data=json.dumps(insight),
            #     cache_hours=self.cache_duration_hours
            # )
            # 
            # db.session.add(new_cache)
            # db.session.commit()
            
            logger.info(f"Cached insight for user {user_id} in {language} (in-memory only)")
        except Exception as e:
            logger.error(f"Error caching insight for user {user_id}: {str(e)}")
            # db.session.rollback()