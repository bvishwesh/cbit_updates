# CBIT Updates - Notification System

A real-time notification system for Chaitanya Bharathi Institute of Technology (CBIT) updates with email notifications.

## Features

- 🔄 **Real-time Updates**: Automatically scrapes CBIT website for new announcements
- 📧 **Email Notifications**: Sends email alerts to subscribed users
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔍 **Search & Filter**: Find specific notifications easily
- ⚡ **Direct Links**: Click notifications to open official CBIT pages

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Email**: SMTP (Gmail, Outlook, or custom)
- **Web Scraping**: BeautifulSoup4 + Requests

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd cbitceo
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure email settings
python setup_email.py
```

### 3. Frontend Setup

```bash
cd frontend/project
npm install
```

### 4. Run the Application

```bash
# Terminal 1: Start backend (from project root)
.venv\Scripts\activate
python app.py

# Terminal 2: Start frontend (from frontend/project)
npm run dev -- --host
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:5000

## Email Configuration

### Option 1: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
3. **Run setup script**:
   ```bash
   python setup_email.py
   ```
4. **Select Gmail** and enter your email + app password

### Option 2: Outlook/Hotmail

1. **Enable "Less secure app access"** or use app password
2. Run `python setup_email.py`
3. Select Outlook and enter credentials

### Option 3: Custom SMTP

1. Get SMTP settings from your email provider
2. Run `python setup_email.py`
3. Select "Custom SMTP" and enter details

## How It Works

### Backend (Flask)
- **Scraping**: Checks CBIT website every hour for new updates
- **API Endpoints**:
  - `GET /api/updates` - Returns latest notifications
  - `POST /api/subscribe` - Adds email to subscription list
- **Email Service**: Sends notifications via SMTP when new updates are detected

### Frontend (React)
- **Real-time Updates**: Fetches notifications from backend API
- **Subscription Modal**: Collects user emails for notifications
- **Direct Links**: Opens official CBIT notification pages
- **Responsive UI**: Works on all device sizes

## File Structure

```
cbitceo/
├── app.py                 # Flask backend
├── setup_email.py         # Email configuration script
├── requirements.txt       # Python dependencies
├── .env                   # Email credentials (created by setup)
├── emails.txt            # Subscriber list (auto-created)
├── last_updates.txt      # Cache for change detection
├── frontend/
│   └── project/          # React frontend
│       ├── src/
│       │   ├── App.tsx   # Main application
│       │   └── index.css
│       ├── package.json
│       └── vite.config.ts
└── templates/            # Flask templates (legacy)
```

## API Endpoints

### GET /api/updates
Returns latest CBIT notifications.

**Response:**
```json
[
  {
    "title": "Notification Title",
    "link": "https://cbit.ac.in/notification-url"
  }
]
```

### POST /api/subscribe
Adds email to notification list.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Subscribed"
}
```

## Environment Variables

Create a `.env` file with:

```env
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

## Troubleshooting

### Email Not Working?
1. Check your email credentials in `.env`
2. For Gmail: Use App Password, not regular password
3. Test with `python setup_email.py`

### Frontend Not Loading?
1. Ensure both servers are running
2. Check browser console for errors
3. Verify Vite proxy settings in `vite.config.ts`

### Backend Errors?
1. Check Flask logs for error messages
2. Verify all dependencies are installed
3. Ensure CBIT website is accessible

## Development

### Adding New Features
1. Backend changes: Edit `app.py`
2. Frontend changes: Edit `frontend/project/src/App.tsx`
3. Restart servers after changes

### Customizing Email Templates
Edit the `send_email_notification()` function in `app.py`

### Modifying Scraping Logic
Edit the `scrape_college_updates()` function in `app.py`

## License

This project is for educational purposes. Please respect CBIT's website terms of service.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Flask and React logs
3. Verify email configuration with setup script 