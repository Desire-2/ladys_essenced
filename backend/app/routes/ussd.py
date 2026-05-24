"""USSD transport layer — delegates to app.ussd package."""
from app.ussd.handlers import ussd_bp

__all__ = ['ussd_bp']
