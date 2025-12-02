"""
Query Optimization Utilities
Provides helper functions for optimizing database queries and preventing N+1 problems
"""

from functools import wraps
from time import time
from flask import current_app
from sqlalchemy.orm import joinedload, subqueryload, selectinload

def log_query_time(func):
    """Decorator to log query execution time for performance monitoring"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time()
        result = func(*args, **kwargs)
        elapsed = time() - start
        
        # Log slow queries (> 1 second)
        if elapsed > 1.0:
            current_app.logger.warning(
                f"SLOW QUERY: {func.__name__} took {elapsed:.2f}s"
            )
        elif elapsed > 0.5:
            current_app.logger.info(
                f"Query {func.__name__} took {elapsed:.2f}s"
            )
        
        return result
    return wrapper


def optimize_user_query(query, include_relations=False):
    """
    Optimize User query with common eager loading patterns
    
    Args:
        query: SQLAlchemy query object
        include_relations: Whether to eagerly load related data (parent/adolescent records)
    
    Returns:
        Optimized query object
    """
    if include_relations:
        # Eagerly load related tables to prevent N+1 queries
        query = query.options(
            joinedload('parent'),
            joinedload('adolescent'),
            joinedload('admin'),
            joinedload('health_provider'),
            joinedload('content_writer')
        )
    
    return query


def optimize_appointment_query(query, include_user=True, include_provider=True):
    """
    Optimize Appointment query with eager loading
    
    Args:
        query: SQLAlchemy query object
        include_user: Whether to load user data
        include_provider: Whether to load provider data
    
    Returns:
        Optimized query object
    """
    options = []
    
    if include_user:
        options.append(joinedload('user'))
    
    if include_provider:
        options.append(joinedload('health_provider'))
    
    if options:
        query = query.options(*options)
    
    return query


def optimize_cycle_log_query(query, include_user=False):
    """
    Optimize CycleLog query
    
    Args:
        query: SQLAlchemy query object
        include_user: Whether to load user data
    
    Returns:
        Optimized query object
    """
    if include_user:
        query = query.options(joinedload('user'))
    
    return query


def optimize_notification_query(query, include_user=False):
    """
    Optimize Notification query
    
    Args:
        query: SQLAlchemy query object
        include_user: Whether to load user data
    
    Returns:
        Optimized query object
    """
    if include_user:
        query = query.options(joinedload('user'))
    
    return query


def batch_fetch_related(model, primary_key_values, related_field):
    """
    Batch fetch related records to prevent N+1 queries
    
    Example:
        user_ids = [1, 2, 3, 4]
        appointments = batch_fetch_related(Appointment, user_ids, 'user_id')
    
    Args:
        model: SQLAlchemy model class
        primary_key_values: List of primary key values to fetch
        related_field: Field name to filter on
    
    Returns:
        Query result with all matching records
    """
    return model.query.filter(
        getattr(model, related_field).in_(primary_key_values)
    ).all()


# Query result caching decorator
def cache_query_result(timeout=300):
    """
    Cache query results for specified timeout
    NOTE: Requires Flask-Caching to be configured
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # For now, just pass through
            # TODO: Implement caching when Flask-Caching is added
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Common query optimization patterns
class QueryOptimizer:
    """Helper class for common query optimization patterns"""
    
    @staticmethod
    def paginate_with_count(query, page, per_page):
        """
        Efficient pagination that reuses count query
        
        Args:
            query: SQLAlchemy query
            page: Page number (1-indexed)
            per_page: Results per page
        
        Returns:
            tuple: (items, total_count, total_pages)
        """
        # Get total count
        total_count = query.count()
        
        # Calculate total pages
        total_pages = (total_count + per_page - 1) // per_page
        
        # Get page items
        offset = (page - 1) * per_page
        items = query.limit(per_page).offset(offset).all()
        
        return items, total_count, total_pages
    
    
    @staticmethod
    def bulk_fetch_user_stats(user_ids):
        """
        Fetch statistics for multiple users efficiently
        
        Args:
            user_ids: List of user IDs
        
        Returns:
            dict: User ID -> stats dictionary
        """
        from app.models import CycleLog, MealLog, Appointment, Notification
        from sqlalchemy import func
        
        # Fetch all stats in parallel queries
        cycle_counts = dict(
            db.session.query(
                CycleLog.user_id, 
                func.count(CycleLog.id)
            ).filter(
                CycleLog.user_id.in_(user_ids)
            ).group_by(CycleLog.user_id).all()
        )
        
        meal_counts = dict(
            db.session.query(
                MealLog.user_id,
                func.count(MealLog.id)
            ).filter(
                MealLog.user_id.in_(user_ids)
            ).group_by(MealLog.user_id).all()
        )
        
        appointment_counts = dict(
            db.session.query(
                Appointment.user_id,
                func.count(Appointment.id)
            ).filter(
                Appointment.user_id.in_(user_ids)
            ).group_by(Appointment.user_id).all()
        )
        
        # Combine results
        stats = {}
        for user_id in user_ids:
            stats[user_id] = {
                'cycle_logs': cycle_counts.get(user_id, 0),
                'meal_logs': meal_counts.get(user_id, 0),
                'appointments': appointment_counts.get(user_id, 0)
            }
        
        return stats
