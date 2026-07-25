import os
import re
import json
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from apscheduler.schedulers.background import BackgroundScheduler

DATABASE_PATH = os.environ.get('DATABASE_PATH', 'data/updates.db')
app = Flask(__name__, static_folder='frontend/project/dist', static_url_path='')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', os.urandom(24).hex())
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

EMAIL_ADDRESS = os.environ.get('EMAIL_ADDRESS', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))

EMAIL_FILE = 'emails.txt'
LAST_UPDATES_FILE = 'last_updates.txt'


def get_db():
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    try:
        conn = get_db()
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS updates_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS update_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                link TEXT,
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] Init error (will use file fallback): {e}")


def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def scrape_college_updates():
    url = os.environ.get('SCRAPE_URL', 'https://www.cbit.ac.in/')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, timeout=10, headers=headers)
        if response.status_code != 200:
            return f"Error: Unable to fetch page. Status code {response.status_code}"

        soup = BeautifulSoup(response.text, 'html.parser')

        updates_container = soup.find('marquee')
        if not updates_container:
            updates_container = soup.find('div', class_=['updates', 'news', 'notifications'])
        if not updates_container:
            updates_container = soup.find('ul', class_=['news-list', 'updates-list'])

        if updates_container:
            updates = updates_container.find_all('a')
            scraped_data = []
            for update in updates:
                title = update.text.strip()
                link = update.get('href')
                if title:
                    scraped_data.append({'title': title, 'link': link})
            return scraped_data
        else:
            all_links = soup.find_all('a')[:20]
            scraped_data = []
            for link in all_links:
                title = link.text.strip()
                href = link.get('href')
                if title and len(title) > 10 and href and 'cbit.ac.in' in str(href):
                    scraped_data.append({'title': title, 'link': href})
            if scraped_data:
                return scraped_data
            return "Could not find any updates on the homepage."

    except requests.exceptions.RequestException as e:
        return f"Error during scraping: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def get_subscribers():
    try:
        conn = get_db()
        rows = conn.execute('SELECT email FROM subscribers').fetchall()
        conn.close()
        return [row['email'] for row in rows] if rows else []
    except Exception:
        if os.path.exists(EMAIL_FILE):
            try:
                with open(EMAIL_FILE, 'r') as f:
                    return [email.strip() for email in f.read().splitlines() if email.strip()]
            except Exception:
                pass
    return []


def save_subscriber(email):
    if not is_valid_email(email):
        return False
    try:
        conn = get_db()
        conn.execute('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', (email,))
        conn.commit()
        affected = conn.total_changes
        conn.close()
        if affected == 0 and email in get_subscribers():
            return True
        return affected > 0
    except Exception:
        if not os.path.exists(EMAIL_FILE):
            open(EMAIL_FILE, 'a').close()
        try:
            with open(EMAIL_FILE, 'r+') as f:
                subscribers = [e.strip() for e in f.read().splitlines()]
                if email not in subscribers:
                    f.seek(0, 2)
                    f.write(f"{email}\n")
                    return True
        except Exception as e:
            print(f"Error saving subscriber: {e}")
    return False


def send_email_notification(new_updates):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("[EMAIL] Skipped: credentials not configured")
        return
    try:
        subscribers = get_subscribers()
        if not subscribers:
            print("[EMAIL] No subscribers to send emails to.")
            return

        subject = "New Updates from CBIT Website!"
        body = "Hello,\n\nThere are new updates from the college website:\n\n"
        for update in new_updates[:10]:
            body += f"- {update['title']}\n"
        body += "\nCheck them out here: https://www.cbit.ac.in/\n"

        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = EMAIL_ADDRESS
        msg['Subject'] = subject
        msg.attach(MIMEText(body))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.sendmail(EMAIL_ADDRESS, subscribers, msg.as_string())

        print(f"[EMAIL] Sent to {len(subscribers)} subscribers.")
    except Exception as e:
        print(f"[EMAIL] Error: {e}")


