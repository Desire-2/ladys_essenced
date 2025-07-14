#!/usr/bin/env python3
"""
Test script to verify the content submission functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app import create_app
from backend.app.models import ContentItem, db
from flask import Flask
import json

def test_submit_functionality():
    """Test the content submission workflow"""
    app = create_app()
    
    with app.app_context():
        # Find a draft content item
        draft_content = ContentItem.query.filter_by(status='draft').first()
        
        if not draft_content:
            print("No draft content found to test with")
            return
        
        print(f"Testing with content ID: {draft_content.id}")
        print(f"Initial status: {draft_content.status}")
        print(f"Title: {draft_content.title}")
        
        # Simulate the status change
        draft_content.status = 'pending_review'
        db.session.commit()
        
        # Verify the change
        updated_content = ContentItem.query.get(draft_content.id)
        print(f"Updated status: {updated_content.status}")
        
        if updated_content.status == 'pending_review':
            print("✅ Status update successful!")
        else:
            print("❌ Status update failed!")
        
        # Reset for next test
        updated_content.status = 'draft'
        db.session.commit()
        print("Reset status back to draft for next test")

if __name__ == "__main__":
    test_submit_functionality()
