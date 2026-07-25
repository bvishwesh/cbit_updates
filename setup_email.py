#!/usr/bin/env python3
"""
Email Setup Script for CBIT Updates
This script helps you configure email settings for sending notifications.
"""

import os
import getpass
from pathlib import Path

def setup_email():
    print("🔧 CBIT Updates - Email Configuration")
    print("=" * 50)
    
    print("\n📧 Email Provider Options:")
    print("1. Gmail (Recommended for testing)")
    print("2. Outlook/Hotmail")
    print("3. Custom SMTP")
    
    choice = input("\nSelect your email provider (1-3): ").strip()
    
    if choice == "1":
        # Gmail setup
        print("\n📧 Gmail Setup:")
        print("Note: You'll need to use an 'App Password' instead of your regular password.")
        print("1. Enable 2-factor authentication on your Google account")
        print("2. Go to Google Account settings > Security > App passwords")
        print("3. Generate an app password for 'Mail'")
        print("4. Use that 16-character password below\n")
        
        email = input("Enter your Gmail address: ").strip()
        password = getpass.getpass("Enter your Gmail App Password: ").strip()
        
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        
    elif choice == "2":
        # Outlook setup
        print("\n📧 Outlook/Hotmail Setup:")
        print("Note: You may need to enable 'Less secure app access' or use an app password.\n")
        
        email = input("Enter your Outlook/Hotmail address: ").strip()
        password = getpass.getpass("Enter your password: ").strip()
        
        smtp_server = "smtp-mail.outlook.com"
        smtp_port = 587
        
    elif choice == "3":
        # Custom SMTP
        print("\n📧 Custom SMTP Setup:\n")
        
        email = input("Enter your email address: ").strip()
        password = getpass.getpass("Enter your password: ").strip()
        smtp_server = input("Enter SMTP server (e.g., smtp.gmail.com): ").strip()
        smtp_port = int(input("Enter SMTP port (e.g., 587): ").strip())
        
    else:
        print("❌ Invalid choice. Please run the script again.")
        return
    
    # Generate a random secret key for Flask
    import secrets
    secret_key = secrets.token_hex(24)
    
    # Create .env file
    env_content = f"""# Email Configuration for CBIT Updates
EMAIL_ADDRESS={email}
EMAIL_PASSWORD={password}
SMTP_SERVER={smtp_server}
SMTP_PORT={smtp_port}
FLASK_SECRET_KEY={secret_key}
"""
    
    env_file = Path(".env")
    env_file.write_text(env_content)
    
    print(f"\n✅ Email configuration saved to {env_file}")
    print(f"📧 Email: {email}")
    print(f"🔗 SMTP Server: {smtp_server}:{smtp_port}")
    
    # Test the configuration
    test = input("\n🧪 Would you like to test the email configuration? (y/n): ").strip().lower()
    if test == 'y':
        test_email_config(email, password, smtp_server, smtp_port)

def test_email_config(email, password, smtp_server, smtp_port):
    """Test the email configuration by sending a test email."""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        print("\n🧪 Testing email configuration...")
        
        # Create test message
        msg = MIMEMultipart()
        msg['From'] = email
        msg['To'] = email  # Send to yourself for testing
        msg['Subject'] = "CBIT Updates - Test Email"
        
        body = """
Hello!

This is a test email from your CBIT Updates notification system.

If you received this email, your email configuration is working correctly!

Best regards,
CBIT Updates System
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email, password)
            server.send_message(msg)
        
        print("✅ Test email sent successfully!")
        print(f"📧 Check your inbox at {email}")
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check your email and password")
        print("2. For Gmail: Make sure you're using an App Password")
        print("3. For Outlook: Enable 'Less secure app access'")
        print("4. Check if your email provider blocks SMTP access")

if __name__ == "__main__":
    setup_email() 