def load_cached_updates():
    try:
        conn = get_db()
        row = conn.execute('SELECT data FROM updates_cache ORDER BY fetched_at DESC LIMIT 1').fetchone()
        conn.close()
        if row:
            return json.loads(row['data'])
    except Exception:
        pass
    if os.path.exists(LAST_UPDATES_FILE):
        try:
            with open(LAST_UPDATES_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                raw = f.read().strip()
            if raw:
                import ast
                data = ast.literal_eval(raw)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []


def save_cached_updates(data):
    try:
        conn = get_db()
        conn.execute('DELETE FROM updates_cache')
        conn.execute('INSERT INTO updates_cache (data) VALUES (?)', (json.dumps(data),))
        conn.commit()
        conn.close()
    except Exception:
        try:
            with open(LAST_UPDATES_FILE, 'w', encoding='utf-8') as f:
                f.write(str(data))
        except Exception as e:
            print(f"Error saving cache: {e}")


def monitor_updates():
    current_updates = scrape_college_updates()
    if isinstance(current_updates, list):
        cached = load_cached_updates()
        if json.dumps(current_updates, sort_keys=True) != json.dumps(cached, sort_keys=True):
            print("[MONITOR] New updates detected! Sending notifications.")
            send_email_notification(current_updates)
            save_cached_updates(current_updates)
            try:
                conn = get_db()
                for u in current_updates[:20]:
                    conn.execute('INSERT INTO update_log (title, link) VALUES (?, ?)',
                                 (u.get('title', ''), u.get('link', '')))
                conn.commit()
                conn.close()
            except Exception:
                pass


def init_scheduler():
    scheduler = BackgroundScheduler()
    interval = int(os.environ.get('SCRAPE_INTERVAL_SECONDS', '3600'))
    scheduler.add_job(monitor_updates, 'interval', seconds=interval, id='monitor_updates')
    scheduler.start()
    print(f"[SCHEDULER] Monitoring every {interval}s")
    return scheduler


scheduler = None


@app.route('/')
def home():
    updates = scrape_college_updates()
    if isinstance(updates, str):
        cached_updates = load_cached_updates()
        if cached_updates:
            flash('Showing cached updates because live updates could not be fetched right now.', 'warning')
            updates = cached_updates
        else:
            flash(updates, 'error')
            updates = []
    return render_template('index.html', updates=updates)


@app.route('/subscribe', methods=['GET', 'POST'])
def subscribe():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        if email:
            if not is_valid_email(email):
                flash('Please enter a valid email address.', 'error')
            elif save_subscriber(email):
                flash('You have been subscribed successfully!', 'success')
            else:
                flash('You are already subscribed or an error occurred.', 'info')
            return redirect(url_for('home'))
    return render_template('subscribe.html')


@app.route('/api/updates')
def api_updates():
    updates = scrape_college_updates()
    if isinstance(updates, str):
        cached_updates = load_cached_updates()
        if cached_updates:
            return jsonify(cached_updates)
        return jsonify({"error": updates}), 500
    return jsonify(updates)


@app.route('/api/subscribe', methods=['POST'])
def api_subscribe():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400
    if save_subscriber(email):
        return jsonify({"message": "Subscribed"}), 201
    subscribers = get_subscribers()
    if email in subscribers:
        return jsonify({"message": "Already subscribed"}), 200
    return jsonify({"error": "Failed to subscribe"}), 500


@app.route('/health')
def health():
    return jsonify({"status": "ok"})


@app.route('/api/stats')
def api_stats():
    subscribers = len(get_subscribers())
    cached = load_cached_updates()
    updates_count = len(cached)
    return jsonify({
        "subscribers": subscribers,
        "cached_updates": updates_count,
        "email_configured": bool(EMAIL_ADDRESS and EMAIL_PASSWORD)
    })


@app.route('/<path:path>')
def serve_react(path):
    dist_dir = Path(app.static_folder)
    if dist_dir.exists() and (dist_dir / 'index.html').exists():
        return app.send_static_file('index.html')
    return redirect(url_for('home'))


if __name__ == '__main__':
    init_db()
    if not os.environ.get('DEBUG'):
        scheduler = init_scheduler()
    port = int(os.environ.get('PORT', 5000))
    debug = bool(os.environ.get('DEBUG'))
    if debug:
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        print(f"[FLASK] Production mode — use 'gunicorn -w 2 -b 0.0.0.0:{port} app:app'")
        app.run(host='0.0.0.0', port=port)
