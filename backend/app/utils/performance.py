"""
Performance Monitoring Middleware
Tracks request timing, database queries, and identifies performance bottlenecks
"""

from time import time
from flask import g, request, current_app
from functools import wraps
import logging

# Configure performance logger
perf_logger = logging.getLogger('performance')
perf_logger.setLevel(logging.INFO)


def init_performance_monitoring(app):
    """Initialize performance monitoring for Flask app"""
    
    @app.before_request
    def start_timer():
        """Start request timer"""
        g.start_time = time()
        g.db_query_count = 0
        g.db_query_time = 0
    
    
    @app.after_request
    def log_request_time(response):
        """Log request timing and database stats"""
        if hasattr(g, 'start_time'):
            elapsed = time() - g.start_time
            
            # Log slow requests (> 2 seconds)
            if elapsed > 2.0:
                current_app.logger.warning(
                    f"SLOW REQUEST: {request.method} {request.path} "
                    f"took {elapsed:.2f}s | "
                    f"Queries: {getattr(g, 'db_query_count', 0)} | "
                    f"DB Time: {getattr(g, 'db_query_time', 0):.2f}s"
                )
            elif elapsed > 1.0:
                current_app.logger.info(
                    f"Request: {request.method} {request.path} "
                    f"took {elapsed:.2f}s"
                )
            
            # Add timing header for debugging
            response.headers['X-Request-Time'] = f"{elapsed:.3f}s"
            if hasattr(g, 'db_query_count'):
                response.headers['X-DB-Query-Count'] = str(g.db_query_count)
        
        return response
    
    
    # Database query tracking
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Track query start time"""
        conn.info.setdefault('query_start_time', []).append(time())
    
    
    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Track query execution time"""
        total = time() - conn.info['query_start_time'].pop(-1)
        
        # Log slow queries (> 500ms)
        if total > 0.5:
            current_app.logger.warning(
                f"SLOW QUERY ({total:.2f}s): {statement[:200]}"
            )
        
        # Update request-level stats
        if hasattr(g, 'db_query_count'):
            g.db_query_count += 1
            g.db_query_time += total


def monitor_performance(threshold_seconds=1.0):
    """
    Decorator to monitor endpoint performance
    
    Args:
        threshold_seconds: Log warning if execution exceeds this threshold
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed = time() - start
                if elapsed > threshold_seconds:
                    current_app.logger.warning(
                        f"Endpoint {func.__name__} exceeded threshold: {elapsed:.2f}s"
                    )
        return wrapper
    return decorator


class PerformanceStats:
    """Track and report performance statistics"""
    
    def __init__(self):
        self.request_times = []
        self.slow_requests = []
        self.db_query_counts = []
    
    def record_request(self, method, path, duration, query_count):
        """Record request performance data"""
        self.request_times.append(duration)
        self.db_query_counts.append(query_count)
        
        if duration > 2.0:
            self.slow_requests.append({
                'method': method,
                'path': path,
                'duration': duration,
                'query_count': query_count
            })
    
    def get_summary(self):
        """Get performance summary statistics"""
        if not self.request_times:
            return {
                'total_requests': 0,
                'avg_time': 0,
                'max_time': 0,
                'avg_queries': 0,
                'slow_requests': 0
            }
        
        return {
            'total_requests': len(self.request_times),
            'avg_time': sum(self.request_times) / len(self.request_times),
            'max_time': max(self.request_times),
            'avg_queries': sum(self.db_query_counts) / len(self.db_query_counts),
            'slow_requests': len(self.slow_requests),
            'slow_request_details': self.slow_requests[-10:]  # Last 10 slow requests
        }


# Global performance stats instance
performance_stats = PerformanceStats()
