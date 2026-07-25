#!/usr/bin/env python3
"""
Test script to verify email functionality
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Import the email function from app.py
from app import send_email_notification

def test_email():
    """Test the email functionality"""
    print("🧪 Testing Email Functionality...")
    print("=" * 50)
    
    # Test data
    test_updates = [
        {
            "title": "Test Notification - CBIT Updates",
            "link": "https://www.cbit.ac.in/test-notification"
        }
    ]
    
    try:
        print("📧 Attempting to send test email...")
        send_email_notification(test_updates)
        print("✅ Email test completed successfully!")
        print("📬 Check the registered email address for the test notification")
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        print("🔧 Please check your Outlook credentials in venv/.env")

if __name__ == "__main__":
    test_email() 